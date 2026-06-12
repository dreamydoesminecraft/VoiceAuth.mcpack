const dateien = [
    "packet_bridge.js",
    "verify_handler.js"
];

dateien.forEach(async (datei) => {
    try {
        await import(`./${datei}`);
    } catch (error) {
        console.error('Fehler beim Importieren der Datei:', datei, error+error.stack);
    }
});