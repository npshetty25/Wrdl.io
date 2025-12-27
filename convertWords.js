const fs = require('fs');
const path = require('path');

const wordsPath = path.join(__dirname, 'lib/words.txt');
const outputPath = path.join(__dirname, 'lib/words.json');

try {
    const data = fs.readFileSync(wordsPath, 'utf8');
    const words = data.split('\n').map(w => w.trim().toUpperCase()).filter(w => w.length === 5);
    // Deduplicate just in case
    const uniqueWords = [...new Set(words)];

    fs.writeFileSync(outputPath, JSON.stringify(uniqueWords));
    console.log(`Converted ${uniqueWords.length} words to JSON.`);
} catch (err) {
    console.error(err);
}
