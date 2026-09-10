import 'dotenv/config';

export const config = {
  discord: {
    token: process.env.DISCORD_TOKEN || '',
    clientId: process.env.DISCORD_CLIENT_ID || '',
    guildId: process.env.DISCORD_GUILD_ID || null,
  },
  astra: {
    baseUrl: (process.env.ASTRA_BASE_URL || 'https://astrascreen.live').replace(/\/+$/, ''),
    autoCleanupOnEmpty: process.env.AUTO_CLEANUP_ON_EMPTY !== 'false',
    voiceChannelIds: process.env.VOICE_CHANNEL_IDS
      ? process.env.VOICE_CHANNEL_IDS.split(',').map((id) => id.trim()).filter(Boolean)
      : [],
    cooldownSeconds: parseInt(process.env.ROOM_COOLDOWN_SECONDS || '10', 10),
  },
};

/**
 * Validates critical environment variables.
 * @returns {boolean} true if configuration is valid.
 */
export function validateConfig() {
  const missing = [];
  if (!config.discord.token) missing.push('DISCORD_TOKEN');

  if (missing.length > 0) {
    console.error(`\x1b[31m[Config Error] Missing required environment variables: ${missing.join(', ')}\x1b[0m`);
    console.error(`\x1b[33mPlease copy .env.example to .env and fill in your values.\x1b[0m\n`);
    return false;
  }
  return true;
}
