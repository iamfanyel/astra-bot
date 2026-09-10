# 🛰️ Astra Discord Voice Channel Auto-Room Bot

A modern Discord bot that automatically creates a private, peer-to-peer screenshare room on [**astrascreen.live**](https://astrascreen.live/) whenever users join a voice channel, and instantly shares the invite link into the voice channel's chat!

---

## ✨ Features

- 🎧 **Automatic Voice Detection**: Creates an Astra room when someone joins an empty voice channel and posts the invite directly into the channel's chat.
- ⚡ **Instant Host Handoff**: Integrates with Astra's backend so the first user to open the room URL is seamlessly granted room ownership without timeout delays.
- 🚫 **Spam Protection**: Only posts when a new voice session begins. Joining an ongoing call will not spam the chat.
- 🧹 **Automatic Cleanup**: When all users leave the voice channel, the room session ends and Astra is notified to close the room.
- 💬 **Interactive Buttons**: Users can click **"Join Astra Room"** to open their browser directly, or click **"Code: XXXXXX"** to copy the room code to their clipboard.
- 💻 **Slash Commands**: Provides `/astra room`, `/astra end`, and `/astra help` for manual controls.

---

## 📋 Prerequisites

- **Node.js** v18.0.0 or higher (v20+ recommended).
- A **Discord Bot Token** and **Application Client ID** from the [Discord Developer Portal](https://discord.com/developers/applications).

---

## 🚀 Quick Setup Guide

### 1. Configure the Discord Developer Portal

1. Go to the [Discord Developer Portal](https://discord.com/developers/applications) and click **New Application**.
2. Name your bot (e.g. `Astra Screenshare`).
3. Under the **Bot** tab:
   - Click **Reset Token** to copy your bot token.
   - Under **Privileged Gateway Intents**, enable:
     - ✅ **Server Members Intent**
4. Under **OAuth2 > URL Generator**:
   - In **Scopes**, check:
     - ✅ `bot`
     - ✅ `applications.commands`
   - In **Bot Permissions**, check:
     - ✅ `View Channels`
     - ✅ `Send Messages`
     - ✅ `Send Messages in Threads`
     - ✅ `Embed Links`
     - ✅ `Attach Files`
     - ✅ `Read Message History`
     - ✅ `Use External Emojis`
5. Copy the generated invite URL and paste it into your browser to invite the bot to your Discord server.

---

### 2. Configure Environment Variables

Copy the `.env.example` file to create your `.env`:

```bash
cp .env.example .env
```

Open `.env` and fill in your values:

```env
# Your Discord Bot Token (from Developer Portal > Bot)
DISCORD_TOKEN=MTEy...

# Your Discord Application ID (from Developer Portal > General Information)
DISCORD_CLIENT_ID=112...

# (Optional) Guild ID for instant testing of slash commands during development
DISCORD_GUILD_ID=

# Astra URL (defaults to https://astrascreen.live)
ASTRA_BASE_URL=https://astrascreen.live

# Automatically close room when everyone leaves the voice channel
AUTO_CLEANUP_ON_EMPTY=true

# (Optional) Limit bot to specific voice channels (comma-separated IDs)
# Leave empty to monitor ALL voice channels
VOICE_CHANNEL_IDS=

# Cooldown in seconds before a new room can be created in the same channel
ROOM_COOLDOWN_SECONDS=10
```

---

### 3. Install Dependencies & Start the Bot

```bash
# Install dependencies
npm install

# (Optional) Test the Astra API connection
npm run test-astra

# Start the bot
npm start
```

For development with automatic restarts on code change:
```bash
npm run dev
```

---

## 🤖 Slash Commands

| Command | Description |
|---|---|
| `/astra room` | Creates or retrieves the active Astra room for your current voice channel |
| `/astra end` | Closes the active Astra room for your current voice channel |
| `/astra help` | Displays information about Astra and how screensharing works |

---

## 🛠️ Project Structure

```
astra-bot/
├── .env.example                # Environment variables template
├── package.json                # Node.js dependencies and scripts
├── README.md                   # Setup guide and documentation
├── src/
│   ├── index.js                # Main entry point & Discord client
│   ├── config.js               # Environment config validation
│   ├── commands/
│   │   ├── astra.js            # /astra slash command handler
│   │   └── deploy.js           # Slash command deployment script
│   ├── events/
│   │   ├── ready.js            # Ready event & command auto-registration
│   │   ├── voiceStateUpdate.js # Voice channel join/leave automation
│   │   └── interactionCreate.js# Button & slash command router
│   ├── services/
│   │   ├── astraApi.js         # Astra backend room API integration
│   │   └── roomManager.js      # In-memory channel room session tracking
│   └── utils/
│       └── embeds.js           # Discord embed & button components
└── test/
    └── test-astra.js           # API integration verification tests
```

---

## 🌐 How Astra Works

Astra uses WebRTC mesh technology to connect viewers directly peer-to-peer:
- **No relay lag**: Audio and video flow directly between browsers.
- **No install**: Viewers simply click the link in Discord to watch or share.
- **Zero accounts**: No registration required to join or host.

Learn more at [astrascreen.live](https://astrascreen.live/).
