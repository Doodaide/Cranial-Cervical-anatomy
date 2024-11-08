async function downloadDeck(deckFile) {
    const link = document.createElement("a");
    link.href = deckFile;
    link.download = deckFile;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}
