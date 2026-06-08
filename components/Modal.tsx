/* eslint-disable @next/next/no-img-element */
import { useEffect, useRef } from 'react'
import styles from './Modal.module.css'

interface ModalProps {
    title: string
    message: string
    gifUrl?: string
    soundUrl?: string
    actionLabel?: string
    onAction?: () => void
    onClose?: () => void
}

export default function Modal({ title, message, gifUrl, soundUrl, actionLabel, onAction, onClose }: ModalProps) {
    const audioRef = useRef<HTMLAudioElement | null>(null)

    useEffect(() => {
        let mounted = true;
        let playCount = 0;
        const maxPlays = 5;

        if (soundUrl) {
            audioRef.current = new Audio(soundUrl)
            
            const handleEnded = () => {
                playCount++;
                if (playCount < maxPlays && mounted && audioRef.current) {
                    const playPromise = audioRef.current.play();
                    if (playPromise !== undefined) {
                        playPromise.catch(e => {
                            if (!mounted || e.name === 'AbortError') return;
                            console.error("Audio replay failed", e)
                        })
                    }
                }
            };

            audioRef.current.addEventListener('ended', handleEnded);

            const playPromise = audioRef.current.play();
            if (playPromise !== undefined) {
                playPromise.catch(e => {
                    if (!mounted || e.name === 'AbortError') return;
                    console.error("Audio play failed", e)
                })
            }
        }

        return () => {
            mounted = false;
            if (audioRef.current) {
                audioRef.current.pause()
                audioRef.current = null
            }
        }
    }, [soundUrl])

    return (
        <div className={styles.overlay}>
            <div className={styles.modalContent}>
                {onClose && (
                    <button
                        onClick={onClose}
                        className={styles.closeButton}
                    >
                        &times;
                    </button>
                )}
                <h2 className={styles.title}>{title}</h2>

                {gifUrl && (
                    <img src={gifUrl} alt="Reaction" className={styles.gif} />
                )}

                <p className={styles.message}>{message}</p>

                {actionLabel && onAction && (
                    <button
                        onClick={onAction}
                        className={styles.actionButton}
                    >
                        {actionLabel}
                    </button>
                )}
            </div>
        </div>
    )
}
