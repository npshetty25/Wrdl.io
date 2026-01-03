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
        <div className={styles.board} style={{ width: '200px', height: '240px', gap: '3px' }}>
            {Array.from({ length: rows }).map((_, r) => {
                const guess = guesses[r];
                return (
                    <div key={r} style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '3px' }}>
                        {Array.from({ length: cols }).map((_, c) => {
                            let color = 'var(--color-absent)'; // Default or empty?
                            // If no guess yet, transparent/border?
                            // If guess, calculate color.
                            if (!guess) {
                                return <div key={c} style={{
                                    border: '1px solid rgba(255,255,255,0.2)',
                                    background: 'rgba(0,0,0,0.3)'
                                }} />
                            }

                            // Simple Logic (Same as Row)
                            const letter = guess[c];
                            if (solution[c] === letter) color = 'var(--color-correct)';
                            else if (solution.includes(letter)) color = 'var(--color-present)';

                            return (
                                <div key={c} style={{
                                    background: color,
                                    width: '100%',
                                    aspectRatio: '1',
                                    border: '1px solid rgba(0,0,0,0.1)',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    fontWeight: 'bold',
                                    fontSize: '1rem',
                                    color: 'white'
                                }}>
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
