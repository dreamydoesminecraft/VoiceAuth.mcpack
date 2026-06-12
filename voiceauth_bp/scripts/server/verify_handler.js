import { world, system } from "@minecraft/server";
import { PacketEvent, sendPacket } from "./packet_bridge.js";
import { logContentCreator, getVerifiedCreators, exportCreatorsData } from "./creator_tracker.js";
import "../clients/vc_controls.js";

// Store verification states for players
const verifiedPlayers = new Map();
const VERIFICATION_TTL = 30 * 24 * 60 * 60 * 1000; // 30 days
const DISCORD_WEBHOOK = "http://localhost:3000/verify-pending";

/**
 * Check Discord webhook for pending verifications periodically
 */
system.runInterval(() => {
    try {
        for (const player of world.getPlayers()) {
            const uuid = player.id;
            const entry = verifiedPlayers.get(uuid);
            
            // Skip already verified players
            if (entry && entry.verified) continue;
            
            // Non-blocking async check
            (async () => {
                try {
                    const response = await fetch(`${DISCORD_WEBHOOK}/${uuid}`);
                    if (!response.ok) return;
                    
                    const data = await response.json();
                    if (data.verified === null || data.verified === undefined) return;
                    
                    const now = Date.now();
                    verifiedPlayers.set(uuid, { verified: !!data.verified, ts: data.verified ? now : 0 });
                    
                    if (data.verified) {
                        try { player.addTag && player.addTag('voiceauth_verified'); } catch (e) {}
                        sendPacket("voiceauth:unlock_vc", { uuid });
                        console.warn(`[VoiceAuth] Discord APPROVED: ${player.name}`);
                        
                        // Log if this is a content creator
                        if (data.isCreator) {
                            logContentCreator(uuid, player.name, data.platform || "minecraft");
                            console.warn(`[VoiceAuth] Content creator logged: ${player.name}`);
                        }
                    } else {
                        try { player.removeTag && player.removeTag('voiceauth_verified'); } catch (e) {}
                        sendPacket("voiceauth:lock_vc", { uuid });
                        console.warn(`[VoiceAuth] Discord DENIED: ${player.name}`);
                    }
                } catch (err) {
                    // Webhook offline - continue with local verification
                }
            })();
        }
    } catch (err) {
        console.warn(`[VoiceAuth] Discord check error: ${err}`);
    }
}, 100); // Every 5 seconds

/**
 * When a player joins, request verification
 */
world.afterEvents.playerSpawn.subscribe((ev) => {
    if (!ev.initialSpawn) return;

    const player = ev.player;
    const uuid = player.id;
    const entry = verifiedPlayers.get(uuid);
    const now = Date.now();

    try {
        if (player.hasTag && player.hasTag('voiceauth_verified')) {
            verifiedPlayers.set(uuid, { verified: true, ts: now });
            sendPacket("voiceauth:unlock_vc", { uuid });
            console.warn(`[VoiceAuth] Restored verified: ${player.name}`);
            return;
        }
    } catch (e) {
        // ignore
    }

    if (entry && entry.verified && (now - entry.ts) < VERIFICATION_TTL) {
        sendPacket("voiceauth:unlock_vc", { uuid });
        console.warn(`[VoiceAuth] Restored verified: ${player.name}`);
        return;
    }

    verifiedPlayers.set(uuid, { verified: false, ts: 0 });
    sendPacket("voiceauth:verify_request", { uuid });
    console.warn(`[VoiceAuth] Verification request: ${player.name}`);
});

world.afterEvents.playerLeave.subscribe((ev) => {
    const uuid = ev.player.id;
    const entry = verifiedPlayers.get(uuid);
    if (!entry || (entry.verified === false && entry.ts === 0)) {
        verifiedPlayers.delete(uuid);
    }
});

/**
 * Listen for local verification responses
 */
PacketEvent.subscribe("voiceauth:verify_response", (data) => {
    if (!data || typeof data.uuid !== "string" || typeof data.verified !== "boolean") {
        console.warn("[VoiceAuth] Invalid verify_response", data);
        return;
    }

    const { uuid, verified } = data;
    const now = Date.now();
    verifiedPlayers.set(uuid, { verified: !!verified, ts: verified ? now : 0 });

    const player = [...world.getPlayers()].find((p) => p.id === uuid);
    if (!player) {
        console.warn(`[VoiceAuth] Response for offline player: ${uuid}`);
        return;
    }

    if (verified) {
        try { player.addTag && player.addTag('voiceauth_verified'); } catch (e) {}
        sendPacket("voiceauth:unlock_vc", { uuid });
        console.warn(`[VoiceAuth] Verified: ${player.name}`);
        
        // Log if content creator
        if (data.isCreator) {
            logContentCreator(uuid, player.name, data.platform || "minecraft");
            console.warn(`[VoiceAuth] Content creator logged: ${player.name}`);
        }
    } else {
        try { player.removeTag && player.removeTag('voiceauth_verified'); } catch (e) {}
        sendPacket("voiceauth:lock_vc", { uuid });
        console.warn(`[VoiceAuth] Not verified: ${player.name}`);
    }
});

function getPlayerByUuid(uuid) {
    return [...world.getPlayers()].find((player) => player.id === uuid);
}

PacketEvent.subscribe("voiceauth:toggle_mic", (data) => {
    if (!data || typeof data.uuid !== "string") return;
    const player = getPlayerByUuid(data.uuid);
    if (!player || !verifiedPlayers.get(data.uuid)?.verified) {
        player?.sendMessage("§cMust verify first");
        return;
    }
    player.sendMessage("§aMic toggle received");
    console.warn(`[VoiceAuth] Mic toggle: ${player.name}`);
});

PacketEvent.subscribe("voiceauth:mute_toggle", (data) => {
    if (!data || typeof data.uuid !== "string") return;
    const player = getPlayerByUuid(data.uuid);
    if (!player || !verifiedPlayers.get(data.uuid)?.verified) {
        player?.sendMessage("§cMust verify first");
        return;
    }
    player.sendMessage("§aMute toggle received");
    console.warn(`[VoiceAuth] Mute toggle: ${player.name}`);
});

PacketEvent.subscribe("voiceauth:ptt_start", (data) => {
    if (!data || typeof data.uuid !== "string") return;
    const player = getPlayerByUuid(data.uuid);
    if (!player || !verifiedPlayers.get(data.uuid)?.verified) return;
    console.warn(`[VoiceAuth] PTT start: ${player.name}`);
});

PacketEvent.subscribe("voiceauth:ptt_end", (data) => {
    if (!data || typeof data.uuid !== "string") return;
    const player = getPlayerByUuid(data.uuid);
    if (!player || !verifiedPlayers.get(data.uuid)?.verified) return;
    console.warn(`[VoiceAuth] PTT end: ${player.name}`);
});

export function isVerified(player) {
    const entry = verifiedPlayers.get(player.id);
    if (!entry) return false;
    if (!entry.verified) return false;
    return (Date.now() - entry.ts) < VERIFICATION_TTL;
}

// Cleanup expired verifications hourly
system.runInterval(() => {
    const now = Date.now();
    for (const [uuid, entry] of verifiedPlayers) {
        if (!entry || !entry.verified) continue;
        if ((now - entry.ts) >= VERIFICATION_TTL) {
            verifiedPlayers.set(uuid, { verified: false, ts: 0 });
            const player = [...world.getPlayers()].find((p) => p.id === uuid);
            if (player) {
                sendPacket("voiceauth:lock_vc", { uuid });
                console.warn(`[VoiceAuth] Verification expired: ${player.name}`);
            }
        }
    }
}, 72000); // 1 hour
