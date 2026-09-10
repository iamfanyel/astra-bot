import { ActivityType } from 'discord.js';
import { deployCommands } from '../commands/deploy.js';
import { config } from '../config.js';

/**
 * Handles the client ready event.
 * @param {import('discord.js').Client} client
 */
export async function handleReady(client) {
  console.log(`\x1b[32m[Bot Ready] Logged in as ${client.user.tag} (ID: ${client.user.id})\x1b[0m`);
  console.log(`[Bot Ready] Connected to ${client.guilds.cache.size} server(s).`);

  // Set presence
  client.user.setPresence({
    activities: [
      {
        name: 'astrascreen.live 🖥️',
        type: ActivityType.Custom,
        state: 'Sharing screens on astrascreen.live',
      },
    ],
    status: 'online',
  });

  // Auto-deploy commands if client ID is available
  if (config.discord.clientId) {
    try {
      await deployCommands();
    } catch (err) {
      console.warn('[Bot Ready] Command auto-deploy failed:', err.message);
    }
  } else {
    console.log('[Bot Ready] Note: Add DISCORD_CLIENT_ID to .env to enable automatic slash command registration.');
  }
}
