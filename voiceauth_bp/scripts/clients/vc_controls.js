import { world, system } from "@minecraft/server";
import { PacketEvent, sendPacket } from "../server/packet_bridge.js";

const vcStates = new Map();

function isUnlocked(player) {
    return vcStates.get(player.id) === true;
}

// Update the RP query variable every tick
system.runInterval(() => {
    for (const player of world.getPlayers()) {
        const unlocked = isUnlocked(player);
        player.setDynamicProperty("voiceauth_is_unlocked", unlocked ? 1 : 0);
    }
}, 1);

/**
 * LISTEN FOR VC LOCK/UNLOCK PACKETS
 * These come from verify_handler.js
 */
PacketEvent.subscribe("voiceauth:unlock_vc", (data) => {
    if (!data || !data.uuid) return;
    vcStates.set(data.uuid, true);
    console.warn(`[VoiceAuth] VC unlocked for ${data.uuid}`);
});

PacketEvent.subscribe("voiceauth:lock_vc", (data) => {
    if (!data || !data.uuid) return;
    vcStates.set(data.uuid, false);
    console.warn(`[VoiceAuth] VC locked for ${data.uuid}`);
});

world.afterEvents.playerLeave.subscribe((ev) => {
    vcStates.delete(ev.player.id);
});

/**
 * MIC TOGGLE
 */
export function toggleMic(player) {
    if (!isUnlocked(player)) {
        player.sendMessage("§cYou must verify before using voice chat.");
        return;
    }

    sendPacket("voiceauth:toggle_mic", { uuid: player.id });
}

/**
 * MUTE / UNMUTE
 */
export function toggleMute(player) {
    if (!isUnlocked(player)) {
        player.sendMessage("§cYou must verify before using voice chat.");
        return;
    }

    sendPacket("voiceauth:mute_toggle", { uuid: player.id });
}

/**
 * PUSH‑TO‑TALK (start)
 */
export function pttStart(player) {
    if (!isUnlocked(player)) return;

    sendPacket("voiceauth:ptt_start", { uuid: player.id });
}

/**
 * PUSH‑TO‑TALK (end)
 */
export function pttEnd(player) {
    if (!isUnlocked(player)) return;

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
