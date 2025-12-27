import styles from '@/styles/Game.module.css'

interface ModalProps {
    title: string
    message: string
    actionLabel?: string
    onAction?: () => void
    onClose?: () => void
}

export default function Modal({ title, message, actionLabel, onAction, onClose }: ModalProps) {
    return (
        <div style={{
            position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
            backgroundColor: 'rgba(0,0,0,0.7)', display: 'flex',
            alignItems: 'center', justifyContent: 'center', zIndex: 100
        }}>
            <div style={{
                background: 'var(--background)', color: 'var(--foreground)',
                padding: '30px', borderRadius: '10px', maxWidth: '90%', width: '400px',
                border: '1px solid var(--tile-border)',
                textAlign: 'center',
                position: 'relative'
            }}>
                {onClose && (
                    <button
                        onClick={onClose}
                        style={{ position: 'absolute', top: '10px', right: '10px', background: 'transparent', border: 'none', color: 'var(--foreground)', fontSize: '1.5rem', cursor: 'pointer' }}
                    >
                        &times;
                    </button>
                )}
                <h2 style={{ marginTop: 0, fontSize: '2rem' }}>{title}</h2>
                <p style={{ fontSize: '1.2rem', margin: '20px 0' }}>{message}</p>

                {actionLabel && onAction && (
                    <button
                        onClick={onAction}
                        style={{
                            padding: '10px 20px', fontSize: '1.2rem',
                            background: 'var(--color-correct)', color: 'white',
                            border: 'none', borderRadius: '5px', cursor: 'pointer'
                        }}
                    >
                        {actionLabel}
                    </button>
                )}
            </div>
        </div>
    )
}
