import styles from '@/styles/Game.module.css'

interface KeyboardProps {
    onChar: (char: string) => void
    onDelete: () => void
    onEnter: () => void
    usedKeys: Record<string, string> // 'correct' | 'present' | 'absent'
}

export default function Keyboard({ onChar, onDelete, onEnter, usedKeys }: KeyboardProps) {
    const keys = [
        ['Q', 'W', 'E', 'R', 'T', 'Y', 'U', 'I', 'O', 'P'],
        ['A', 'S', 'D', 'F', 'G', 'H', 'J', 'K', 'L'],
        ['ENTER', 'Z', 'X', 'C', 'V', 'B', 'N', 'M', 'BACKSPACE']
    ]

    return (
        <div className={styles.keyboard}>
            {keys.map((row, i) => (
                <div key={i} className={styles.keyboardRow}>
                    {row.map((key) => {
                        const isLarge = key === 'ENTER' || key === 'BACKSPACE'
                        const displayKey = key === 'BACKSPACE' ? '⌫' : key
                        const color = usedKeys[key]

                        return (
                            <button
                                key={key}
                                className={`${styles.key} ${isLarge ? styles.large : ''}`}
                                data-state={color}
                                onClick={() => {
                                    if (key === 'ENTER') onEnter()
                                    else if (key === 'BACKSPACE') onDelete()
                                    else onChar(key)
                                }}
                            >
                                {displayKey}
                            </button>
                        )
                    })}
                </div>
            ))}
        </div>
    )
}
