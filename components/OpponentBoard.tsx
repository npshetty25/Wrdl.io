import styles from '@/styles/Game.module.css'

interface OpponentBoardProps {
    guesses: string[] // List of guesses made by opponent
    solution: string
    reveal?: boolean
}

export default function OpponentBoard({ guesses, solution, reveal }: OpponentBoardProps) {
    // We only show squares with colors.
    const rows = 6;
    const cols = 5;

    return (
        <div className={`${styles.board} ${styles.opponentBoardContainer}`}>
            {Array.from({ length: rows }).map((_, r) => {
                const guess = guesses[r];
                return (
                    <div key={r} className={styles.opponentBoardRow}>
                        {Array.from({ length: cols }).map((_, c) => {
                            let color = 'var(--color-absent)'; // Default or empty?
                            // If no guess yet, transparent/border?
                            // If guess, calculate color.
                            if (!guess) {
                                return <div key={c} className={styles.opponentBoardEmptyTile} />
                            }

                            // Simple Logic (Same as Row)
                            const letter = guess[c];
                            if (solution[c] === letter) color = 'var(--color-correct)';
                            else if (solution.includes(letter)) color = 'var(--color-present)';

                            let tileClass = styles.opponentBoardTile;
                            if (solution[c] === letter) tileClass = `${styles.opponentBoardTile} ${styles.opponentBoardTileCorrect}`;
                            else if (solution.includes(guess[c])) tileClass = `${styles.opponentBoardTile} ${styles.opponentBoardTilePresent}`;
                            else tileClass = `${styles.opponentBoardTile} ${styles.opponentBoardTileAbsent}`;

                            return (
                                <div key={c} className={tileClass}>
                                    {reveal ? letter : ''}
                                </div>
                            )
                        })}
                    </div>
                )
            })}
        </div>
    )
}
