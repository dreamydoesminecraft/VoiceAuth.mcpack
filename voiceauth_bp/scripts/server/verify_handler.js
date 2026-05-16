import { world } from "@minecraft/server";
import { PacketEvent, sendPacket } from "./packet_bridge.js";

// Store verification states for players
const verifiedPlayers = new Map();

/**
 * When a player joins the world, request verification.
 */
world.afterEvents.playerSpawn.subscribe((ev) => {
    if (!ev.initialSpawn) return;

    const player = ev.player;
    const uuid = player.id;

    // Mark as unverified until proven otherwise
    verifiedPlayers.set(uuid, false);

    // Send verification request to external system (Java/Discord)
    sendPacket("voiceauth:verify_request", {
        uuid: uuid
    });

    console.warn(`[VoiceAuth] Sent verification request for ${player.name} (${uuid})`);
});

/**
 * Listen for verification responses from the packet bridge.
 * Expected packet:
 * {
 *   uuid: "<player uuid>",
 *   verified: true/false
 * }
 */
PacketEvent.subscribe("voiceauth:verify_response", (data) => {
    const { uuid, verified } = data;

    verifiedPlayers.set(uuid, verified);

    const player = [...world.getPlayers()].find(p => p.id === uuid);
    if (!player) return;

    if (verified) {
        // Tell client they are verified
        sendPacket("voiceauth:unlock_vc", { uuid });
        console.warn(`[VoiceAuth] ${player.name} is VERIFIED. VC unlocked.`);
    } else {
        // Tell client they are blocked
        sendPacket("voiceauth:lock_vc", { uuid });
        console.warn(`[VoiceAuth] ${player.name} is NOT verified. VC locked.`);
    }
});

/**
 * Export helper so other scripts can check verification state.
 */
export function isVerified(player) {
    return verifiedPlayers.get(player.id) === true;
}
