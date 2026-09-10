import { SlashCommandBuilder, ChannelType, PermissionFlagsBits } from 'discord.js';
import { roomManager } from '../services/roomManager.js';
import { buildRoomMessage, buildRoomEndedMessage, buildHelpEmbed } from '../utils/embeds.js';

export const data = new SlashCommandBuilder()
  .setName('astra')
  .setDescription('Manage Astra screenshare rooms for voice channels')
  .addSubcommand((sub) =>
    sub
      .setName('room')
      .setDescription('Get or create an Astra screensharing room for your voice channel')
  )
  .addSubcommand((sub) =>
    sub
      .setName('end')
      .setDescription('Close the active Astra screensharing room for your voice channel')
  )
  .addSubcommand((sub) =>
    sub
      .setName('help')
      .setDescription('Learn how Astra screensharing works')
  );

/**
 * Executes the /astra slash command.
 * @param {import('discord.js').ChatInputCommandInteraction} interaction
 */
export async function execute(interaction) {
  const subcommand = interaction.options.getSubcommand();

  if (subcommand === 'help') {
    return interaction.reply({ embeds: [buildHelpEmbed()], ephemeral: true });
  }

  // Ensure member is in a voice channel for 'room' and 'end'
  const memberVoiceChannel = interaction.member?.voice?.channel;
  if (!memberVoiceChannel) {
    return interaction.reply({
      content: '⚠️ You need to be inside a voice channel to use this command!',
      ephemeral: true,
    });
  }

  const channelId = memberVoiceChannel.id;

  if (subcommand === 'end') {
    if (!roomManager.hasRoom(channelId)) {
      return interaction.reply({
        content: `ℹ️ There is no active Astra room for **#${memberVoiceChannel.name}**.`,
        ephemeral: true,
      });
    }

    const session = await roomManager.endRoom(channelId);
    if (!session) {
      return interaction.reply({ content: 'Could not close room session.', ephemeral: true });
    }

    return interaction.reply(buildRoomEndedMessage(session));
  }

  if (subcommand === 'room') {
    await interaction.deferReply();

    const { session, isNew } = await roomManager.getOrCreateRoom({
      channelId,
      channelName: memberVoiceChannel.name,
      guildId: interaction.guildId,
      userId: interaction.user.id,
      userName: interaction.user.displayName || interaction.user.username,
    });

    const messagePayload = buildRoomMessage(session, { mentionUser: interaction.user.id });

    if (!session.messageId) {
      const reply = await interaction.editReply(messagePayload);
      roomManager.setMessageId(channelId, reply.id);
    } else {
      await interaction.editReply({
        ...messagePayload,
        content: isNew
          ? messagePayload.content
          : `ℹ️ An active Astra room is already open for **#${memberVoiceChannel.name}**:\n${session.url}`,
      });
    }
  }
}
