import styles from '@/styles/Game.module.css'

interface TileProps {
    letter: string
    status?: 'correct' | 'present' | 'absent' | 'active'
    delay?: string
}

export default function Tile({ letter, status, delay }: TileProps) {
    // If no status but has letter, mark as active (typing)
    const state = status || (letter ? 'active' : undefined)

    return (
        <div className={styles.tile} data-state={state} style={{ animationDelay: delay }}>
            {letter}
        </div>
    )
}
