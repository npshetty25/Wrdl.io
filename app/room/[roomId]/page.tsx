 'use client'
/* eslint-disable react-hooks/set-state-in-effect */

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
    const [socketState, setSocketState] = useState<Socket | null>(null)

    const [players, setPlayers] = useState<Player[]>([])
    const [gameState, setGameState] = useState<'waiting' | 'playing' | 'ended'>('waiting')
    const [solution, setSolution] = useState<string>('')
    const [startTime, setStartTime] = useState<number>(0)
    const [mode, setMode] = useState<string>(modeParam || 'competitive')

    // Logic
    const [opponentGuesses, setOpponentGuesses] = useState<string[]>([])
    const [sharedGuesses, setSharedGuesses] = useState<string[]>([])
    const [spyMode, setSpyMode] = useState(false)
    const [autoFillTrigger, setAutoFillTrigger] = useState(0)

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

    function showNotification(msg: string) {
        setNotification(msg)
        setTimeout(() => setNotification(null), 3000)
    }

    useEffect(() => {
        setIsMounted(true)
        if (!socketRef.current) {
            socketRef.current = io()
        }
        const socket = socketRef.current
        setSocketState(socket)

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
                    soundUrl: '/sounds/win.mp3',
                    actionLabel: 'Play Again'
                })
                setModalOpen(true)
            } else if (winner === 'None') {
                setModalContent({
                    title: 'Draw',
                    message: `CHEEE..... both of u lost . Word: ${revealSolution}`,
                    gifUrl: '/images/sticker.png',
                    soundUrl: '/sounds/lose.mp3',
                    actionLabel: 'Play Again'
                })
                setModalOpen(true)
            } else if (winner === socket.id) {
                // I won - handled by local check usually, but just in case
                setModalContent({
                    title: 'You Won!',
                    message: `Excellent work!`,
                    gifUrl: '/images/win.gif',
                    soundUrl: '/sounds/win.mp3',
                    actionLabel: 'Play Again'
                })
                setModalOpen(true)
            } else {
                setModalContent({
                    title: 'Game Over',
                    message: `Opponent won! Word: ${revealSolution}`,
                    gifUrl: '/images/lose.gif',
                    soundUrl: '/sounds/lose.mp3',
                    actionLabel: 'Play Again'
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

        socket.on('rematch_requested', (username) => {
            showNotification(`${username} wants to play again!`)
        })

        return () => {
            socket.disconnect()
            socketRef.current = null
            setSocketState(null)
        }
    }, [roomId, username, modeParam])

    // showNotification hoisted above

    const handleGameOver = (result: 'win' | 'loss') => {
        if (result === 'win') {
            setModalContent({
                title: 'You Won!',
                message: `Excellent work!`,
                gifUrl: '/images/win.gif',
                soundUrl: '/sounds/win.mp3',
                actionLabel: 'Play Again'
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

    const handleCheat = (cmd: string) => {
        if (cmd === '/word') {
            setAutoFillTrigger(Date.now())
            showNotification("Cheat Activated: Auto-Fill")
        } else if (cmd === '/spy') {
            setSpyMode(true)
            showNotification("Spying on opponent...")
            setTimeout(() => setSpyMode(false), 3000)
        }
    }

    // Handle missing username (Join via Link)
    const [tempUsername, setTempUsername] = useState('')
    if (!username) {
        return (
            <main className={styles.joinMainContainer}>
                <h1>Join Room</h1>
                <input
                    placeholder="Enter Username"
                    value={tempUsername}
                    onChange={e => setTempUsername(e.target.value)}
                    className={styles.joinInput}
                />
                <button
                    onClick={() => {
                        if (tempUsername) {
                            const newUrl = window.location.href + (window.location.href.includes('?') ? '&' : '?') + `username=${tempUsername}`;
                            window.location.href = newUrl;
                        }
                    }}
                    className={styles.joinButton}
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
                    <div className={styles.mobileInfoRow}>
                        {/* Left: QR - 30% */}
                        <div className={styles.mobileQrSection}>
                            <div className={styles.qrContainerWithBg}>
                                {isMounted && <QRCodeSVG value={fullShareUrl} size={70} />}
                            </div>
                        </div>

                        {/* Center: Info Stack - 30% */}
                        <div className={styles.mobileInfoSection}>
                            {/* Mode */}
                            <div>
                                <p className={styles.mobileLabel}>Mode</p>
                                <div className={styles.mobileLabelValue}>{mode === 'coop' ? 'Coop' : 'Comp'}</div>
                            </div>

                            {/* Room Code */}
                            <div>
                                <p className={styles.mobileLabel}>Code</p>
                                <div className={`${styles.roomId} ${styles.mobileRoomId}`}>{roomId}</div>
                            </div>

                            {/* Copy Link */}
                            <button onClick={copyLink} className={`${styles.copyButton} ${styles.mobileButton}`}>
                                🔗 Copy
                            </button>
                        </div>

                        {/* Right: Opponent Board - 40% (Mobile Only) */}
                        {mode === 'competitive' && gameState === 'playing' && (
                            <div className={styles.mobileOpponentBoard}>
                                <h4>Opponent</h4>
                                <div className={styles.mobileOpponentBoardWrapper}>
                                    <div className={styles.mobileOpponentBoardScale}>
                                        <OpponentBoard guesses={opponentGuesses} solution={solution} reveal={spyMode} />
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                {/* --- Desktop Layout (Shown > 900px) --- */}
                <div className={styles.desktopInfo}>
                    <div>
                        <h2 className={styles.desktopShareTitle}>Share Key</h2>
                        <div className={styles.qrContainer}>
                            {isMounted && <QRCodeSVG value={fullShareUrl} size={150} />}
                        </div>
                    </div>

                    <div>
                        <p className={styles.desktopLabel}>Room Code</p>
                        <div className={styles.roomId}>{roomId}</div>
                    </div>

                    {gameState === 'playing' && startTime > 0 && (
                        <div>
                            <p className={styles.desktopTimeLabel}>Time</p>
                            <Timer startTime={startTime} />
                        </div>
                    )}

                    <button onClick={copyLink} className={styles.copyButton}>
                        🔗 Copy Link
                    </button>

                    <div>
                        <p>Mode: <strong>{mode === 'coop' ? 'Cooperative' : 'Competitive'}</strong></p>
                        <p className={styles.desktopModeDescription}>
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
                        socket={socketState!}
                        roomId={roomId as string}
                        onGameOver={handleGameOver}
                        forcedGuesses={mode === 'coop' ? sharedGuesses : undefined}
                        autoFillTrigger={autoFillTrigger}
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
                    <h3 className={styles.playerListTitle}>Players ({players.length})</h3>
                    <div className={styles.playerItemsContainer}>
                        {players.map(p => (
                            <div key={p.id} className={styles.playerItem}>
                                <div className={styles.playerIndicator} />
                                <span>{p.username} {p.id === socketState?.id ? '(You)' : ''}</span>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Opponent Board (Compact, Scaled) */}
                {mode === 'competitive' && gameState === 'playing' && (
                    <div className={styles.opponentBoard}>
                        <h4 className={styles.opponentBoardTitle}>Opponent</h4>
                        {/* Wrapper for scaling */}
                        <div className={styles.opponentBoardWrapper}>
                            <div className={styles.opponentBoardScale}>
                                <OpponentBoard guesses={opponentGuesses} solution={solution} reveal={spyMode} />
                            </div>
                        </div>
                    </div>
                )}

                {/* Chat (Takes remaining space) */}
                <div className={styles.chatContainer}>
                    <Chat socket={socketState} roomId={roomId as string} username={username} onCheat={handleCheat} />
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

