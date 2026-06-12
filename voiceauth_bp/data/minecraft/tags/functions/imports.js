const dateien = [
    
];

dateien.forEach(async (datei) => {
    try {
        await import(`./${datei}`);
    } catch (error) {
        console.error('Fehler beim Importieren der Datei:', datei, error+error.stack);
    }
});