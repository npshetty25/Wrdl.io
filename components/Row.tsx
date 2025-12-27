import Tile from './Tile'
import styles from '@/styles/Game.module.css'
import { checkGuess } from '@/lib/wordUtils'

interface RowProps {
    guess: string
    currentGuess?: string
    isCurrentRow: boolean
    solution?: string
}

export default function Row({ guess, currentGuess, isCurrentRow, solution }: RowProps) {
    const wordLength = 5;

    if (isCurrentRow) {
        const letters = (currentGuess || '').split('');
        const empty = Array(wordLength - letters.length).fill('');

        return (
            <div className={styles.row}>
                {letters.map((letter, i) => (
                    <Tile key={i} letter={letter} />
                ))}
                {empty.map((_, i) => (
                    <Tile key={i + letters.length} letter="" />
                ))}
            </div>
        )
    }

    if (guess) {
        const letters = guess.split('');
        const statuses = solution ? checkGuess(guess, solution) : Array(5).fill('absent');

        return (
            <div className={styles.row}>
                {letters.map((letter, i) => (
                    <Tile key={i} letter={letter} status={statuses[i] as any} delay={`${i * 300}ms`} />
                ))}
            </div>
        )
    }

    return (
        <div className={styles.row}>
            {Array(wordLength).fill('').map((_, i) => (
                <Tile key={i} letter="" />
            ))}
        </div>
    )
}
