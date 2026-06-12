import { world, system } from "@minecraft/server";
import { PacketEvent, sendPacket } from "./packet_bridge.js";
import "../clients/vc_controls.js";

// Store verification states for players with timestamp: { verified: boolean, ts: number }
const verifiedPlayers = new Map();
// Expiration window (milliseconds) - 30 days
const VERIFICATION_TTL = 30 * 24 * 60 * 60 * 1000;

/**
 * When a player joins the world, request verification.
 */
world.afterEvents.playerSpawn.subscribe((ev) => {
    if (!ev.initialSpawn) return;

    const player = ev.player;
    const uuid = player.id;

    const entry = verifiedPlayers.get(uuid);
    const now = Date.now();

    // If player has a persistent tag from score restore, honor it
    try {
        if (player.hasTag && player.hasTag('voiceauth_verified')) {
            verifiedPlayers.set(uuid, { verified: true, ts: now });
            sendPacket("voiceauth:unlock_vc", { uuid });
            console.warn(`[VoiceAuth] Restored VERIFIED state (tag) for ${player.name} (${uuid})`);
            return;
        }
    } catch (e) {
        // ignore tag check errors
    }

    // If we have a recent verified timestamp, restore verified state
    if (entry && entry.verified && (now - entry.ts) < VERIFICATION_TTL) {
        sendPacket("voiceauth:unlock_vc", { uuid });
        console.warn(`[VoiceAuth] Restored VERIFIED state for ${player.name} (${uuid})`);
        return;
    }

    // otherwise mark unverified and request verification
    verifiedPlayers.set(uuid, { verified: false, ts: 0 });
    sendPacket("voiceauth:verify_request", { uuid });
    console.warn(`[VoiceAuth] Sent verification request for ${player.name} (${uuid})`);
});

world.afterEvents.playerLeave.subscribe((ev) => {
    // keep persisted entries (timestamps) but remove transient session-only entries
    const uuid = ev.player.id;
    const entry = verifiedPlayers.get(uuid);
    if (!entry || (entry.verified === false && entry.ts === 0)) {
        verifiedPlayers.delete(uuid);
    }
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
    if (!data || typeof data.uuid !== "string" || typeof data.verified !== "boolean") {
        console.warn("[VoiceAuth] Invalid verify_response payload", data);
        return;
    }

    const { uuid, verified } = data;
    const now = Date.now();
    verifiedPlayers.set(uuid, { verified: !!verified, ts: verified ? now : 0 });

    const player = [...world.getPlayers()].find((p) => p.id === uuid);
    if (!player) {
        console.warn(`[VoiceAuth] Verification response received for offline player ${uuid}`);
        return;
    }

    if (verified) {
        // add persistent tag so restore function can pick this up after restart
        try { player.addTag && player.addTag('voiceauth_verified'); } catch (e) {}
        sendPacket("voiceauth:unlock_vc", { uuid });
        console.warn(`[VoiceAuth] ${player.name} is VERIFIED. VC unlocked.`);
    } else {
        try { player.removeTag && player.removeTag('voiceauth_verified'); } catch (e) {}
        sendPacket("voiceauth:lock_vc", { uuid });
        console.warn(`[VoiceAuth] ${player.name} is NOT verified. VC locked.`);
    }
});

function getPlayerByUuid(uuid) {
    return [...world.getPlayers()].find((player) => player.id === uuid);
}

PacketEvent.subscribe("voiceauth:toggle_mic", (data) => {
    if (!data || typeof data.uuid !== "string") return;
    const player = getPlayerByUuid(data.uuid);
    if (!player) return;
    if (!verifiedPlayers.get(data.uuid)) {
        player.sendMessage("§cVoiceAuth: You must verify before toggling the mic.");
        return;
    }

    player.sendMessage("§aVoiceAuth: Mic toggle request received.");
    console.warn(`[VoiceAuth] ${player.name} requested mic toggle.`);
});

PacketEvent.subscribe("voiceauth:mute_toggle", (data) => {
    if (!data || typeof data.uuid !== "string") return;
    const player = getPlayerByUuid(data.uuid);
    if (!player) return;
    if (!verifiedPlayers.get(data.uuid)) {
        player.sendMessage("§cVoiceAuth: You must verify before toggling mute.");
        return;
    }

    player.sendMessage("§aVoiceAuth: Mute toggle request received.");
    console.warn(`[VoiceAuth] ${player.name} requested mute toggle.`);
});

PacketEvent.subscribe("voiceauth:ptt_start", (data) => {
    if (!data || typeof data.uuid !== "string") return;
    const player = getPlayerByUuid(data.uuid);
    if (!player) return;
    if (!verifiedPlayers.get(data.uuid)) return;

    player.sendMessage("§aVoiceAuth: Push-to-talk activated.");
    console.warn(`[VoiceAuth] ${player.name} started PTT.`);
});

PacketEvent.subscribe("voiceauth:ptt_end", (data) => {
    if (!data || typeof data.uuid !== "string") return;
    const player = getPlayerByUuid(data.uuid);
    if (!player) return;
    if (!verifiedPlayers.get(data.uuid)) return;

    player.sendMessage("§aVoiceAuth: Push-to-talk ended.");
    console.warn(`[VoiceAuth] ${player.name} ended PTT.`);
});

export function isVerified(player) {
    const entry = verifiedPlayers.get(player.id);
    if (!entry) return false;
    if (!entry.verified) return false;
    return (Date.now() - entry.ts) < VERIFICATION_TTL;
}

// Periodic cleanup of expired verification entries (runs every hour)
system.runInterval(() => {
    const now = Date.now();
    for (const [uuid, entry] of verifiedPlayers) {
        if (!entry || !entry.verified) continue;
        if ((now - entry.ts) >= VERIFICATION_TTL) {
            verifiedPlayers.set(uuid, { verified: false, ts: 0 });
            console.warn(`[VoiceAuth] Verification expired for ${uuid}`);
            sendPacket("voiceauth:lock_vc", { uuid });
        }
    }
}, 3600 * 20); // run every 3600 seconds * game ticks approximation (bedrock interval units)
