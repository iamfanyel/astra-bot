import crypto from 'node:crypto';
import { config } from '../config.js';

// Astra's official code alphabet (omits 0, O, 1, I for clarity when read aloud or typed)
const ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';

/**
 * Generates a random Astra-compliant 6-character room code.
 * @param {number} length
 * @returns {string}
 */
export function generateRoomCode(length = 6) {
  const bytes = crypto.randomBytes(length);
  return Array.from(bytes, (b) => ALPHABET[b % ALPHABET.length]).join('');
}

/**
 * Returns the full web invite URL for an Astra room.
 * @param {string} code
 * @param {boolean} [direct=false] If true, appends &go=1 to skip pre-lobby gate if profile is set
 * @returns {string}
 */
export function getRoomUrl(code, direct = false) {
  const clean = encodeURIComponent(String(code).trim().toUpperCase());
  return `${config.astra.baseUrl}/room/?room=${clean}${direct ? '&go=1' : ''}`;
}

/**
 * Registers a new room with the Astra backend.
 * Sets the room to 'empty' (needsHost: true) so whoever opens the link first
 * immediately and seamlessly claims room ownership without timeout delays.
 *
 * @param {string} code 6-character room code
 * @returns {Promise<{ success: boolean, code: string, roomUrl: string, error?: string }>}
 */
export function createAstraRoom(code = generateRoomCode()) {
  const normalizedCode = code.trim().toUpperCase();
  const roomUrl = getRoomUrl(normalizedCode);
  const apiUrl = `${config.astra.baseUrl}/api/room`;

  return (async () => {
    try {
      // 1. Register room existence in Astra's KV store
      const createRes = await fetch(apiUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'create',
          code: normalizedCode,
          peerCount: 1,
        }),
      });

      if (!createRes.ok) {
        console.warn(`[Astra API] Warning: create room status ${createRes.status}`);
      }

      // 2. Mark as empty so Astra returns `needsHost: true`
      // When the Discord user joins, Astra's room.js immediately executes Signal.reclaim()
      // becoming the host with zero peer-connection delay!
      await fetch(apiUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'empty',
          code: normalizedCode,
          peerCount: 0,
        }),
      }).catch((err) => {
        console.warn('[Astra API] Failed to mark room as ready for host:', err.message);
      });

      return {
        success: true,
        code: normalizedCode,
        roomUrl,
      };
    } catch (err) {
      console.error('[Astra API] Error creating Astra room:', err);
      // Fallback: WebRTC rooms on Astra can also be created dynamically peer-to-peer!
      return {
        success: true,
        code: normalizedCode,
        roomUrl,
        fallback: true,
        error: err.message,
      };
    }
  })();
}

/**
 * Checks the status of a room on Astra.
 * @param {string} code
 * @returns {Promise<{ exists: boolean, expired?: boolean, active?: boolean, needsHost?: boolean }>}
 */
export async function checkAstraRoom(code) {
  try {
    const res = await fetch(`${config.astra.baseUrl}/api/room?code=${encodeURIComponent(code)}`);
    if (!res.ok) return { exists: false };
    return await res.json();
  } catch (err) {
    console.error('[Astra API] Error checking room status:', err.message);
    return { exists: false, error: err.message };
  }
}

/**
 * Notifies Astra backend that the room is empty / closed.
 * @param {string} code
 * @returns {Promise<boolean>}
 */
export async function closeAstraRoom(code) {
  try {
    const res = await fetch(`${config.astra.baseUrl}/api/room`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'empty',
        code: code.trim().toUpperCase(),
        peerCount: 0,
      }),
    });
    return res.ok;
  } catch (err) {
    console.error('[Astra API] Error closing Astra room:', err.message);
    return false;
  }
}
