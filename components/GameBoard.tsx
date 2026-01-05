import Row from './Row'
import styles from '@/styles/Game.module.css'

interface GameBoardProps {
    guesses: string[]
    currentGuess: string
    turn: number
    solution: string
    isShaking?: boolean
}

export default function GameBoard({ guesses, currentGuess, turn, solution, isShaking }: GameBoardProps) {
    return (
        <div className={styles.board}>
            {Array.from({ length: 6 }).map((_, i) => {
                if (i < turn) {
                    return <Row key={i} guess={guesses[i]} isCurrentRow={false} solution={solution} />
                }
                if (i === turn) {
                    return <Row key={i} guess="" currentGuess={currentGuess} isCurrentRow={true} shake={isShaking} />
                }
                return <Row key={i} guess="" isCurrentRow={false} />
            })}
        </div>
    )
}
