import { world, system } from "@minecraft/server";
import { PacketEvent, sendPacket } from "../server/packet_bridge.js";

// Local VC state
let vcUnlocked = false;

// Update the RP query variable every tick
system.runInterval(() => {
    for (const player of world.getPlayers()) {
        player.setDynamicProperty("voiceauth_is_unlocked", vcUnlocked ? 1 : 0);
    }
}, 1);

/**
 * LISTEN FOR VC LOCK/UNLOCK PACKETS
 * These come from verify_handler.js
 */
PacketEvent.subscribe("voiceauth:unlock_vc", () => {
    vcUnlocked = true;
    console.warn("[VoiceAuth] VC unlocked for this client.");
});

PacketEvent.subscribe("voiceauth:lock_vc", () => {
    vcUnlocked = false;
    console.warn("[VoiceAuth] VC locked for this client.");
});

/**
 * MIC TOGGLE
 */
export function toggleMic(player) {
    if (!vcUnlocked) {
        player.sendMessage("§cYou must verify before using voice chat.");
        return;
    }

    sendPacket("voiceauth:toggle_mic", { uuid: player.id });
}

/**
 * MUTE / UNMUTE
 */
export function toggleMute(player) {
    if (!vcUnlocked) {
        player.sendMessage("§cYou must verify before using voice chat.");
        return;
    }

    sendPacket("voiceauth:mute_toggle", { uuid: player.id });
}

/**
 * PUSH‑TO‑TALK (start)
 */
export function pttStart(player) {
    if (!vcUnlocked) return;

    sendPacket("voiceauth:ptt_start", { uuid: player.id });
}

/**
 * PUSH‑TO‑TALK (end)
 */
export function pttEnd(player) {
    if (!vcUnlocked) return;

    sendPacket("voiceauth:ptt_end", { uuid: player.id });
}

/**
 * OPTIONAL: Bind controls to commands for testing
 */
world.beforeEvents.chatSend.subscribe((ev) => {
    const msg = ev.message.toLowerCase();
    const player = ev.sender;

    if (msg === "!mic") {
        toggleMic(player);
        ev.cancel = true;
    }

    if (msg === "!mute") {
        toggleMute(player);
        ev.cancel = true;
    }

    if (msg === "!talk") {
        pttStart(player);
        system.runTimeout(() => pttEnd(player), 40); // 2 seconds
        ev.cancel = true;
    }
});
