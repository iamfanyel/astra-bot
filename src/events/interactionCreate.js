import * as astraCommand from '../commands/astra.js';

/**
 * Handles interactionCreate events (slash commands and button clicks).
 * @param {import('discord.js').Interaction} interaction
 */
export async function handleInteractionCreate(interaction) {
  // 1. Handle Slash Commands
  if (interaction.isChatInputCommand()) {
    if (interaction.commandName === 'astra') {
      try {
        await astraCommand.execute(interaction);
      } catch (err) {
        console.error('[Interaction] Error executing /astra command:', err);
        const reply = {
          content: '❌ There was an error while executing this command.',
          ephemeral: true,
        };
        if (interaction.deferred || interaction.replied) {
          await interaction.followUp(reply).catch(() => {});
        } else {
          await interaction.reply(reply).catch(() => {});
        }
      }
    }
    return;
  }

  // 2. Handle Button Clicks
  if (interaction.isButton()) {
    if (interaction.customId.startsWith('copy_code_')) {
      const code = interaction.customId.replace('copy_code_', '');

      await interaction.reply({
        content: `\`${code}\``,
        ephemeral: true,
      });
    }
  }
}
