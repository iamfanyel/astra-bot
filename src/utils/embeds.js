import { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } from 'discord.js';

// Astra Brand Theme Colors
export const BRAND_COLOR = 0x6366F1; // Indigo / Purple
export const BRAND_SUCCESS = 0x10B981; // Emerald
export const BRAND_MUTED = 0x64748B; // Slate

/**
 * Creates the simplified message for an Astra room:
 * - Plain message text: **Astra** (<url>)
 * - No embed
 * - Button to copy the room code
 *
 * @param {import('../services/roomManager.js').RoomSession} session
 * @param {Object} [options]
 * @returns {{ content: string, embeds: [], components: ActionRowBuilder[] }}
 */
export function buildRoomMessage(session, options = {}) {
  const row = new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setCustomId(`copy_code_${session.code}`)
      .setLabel(`Copy Code: ${session.code}`)
      .setStyle(ButtonStyle.Secondary)
      .setEmoji('📋')
  );

  return {
    content: `**Astra** <${session.url}>`,
    embeds: [],
    components: [row],
  };
}

/**
 * Creates the message shown when an Astra room session ends (all users left).
 *
 * @param {import('../services/roomManager.js').RoomSession} session
 * @returns {{ embeds: EmbedBuilder[], components: ActionRowBuilder[] }}
 */
export function buildRoomEndedMessage(session) {
  return {
    content: `🔌 Astra room for **#${session.channelName}** (\`${session.code}\`) has ended.`,
    embeds: [],
    components: [],
  };
}

/**
 * Creates a help embed explaining Astra and available commands.
 * @returns {EmbedBuilder}
 */
export function buildHelpEmbed() {
  return new EmbedBuilder()
    .setColor(BRAND_COLOR)
    .setTitle('ℹ️ About Astra Screensharing')
    .setURL('https://astrascreen.live/')
    .setDescription(
      `**Astra** is a fast, web-based peer-to-peer screen and audio sharing service.\n` +
      `Learn more at [astrascreen.live](https://astrascreen.live/).`
    )
    .addFields(
      {
        name: '🤖 Automatic Voice Channel Rooms',
        value: 'Whenever you or your friends join a voice channel, the bot automatically generates a private room and shares the link right here in the channel chat.',
      },
      {
        name: '💻 Slash Commands',
        value:
          '• `/astra room` — Get or create a room for your current voice channel\n' +
          '• `/astra end` — Close the current Astra room for this channel\n' +
          '• `/astra help` — Show this help message',
      },
      {
        name: '🔒 Privacy & Quality',
        value: 'Audio and video are encrypted and sent directly peer-to-peer between viewers without passing through intermediary recording servers.',
      }
    )
    .setFooter({ text: 'Astra • Peer to peer, no install, no account' });
}
