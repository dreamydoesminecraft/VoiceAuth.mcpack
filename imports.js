const dateien = [
    "discord_bridge/example_bot.js",
    "discord_bridge/webhook_stub.js",
    "validate_bedrock_pack.js",
    "voiceauth_bp/scripts/clients/vc_controls.js",
    "voiceauth_bp/scripts/server/creator_tracker.js",
    "voiceauth_bp/scripts/server/packet_bridge.js",
    "voiceauth_bp/scripts/server/verify_handler.js"
];

dateien.forEach(async (datei) => {
    try {
        await import(`./${datei}`);
    } catch (error) {
        console.error('Fehler beim Importieren der Datei:', datei, error+error.stack);
    }
});