// Import the large JSON list
import WORD_LIST from './words.json';

export const WORDS = WORD_LIST;

export const checkGuess = (guess: string, solution: string) => {
    const guessChars = guess.split('');
    const solutionChars = solution.split('');
    const status = Array(5).fill('absent');
    const solutionCharCounts: Record<string, number> = {};

    // Count solution chars
    solutionChars.forEach(char => {
        solutionCharCounts[char] = (solutionCharCounts[char] || 0) + 1;
    });

    // First pass: Correct (Green)
    guessChars.forEach((char, i) => {
        if (char === solutionChars[i]) {
            status[i] = 'correct';
            solutionCharCounts[char]--;
        }
    });

    // Second pass: Present (Yellow)
    guessChars.forEach((char, i) => {
        if (status[i] !== 'correct') {
            if (solutionCharCounts[char] > 0) {
                status[i] = 'present';
                solutionCharCounts[char]--;
            }
        }
    });

    return status;
}

export const getRandomWord = () => WORDS[Math.floor(Math.random() * WORDS.length)];
