'use client'

import { useEffect, useState, useRef } from 'react'
import { useParams, useSearchParams } from 'next/navigation'
import io, { Socket } from 'socket.io-client'
import { QRCodeSVG } from 'qrcode.react'
import WordleGame from '@/components/WordleGame'
import OpponentBoard from '@/components/OpponentBoard'
import Chat from '@/components/Chat'
import Modal from '@/components/Modal'
import Timer from '@/components/Timer'
import styles from '../Room.module.css'

interface Player {
    id: string
    username: string
    score: number
}

export default function RoomPage() {
    const { roomId } = useParams()
    const searchParams = useSearchParams()
    const username = searchParams.get('username')
    const modeParam = searchParams.get('mode')

    const socketRef = useRef<Socket | null>(null)

    const [players, setPlayers] = useState<Player[]>([])
    const [gameState, setGameState] = useState<'waiting' | 'playing' | 'ended'>('waiting')
    const [solution, setSolution] = useState<string>('')
    const [startTime, setStartTime] = useState<number>(0)
    const [mode, setMode] = useState<string>(modeParam || 'competitive')

    // Logic
    const [opponentGuesses, setOpponentGuesses] = useState<string[]>([])
    const [sharedGuesses, setSharedGuesses] = useState<string[]>([])

    const [modalOpen, setModalOpen] = useState(false)
    interface ModalContent {
        title: string
        message: string
        gifUrl?: string
        soundUrl?: string
        actionLabel?: string
    }
    const [modalContent, setModalContent] = useState<ModalContent>({ title: '', message: '', actionLabel: 'Play Again' })
    const [notification, setNotification] = useState<string | null>(null)
    const [isMounted, setIsMounted] = useState(false)

    useEffect(() => {
        setIsMounted(true)
        if (!socketRef.current) {
            socketRef.current = io()
        }
        const socket = socketRef.current

        if (username && roomId) {
            socket.emit('join_room', { roomId, username, mode: modeParam })
        }

        socket.on('player_joined', ({ players, mode }) => {
            setPlayers(players)
            if (mode) setMode(mode)
            showNotification("A player joined!")
        })

        socket.on('player_left', (id) => {
            setPlayers(prev => prev.filter(p => p.id !== id))
            showNotification("A player left.")
        })

        socket.on('game_start', ({ solution, initialGuesses, startTime }) => {
            setSolution(solution)
            setGameState('playing')
            setOpponentGuesses([])
            setSharedGuesses(initialGuesses || [])
            if (startTime) setStartTime(startTime)
            setModalOpen(false)
            showNotification("Game Started! Go!")
        })

        socket.on('opponent_guess', ({ guess, turn }) => {
            setOpponentGuesses(prev => {
                const newGuesses = [...prev];
                newGuesses[turn - 1] = guess;
                return newGuesses
            })
        })

        socket.on('shared_guess', ({ guess }) => {
            setSharedGuesses(prev => [...prev, guess])
        })

        socket.on('game_over', ({ winner, solution: revealSolution }) => {
            if (winner === 'Team') {
                setModalContent({
                    title: 'Victory!',
                    message: `Team won! Word: ${revealSolution}`,
                    gifUrl: '/images/win.gif',
                    soundUrl: '/sounds/win.mp3'
                })
                setModalOpen(true)
            } else if (winner === 'None') {
                setModalContent({
                    title: 'Defeat',
                    message: `Out of turns! Word: ${revealSolution}`,
                    gifUrl: '/images/lose.gif',
                    soundUrl: '/sounds/lose.mp3'
                })
                setModalOpen(true)
            } else if (winner === socket.id) {
                // I won - handled by local check usually, but just in case
                setModalContent({
                    title: 'You Won!',
                    message: `Excellent work!`,
                    gifUrl: '/images/win.gif',
                    soundUrl: '/sounds/win.mp3'
                })
                setModalOpen(true)
            } else {
                setModalContent({
                    title: 'Game Over',
                    message: `Opponent won! Word: ${revealSolution}`,
                    gifUrl: '/images/lose.gif',
                    soundUrl: '/sounds/lose.mp3'
                })
                setModalOpen(true)
            }
        })

        socket.on('error_full', (msg) => {
            alert(msg);
        })

        socket.on('rematch_waiting', () => {
            setModalContent(prev => ({ ...prev, title: 'Waiting...', message: 'Waiting for opponent to accept rematch...', actionLabel: undefined }))
            setModalOpen(true)
        })

        return () => {
            socket.disconnect()
            socketRef.current = null
        }
    }, [roomId, username, modeParam])

    const showNotification = (msg: string) => {
        setNotification(msg)
        setTimeout(() => setNotification(null), 3000)
    }

    const handleGameOver = (result: 'win' | 'loss') => {
        if (result === 'win') {
            setModalContent({
                title: 'You Won!',
                message: `Excellent work!`,
                gifUrl: '/images/win.gif',
                soundUrl: '/sounds/win.mp3'
            })
            setModalOpen(true)
        } else {
            // In coop, loss is handled by socket 'game_over' with 'None' usually, 
            // but if local turns run out, we wait.
            if (mode === 'competitive') {
                setModalContent({
                    title: 'Waiting...',
                    message: `You ran out of turns.`,
                    gifUrl: '',
                    soundUrl: ''
                })
                setModalOpen(true)
            }
        }
    }

    const handleRematch = () => {
        socketRef.current?.emit('play_again', { roomId })
        setModalOpen(false)
    }

    const copyLink = () => {
        const url = window.location.href.split('?')[0];
        navigator.clipboard.writeText(`${url}?mode=${mode}`); // simpler sharing
        showNotification("Link copied!")
    }

    // Handle missing username (Join via Link)
    const [tempUsername, setTempUsername] = useState('')
    if (!username) {
        return (
            <main style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100vh', gap: '20px' }}>
                <h1>Join Room</h1>
                <input
                    placeholder="Enter Username"
                    value={tempUsername}
                    onChange={e => setTempUsername(e.target.value)}
                    style={{ padding: '15px', fontSize: '1.2rem', borderRadius: '8px', border: '1px solid var(--tile-border)', background: 'transparent', color: 'inherit' }}
                />
                <button
                    onClick={() => {
                        if (tempUsername) {
                            const newUrl = window.location.href + (window.location.href.includes('?') ? '&' : '?') + `username=${tempUsername}`;
                            window.location.href = newUrl;
                        }
                    }}
                    style={{ padding: '15px 30px', background: 'var(--color-correct)', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontSize: '1.2rem' }}
                >
                    Join Game
                </button>
            </main>
        )
    }

    const shareUrl = typeof window !== 'undefined' ? window.location.href.split('?')[0] : '';
    const fullShareUrl = `${shareUrl}?mode=${mode}`; // Ensure mode is preserved in QR

    return (
        <main className={styles.main}>
            {/* Left Sidebar: Info */}
            <aside className={styles.sidebarLeft}>
                {/* --- Mobile Layout (Shown < 900px) --- */}
                <div className={styles.mobileInfo}>
                    <div style={{ display: 'flex', gap: '15px', alignItems: 'center', width: '100%' }}>
                        {/* Left: QR */}
                        <div className={styles.qrContainer} style={{ background: 'white', padding: '5px', borderRadius: '5px', flexShrink: 0 }}>
                            {isMounted && <QRCodeSVG value={fullShareUrl} size={90} />}
                        </div>

                        {/* Right: Info Stack */}
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '5px', flex: 1 }}>

                            {/* Mode */}
                            <div>
                                <p style={{ fontSize: '0.8rem', color: '#aaa', margin: 0 }}>Mode</p>
                                <div style={{ fontWeight: 'bold', fontSize: '0.95rem' }}>{mode === 'coop' ? 'Cooperative' : 'Competitive'}</div>
                            </div>

                            {/* Room Code */}
                            <div>
                                <p style={{ fontSize: '0.8rem', color: '#aaa', margin: 0 }}>Room Code</p>
                                <div className={styles.roomId} style={{ fontSize: '1.1rem' }}>{roomId}</div>
                            </div>

                            {/* Copy Link */}
                            <button onClick={copyLink} className={styles.copyButton} style={{ padding: '8px', fontSize: '0.9rem', width: 'fit-content' }}>
                                🔗 Copy Link
                            </button>
                        </div>
                    </div>
                </div>

                {/* --- Desktop Layout (Shown > 900px) --- */}
                <div className={styles.desktopInfo}>
                    <div>
                        <h2 style={{ fontSize: '1.2rem', marginBottom: '5px' }}>Share Key</h2>
                        <div className={styles.qrContainer}>
                            {isMounted && <QRCodeSVG value={fullShareUrl} size={150} />}
                        </div>
                    </div>

                    <div>
                        <p style={{ fontSize: '0.9rem', color: '#aaa', margin: 0 }}>Room Code</p>
                        <div className={styles.roomId}>{roomId}</div>
                    </div>

                    {gameState === 'playing' && startTime > 0 && (
                        <div>
                            <p style={{ fontSize: '0.9rem', color: '#aaa', margin: '0 0 5px 0' }}>Time</p>
                            <Timer startTime={startTime} />
                        </div>
                    )}

                    <button onClick={copyLink} className={styles.copyButton}>
                        🔗 Copy Link
                    </button>

                    <div>
                        <p>Mode: <strong>{mode === 'coop' ? 'Cooperative' : 'Competitive'}</strong></p>
                        <p style={{ fontSize: '0.8rem', opacity: 0.7 }}>
                            {mode === 'coop' ? 'Work together to solve the word!' : 'Race to find the word first!'}
                        </p>
                    </div>
                </div>
            </aside>

            {/* Center: Game */}
            <section className={styles.gameArea}>
                {/* Notification Toast */}
                {notification && (
                    <div className={styles.notification}>
                        {notification}
                    </div>
                )}

                {/* Game Overlay */}
                {gameState === 'playing' ? (
                    <WordleGame
                        key={startTime}
                        initialSolution={solution}
                        socket={socketRef.current!}
                        roomId={roomId as string}
                        onGameOver={handleGameOver}
                        forcedGuesses={mode === 'coop' ? sharedGuesses : undefined}
                    />
                ) : (
                    <div className={styles.waitingMessage}>
                        <h2>Waiting for players...</h2>
                        {mode === 'competitive' && <p>Competitive mode requires 2 players.</p>}
                    </div>
                )}
            </section>

            {/* Right Sidebar: Chat & Players */}
            <aside className={styles.sidebarRight}>

                {/* Player List (Compact) */}
                <div className={styles.playerList}>
                    <h3 style={{ marginTop: 0, fontSize: '1rem', marginBottom: '8px' }}>Players ({players.length})</h3>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
                        {players.map(p => (
                            <div key={p.id} className={styles.playerItem}>
                                <div className={styles.playerIndicator} />
                                <span>{p.username} {p.id === socketRef.current?.id ? '(You)' : ''}</span>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Opponent Board (Compact, Scaled) */}
                {mode === 'competitive' && gameState === 'playing' && (
                    <div className={styles.opponentBoard}>
                        <h4 style={{ margin: '0 0 5px 0', fontSize: '0.9rem' }}>Opponent</h4>
                        {/* Wrapper for scaling */}
                        <div className={styles.opponentBoardWrapper}>
                            <div className={styles.opponentBoardScale}>
                                <OpponentBoard guesses={opponentGuesses} solution={solution} />
                            </div>
                        </div>
                    </div>
                )}

                {/* Chat (Takes remaining space) */}
                <div className={styles.chatContainer}>
                    <Chat socket={socketRef.current} roomId={roomId as string} username={username} />
                </div>
            </aside>

            {
                modalOpen && (
                    <Modal
                        title={modalContent.title}
                        message={modalContent.message}
                        gifUrl={modalContent.gifUrl}
                        soundUrl={modalContent.soundUrl}
                        actionLabel={modalContent.actionLabel}
                        onAction={handleRematch}
                        onClose={() => setModalOpen(false)}
                    />
                )
            }
        </main >
    )
}

