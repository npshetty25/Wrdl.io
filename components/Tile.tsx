import styles from '@/styles/Game.module.css'

interface TileProps {
    letter: string
    status?: 'correct' | 'present' | 'absent' | 'active'
    index?: number
}

export default function Tile({ letter, status, index }: TileProps) {
    // If no status but has letter, mark as active (typing)
    const state = status || (letter ? 'active' : undefined)

    return (
        <div className={styles.tile} data-state={state} data-index={index}>
            {letter}
        </div>
    )
}
