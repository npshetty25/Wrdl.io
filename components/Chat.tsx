import { useEffect, useState, useRef } from 'react'
import { Socket } from 'socket.io-client'

interface ChatProps {
    socket: Socket | null
    roomId: string
    username: string
}

interface Message {
    user: string
    text: string
    type: 'text' | 'sticker'
}

const STICKERS = [
    '/stickers/sticker_1.png',
    '/stickers/sticker_2.png',
    '/stickers/sticker_3.png',
    '/stickers/sticker_4.png',
    '/stickers/sticker_5.png',
    '/stickers/sticker_6.png',
]

export default function Chat({ socket, roomId, username }: ChatProps) {
    const [messages, setMessages] = useState<Message[]>([])
    const [input, setInput] = useState('')
    const [showStickers, setShowStickers] = useState(false)
    const msgsEndRef = useRef<HTMLDivElement>(null)

    const audioRef = useRef<HTMLAudioElement | null>(null)

    useEffect(() => {
        audioRef.current = new Audio('/sounds/message.mp3')
    }, [])

    useEffect(() => {
        if (!socket) return;

        socket.on('receive_message', ({ username: user, message, type }) => {
            setMessages(prev => [...prev, { user, text: message, type: type || 'text' }])

            // Play sound if not my message
            if (user !== username) {
                audioRef.current?.play().catch(() => { })
            }
        })

        return () => {
            socket.off('receive_message')
        }
    }, [socket, username])

    useEffect(() => {
        msgsEndRef.current?.scrollIntoView({ behavior: 'smooth' })
    }, [messages])

    const send = (e: React.FormEvent) => {
        e.preventDefault()
        if (!input.trim() || !socket) return

        socket.emit('send_message', { roomId, username, message: input, type: 'text' })
        setInput('')
        setShowStickers(false)
    }

    const sendSticker = (stickerPath: string) => {
        if (!socket) return
        socket.emit('send_message', { roomId, username, message: stickerPath, type: 'sticker' })
        setShowStickers(false)
    }

    return (
        <div style={{
            display: 'flex', flexDirection: 'column',
            height: '300px', width: '100%',
            border: '1px solid var(--tile-border)', borderRadius: '8px',
            background: 'rgba(0,0,0,0.05)',
            position: 'relative'
        }}>
            <div style={{
                flex: 1, overflowY: 'auto', padding: '10px',
                display: 'flex', flexDirection: 'column', gap: '5px'
            }}>
                {messages.map((m, i) => (
                    <div key={i} style={{ wordBreak: 'break-word', display: 'flex', flexDirection: 'column', alignItems: 'flex-start' }}>
                        <span style={{ fontSize: '0.8rem', opacity: 0.7 }}>{m.user}</span>
                        {m.type === 'sticker' ? (
                            <img src={m.text} alt="sticker" style={{ width: '100px', borderRadius: '5px' }} />
                        ) : (
                            <span>{m.text}</span>
                        )}
                    </div>
                ))}
                <div ref={msgsEndRef} />
            </div>

            {/* Sticker Picker */}
            {showStickers && (
                <div style={{
                    position: 'absolute', bottom: '50px', left: '0', right: '0',
                    background: '#222', borderTop: '1px solid var(--tile-border)',
                    padding: '10px', display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px',
                    maxHeight: '200px', overflowY: 'auto', borderRadius: '8px 8px 0 0', zIndex: 10
                }}>
                    {STICKERS.map((s, i) => (
                        <div key={i} onClick={() => sendSticker(s)} style={{ cursor: 'pointer', padding: '5px', background: 'rgba(255,255,255,0.1)', borderRadius: '5px', display: 'flex', justifyContent: 'center' }}>
                            <img src={s} alt={`sticker ${i}`} style={{ width: '60px', height: '60px', objectFit: 'contain' }} />
                        </div>
                    ))}
                </div>
            )}

            <form onSubmit={send} style={{ display: 'flex', borderTop: '1px solid var(--tile-border)' }}>
                <button
                    type="button"
                    onClick={() => setShowStickers(!showStickers)}
                    style={{ padding: '0 10px', background: 'transparent', border: 'none', fontSize: '1.2rem', cursor: 'pointer' }}
                >
                    😊
                </button>
                <input
                    value={input}
                    onChange={e => setInput(e.target.value)}
                    placeholder="Chat..."
                    style={{ flex: 1, padding: '10px', border: 'none', background: 'transparent', color: 'inherit', outline: 'none' }}
                />
                <button type="submit" style={{ padding: '0 15px', background: 'var(--color-present)', border: 'none', color: 'white', cursor: 'pointer' }}>
                    Send
                </button>
            </form>
        </div>
    )
}
