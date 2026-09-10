import { createAstraRoom, closeAstraRoom } from './astraApi.js';
import { config } from '../config.js';

/**
 * @typedef {Object} RoomSession
 * @property {string} channelId
 * @property {string} channelName
 * @property {string} guildId
 * @property {string} code
 * @property {string} url
 * @property {string|null} messageId
 * @property {number} createdAt
 * @property {string} createdByUserId
 * @property {string} createdByUserName
 */

class RoomManager {
  constructor() {
    /** @type {Map<string, RoomSession>} channelId -> RoomSession */
    this.activeRooms = new Map();

    /** @type {Map<string, Promise<RoomSession>>} In-flight creation locks */
    this.creationLocks = new Map();

    /** @type {Map<string, number>} channelId -> timestamp of last ended room */
    this.lastEnded = new Map();
  }

  /**
   * Check if a voice channel currently has an active room session.
   * @param {string} channelId
   * @returns {boolean}
   */
  hasRoom(channelId) {
    return this.activeRooms.has(channelId);
  }

  /**
   * Retrieves the active room session for a voice channel.
   * @param {string} channelId
   * @returns {RoomSession|undefined}
   */
  getRoom(channelId) {
    return this.activeRooms.get(channelId);
  }

  /**
   * Sets or updates the message ID for an active room.
   * @param {string} channelId
   * @param {string} messageId
   */
  setMessageId(channelId, messageId) {
    const session = this.activeRooms.get(channelId);
    if (session) {
      session.messageId = messageId;
    }
  }

  /**
   * Creates or gets the existing room for a voice channel.
   * Ensures thread-safety so multiple simultaneous joins don't create multiple rooms.
   *
   * @param {Object} options
   * @param {string} options.channelId
   * @param {string} options.channelName
   * @param {string} options.guildId
   * @param {string} options.userId
   * @param {string} options.userName
   * @returns {Promise<{ session: RoomSession, isNew: boolean }>}
   */
  async getOrCreateRoom({ channelId, channelName, guildId, userId, userName }) {
    // 1. If room already exists, return it
    const existing = this.activeRooms.get(channelId);
    if (existing) {
      return { session: existing, isNew: false };
    }

    // 2. If creation is already in-flight for this channel, wait for it
    if (this.creationLocks.has(channelId)) {
      const session = await this.creationLocks.get(channelId);
      return { session, isNew: false };
    }

    // 3. Check cooldown
    const lastTime = this.lastEnded.get(channelId) || 0;
    const elapsedSec = (Date.now() - lastTime) / 1000;
    if (elapsedSec < config.astra.cooldownSeconds && lastTime !== 0) {
      console.log(`[RoomManager] Channel ${channelName} is in cooldown (${Math.ceil(config.astra.cooldownSeconds - elapsedSec)}s remaining)`);
    }

    // 4. Create new room with lock
    const creationPromise = (async () => {
      try {
        const roomData = await createAstraRoom();

        /** @type {RoomSession} */
        const session = {
          channelId,
          channelName,
          guildId,
          code: roomData.code,
          url: roomData.roomUrl,
          messageId: null,
          createdAt: Date.now(),
          createdByUserId: userId,
          createdByUserName: userName,
        };

        this.activeRooms.set(channelId, session);
        console.log(`[RoomManager] Room ${session.code} created for #${channelName} (${channelId}) by ${userName}`);
        return session;
      } finally {
        this.creationLocks.delete(channelId);
      }
    })();

    this.creationLocks.set(channelId, creationPromise);
    const session = await creationPromise;
    return { session, isNew: true };
  }

  /**
   * Closes and clears an active room session.
   * @param {string} channelId
   * @returns {Promise<RoomSession|null>}
   */
  async endRoom(channelId) {
    const session = this.activeRooms.get(channelId);
    if (!session) return null;

    this.activeRooms.delete(channelId);
    this.lastEnded.set(channelId, Date.now());

    // Tell Astra API the room is empty
    await closeAstraRoom(session.code);
    console.log(`[RoomManager] Room ${session.code} ended for #${session.channelName}`);
    return session;
  }
}

export const roomManager = new RoomManager();
