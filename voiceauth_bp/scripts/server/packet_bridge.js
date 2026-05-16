import { world } from "@minecraft/server";

/**
 * Simple in‑memory event system for custom "packets".
 * This lets different scripts in your BP talk to each other
 * using named channels like "voiceauth:verify_request".
 */

const listeners = new Map();

/**
 * Subscribe to a custom packet channel.
 * Example:
 * PacketEvent.subscribe("voiceauth:verify_response", (data) => { ... });
 */
export const PacketEvent = {
    subscribe(channel, callback) {
        if (!listeners.has(channel)) {
            listeners.set(channel, []);
        }
        listeners.get(channel).push(callback);
    },

    _emit(channel, data) {
        const subs = listeners.get(channel);
        if (!subs) return;
        for (const cb of subs) {
            try {
                cb(data);
            } catch (e) {
                console.warn(`[VoiceAuth] Packet listener error on ${channel}: ${e}`);
            }
        }
    }
};

/**
 * Send a "packet" on a channel.
 * Other scripts can listen with PacketEvent.subscribe().
 *
 * Example:
 * sendPacket("voiceauth:verify_request", { uuid: player.id });
 */
export function sendPacket(channel, data) {
    PacketEvent._emit(channel, data);
}

/**
 * Optional: hook into world events if you later want
 * to forward packets between server/client or external systems.
 * For now, this stays internal to the Behavior Pack.
 */

// Example placeholder for future external integration:
// world.afterEvents.tick.subscribe(() => {
//     // In the future, you could poll some shared state or
//     // external bridge here and emit PacketEvent._emit(...)
// });
