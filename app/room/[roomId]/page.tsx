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
import styles from '@/styles/Game.module.css'

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
    const [modalContent, setModalContent] = useState({ title: '', message: '' })
    const [notification, setNotification] = useState<string | null>(null)

    useEffect(() => {
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
                setModalContent({ title: 'Victory!', message: `Team won! Word: ${revealSolution}` })
                setModalOpen(true)
            } else if (winner === 'None') {
                setModalContent({ title: 'Defeat', message: `Out of turns! Word: ${revealSolution}` })
                setModalOpen(true)
            } else if (winner === socket.id) {
                // I won
            } else {
                setModalContent({ title: 'Game Over', message: `Opponent won! Word: ${revealSolution}` })
                setModalOpen(true)
            }
        })

        socket.on('error_full', (msg) => {
            alert(msg);
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
            setModalContent({ title: 'You Won!', message: `Excellent work!` })
            setModalOpen(true)
        } else {
            // In coop, loss is handled by socket 'game_over' with 'None' usually, 
            // but if local turns run out, we wait.
            if (mode === 'competitive') {
                setModalContent({ title: 'Waiting...', message: `You ran out of turns.` })
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
        <main style={{
            display: 'grid',
            gridTemplateColumns: '250px 1fr 300px',
            height: '100vh',
            gap: '20px',
            padding: '20px',
            maxWidth: '1600px',
            margin: '0 auto',
            gridTemplateAreas: '"sidebar-left game sidebar-right"'
        }}>
            {/* Left Sidebar: Info */}
            <aside style={{ gridArea: 'sidebar-left', display: 'flex', flexDirection: 'column', gap: '20px', background: 'rgba(255,255,255,0.05)', padding: '20px', borderRadius: '10px' }}>
                <div>
                    <h2 style={{ fontSize: '1.2rem', marginBottom: '5px' }}>Share Key</h2>
                    <div style={{ background: 'white', padding: '10px', borderRadius: '8px', width: 'fit-content' }}>
                        <QRCodeSVG value={fullShareUrl} size={150} />
                    </div>
                </div>

                <div>
                    <p style={{ fontSize: '0.9rem', color: '#aaa', margin: 0 }}>Room Code</p>
                    <div style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>{roomId}</div>
                </div>

                {gameState === 'playing' && startTime > 0 && (
                    <div>
                        <p style={{ fontSize: '0.9rem', color: '#aaa', margin: '0 0 5px 0' }}>Time</p>
                        <Timer startTime={startTime} />
                    </div>
                )}

                <button onClick={copyLink} style={{
                    padding: '10px', background: 'var(--color-present)',
                    color: 'white', border: 'none', borderRadius: '5px',
                    cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '5px', justifyContent: 'center'
                }}>
                    🔗 Copy Link
                </button>

                <div>
                    <p>Mode: <strong>{mode === 'coop' ? 'Cooperative' : 'Competitive'}</strong></p>
                    <p style={{ fontSize: '0.8rem', opacity: 0.7 }}>
                        {mode === 'coop' ? 'Work together to solve the word!' : 'Race to find the word first!'}
                    </p>
                </div>
            </aside>

            {/* Center: Game */}
            <section style={{ gridArea: 'game', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', position: 'relative' }}>
                {/* Notification Toast */}
                {notification && (
                    <div style={{
                        position: 'absolute', top: '20px',
                        background: 'var(--color-correct)', color: 'white',
                        padding: '10px 20px', borderRadius: '20px',
                        boxShadow: '0 4px 10px rgba(0,0,0,0.3)', zIndex: 50,
                        animation: 'fadeIn 0.3s ease'
                    }}>
                        {notification}
                    </div>
                )}

                {/* Game Overlay */}
                {gameState === 'playing' ? (
                    <WordleGame
                        initialSolution={solution}
                        socket={socketRef.current!}
                        roomId={roomId as string}
                        onGameOver={handleGameOver}
                        forcedGuesses={mode === 'coop' ? sharedGuesses : undefined}
                    />
                ) : (
                    <div style={{ textAlign: 'center' }}>
                        <h2>Waiting for players...</h2>
                        {mode === 'competitive' && <p>Competitive mode requires 2 players.</p>}
                    </div>
                )}
            </section>

            {/* Right Sidebar: Chat & Players */}
            <aside style={{ gridArea: 'sidebar-right', display: 'flex', flexDirection: 'column', gap: '15px', height: '100%', overflow: 'hidden' }}>

                {/* Player List (Compact) */}
                <div style={{ background: 'rgba(255,255,255,0.05)', padding: '10px', borderRadius: '10px', height: '120px', overflowY: 'auto', flexShrink: 0 }}>
                    <h3 style={{ marginTop: 0, fontSize: '1rem', marginBottom: '8px' }}>Players ({players.length})</h3>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
                        {players.map(p => (
                            <div key={p.id} style={{
                                padding: '5px 8px', background: 'rgba(255,255,255,0.1)',
                                borderRadius: '15px', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.9rem'
                            }}>
                                <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: 'var(--color-correct)' }} />
                                <span>{p.username} {p.id === socketRef.current?.id ? '(You)' : ''}</span>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Opponent Board (Compact, Scaled) */}
                {mode === 'competitive' && gameState === 'playing' && (
                    <div style={{ background: 'rgba(255,255,255,0.05)', padding: '10px', borderRadius: '10px', height: '180px', flexShrink: 0, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
                        <h4 style={{ margin: '0 0 5px 0', fontSize: '0.9rem' }}>Opponent</h4>
                        {/* Wrapper for scaling */}
                        <div style={{ flex: 1, position: 'relative' }}>
                            <div style={{ transform: 'scale(0.6)', transformOrigin: 'top left', width: '166%', position: 'absolute' }}>
                                <OpponentBoard guesses={opponentGuesses} solution={solution} />
                            </div>
                        </div>
                    </div>
                )}

                {/* Chat (Takes remaining space) */}
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minHeight: '0', overflow: 'hidden' }}>
                    <Chat socket={socketRef.current} roomId={roomId as string} username={username} />
                </div>
            </aside>

            {modalOpen && (
                <Modal
                    title={modalContent.title}
                    message={modalContent.message}
                    actionLabel="Play Again"
                    onAction={handleRematch}
                    onClose={() => setModalOpen(false)}
                />
            )}
        </main>
    )
}
