import { Client, GatewayIntentBits, Events } from 'discord.js';
import { config, validateConfig } from './config.js';
import { handleReady } from './events/ready.js';
import { handleVoiceStateUpdate } from './events/voiceStateUpdate.js';
import { handleInteractionCreate } from './events/interactionCreate.js';

// Validate environment variables before startup
if (!validateConfig()) {
  process.exit(1);
}

// Initialize Discord Client with required intents
const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildVoiceStates,
    GatewayIntentBits.GuildMessages,
  ],
});

// Event Listeners
client.once(Events.ClientReady, () => handleReady(client));
client.on(Events.VoiceStateUpdate, (oldState, newState) => handleVoiceStateUpdate(oldState, newState));
client.on(Events.InteractionCreate, (interaction) => handleInteractionCreate(interaction));

// Error handling
client.on(Events.Error, (error) => {
  console.error('[Discord Client Error]', error);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('[Unhandled Rejection]', reason);
});

// Graceful shutdown
const shutdown = async () => {
  console.log('\n[Bot] Shutting down gracefully...');
  client.destroy();
  process.exit(0);
};

process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);

// Connect to Discord
console.log('[Bot] Connecting to Discord Gateway...');
client.login(config.discord.token).catch((err) => {
  console.error('[Bot Login Failed] Error:', err.message);
  process.exit(1);
});
