import { ChannelType, PermissionFlagsBits } from 'discord.js';
import { roomManager } from '../services/roomManager.js';
import { buildRoomMessage } from '../utils/embeds.js';
import { config } from '../config.js';

/**
 * Handles voiceStateUpdate events to detect voice channel joins and leaves.
 *
 * @param {import('discord.js').VoiceState} oldState
 * @param {import('discord.js').VoiceState} newState
 */
export async function handleVoiceStateUpdate(oldState, newState) {
  // Ignore bot voice updates
  if (newState.member?.user?.bot || oldState.member?.user?.bot) {
    return;
  }

  const member = newState.member || oldState.member;
  const user = member?.user;
  const userName = member?.displayName || user?.username || 'User';

  const joinedChannelId = newState.channelId;
  const leftChannelId = oldState.channelId;

  // Check if voice state changed channel (ignore deafen/mute/stream toggle events)
  const isChannelChange = joinedChannelId !== leftChannelId;
  if (!isChannelChange) {
    return;
  }

  // =========================================================================
  // 1. USER JOINED A VOICE CHANNEL (or switched to a new one)
  // =========================================================================
  if (joinedChannelId && newState.channel) {
    const channel = newState.channel;

    // Verify channel type: GuildVoice or GuildStageVoice
    if (channel.type !== ChannelType.GuildVoice && channel.type !== ChannelType.GuildStageVoice) {
      return;
    }

    // Check channel whitelist if configured
    if (
      config.astra.voiceChannelIds.length > 0 &&
      !config.astra.voiceChannelIds.includes(joinedChannelId)
    ) {
      return;
    }

    // Check bot permissions in this channel
    const clientMember = channel.guild.members.me;
    if (clientMember) {
      const perms = channel.permissionsFor(clientMember);
      if (!perms.has(PermissionFlagsBits.ViewChannel) || !perms.has(PermissionFlagsBits.SendMessages)) {
        console.warn(`[VoiceState] Missing ViewChannel/SendMessages permission in #${channel.name} (${channel.id})`);
        return;
      }
    }

    // Only send when the FIRST user joins the voice channel (channel was empty)
    const humanCount = channel.members.filter((m) => !m.user.bot).size;
    if (humanCount !== 1) {
      return;
    }

    try {
      // Get existing room or create a new Astra room
      const { session, isNew } = await roomManager.getOrCreateRoom({
        channelId: channel.id,
        channelName: channel.name,
        guildId: channel.guild.id,
        userId: member.id,
        userName,
      });

      // Only send message if this is a newly created room session
      // (avoid spamming the chat every time another person joins an existing call)
      if (isNew) {
        console.log(`[VoiceState] User ${userName} joined #${channel.name}. Sending Astra room link...`);

        const messagePayload = buildRoomMessage(session, { mentionUser: member.id });
        const sentMessage = await channel.send(messagePayload);
        roomManager.setMessageId(channel.id, sentMessage.id);
      }
    } catch (err) {
      console.error(`[VoiceState] Failed to create or post Astra room in #${channel.name}:`, err);
    }
  }

  // =========================================================================
  // 2. USER LEFT A VOICE CHANNEL (or switched away)
  // =========================================================================
  if (leftChannelId && oldState.channel && config.astra.autoCleanupOnEmpty) {
    const channel = oldState.channel;

    // Count remaining non-bot members in the voice channel
    const remainingHumans = channel.members.filter((m) => !m.user.bot).size;

    if (remainingHumans === 0 && roomManager.hasRoom(channel.id)) {
      console.log(`[VoiceState] Voice channel #${channel.name} is now empty. Ending Astra room...`);

      try {
        await roomManager.endRoom(channel.id);
      } catch (err) {
        console.error(`[VoiceState] Error cleaning up room for #${channel.name}:`, err);
      }
    }
  }
}
