/**
 * Simple in-memory event system for custom "packets".
 * This lets different scripts in your BP talk to each other
 * using named channels like "voiceauth:verify_request".
 */

const listeners = new Map();

export const PacketEvent = {
    subscribe(channel, callback) {
        if (!listeners.has(channel)) {
            listeners.set(channel, []);
        }
        listeners.get(channel).push(callback);

        return () => {
            const subs = listeners.get(channel);
            if (!subs) return;
            const index = subs.indexOf(callback);
            if (index !== -1) subs.splice(index, 1);
        };
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
export function sendPacket(channel, data = {}) {
    PacketEvent._emit(channel, data);
}

/**
 * Optional: hook into events if you later want
 * to forward packets between server/client or external systems.
 */

// For external integration later, you can keep an event loop here.
// Example:
// import { world } from "@minecraft/server";
// world.afterEvents.tick.subscribe(() => {
//     // External bridge could poll shared state and emit PacketEvent._emit(...)
// });
