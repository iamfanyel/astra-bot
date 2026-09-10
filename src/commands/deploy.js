import { REST, Routes } from 'discord.js';
import { config, validateConfig } from '../config.js';
import { data as astraCommandData } from './astra.js';

const commands = [astraCommandData.toJSON()];

/**
 * Deploys slash commands to Discord.
 */
export async function deployCommands() {
  if (!validateConfig()) return;

  if (!config.discord.clientId) {
    console.warn('[Deploy] Warning: DISCORD_CLIENT_ID is not configured in .env. Skipping slash command registration.');
    return;
  }

  const rest = new REST({ version: '10' }).setToken(config.discord.token);

  try {
    console.log(`[Deploy] Refreshing ${commands.length} application (/) commands...`);

    if (config.discord.guildId) {
      // Guild-specific registration (instant updates for development)
      await rest.put(
        Routes.applicationGuildCommands(config.discord.clientId, config.discord.guildId),
        { body: commands }
      );
      console.log(`[Deploy] Successfully registered commands to guild: ${config.discord.guildId}`);
    } else {
      // Global registration (available across all servers)
      await rest.put(
        Routes.applicationCommands(config.discord.clientId),
        { body: commands }
      );
      console.log('[Deploy] Successfully registered commands globally.');
    }
  } catch (error) {
    console.error('[Deploy] Error registering application commands:', error);
  }
}

// Allow direct execution: node src/commands/deploy.js
if (process.argv[1]?.endsWith('deploy.js')) {
  deployCommands();
}
