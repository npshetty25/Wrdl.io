'use client'

import { useEffect, useState, useRef } from 'react'
import { Socket } from 'socket.io-client'

interface ChatProps {
    socket: Socket | null
    roomId: string
    username: string
}

export default function Chat({ socket, roomId, username }: ChatProps) {
    const [messages, setMessages] = useState<{ user: string, text: string }[]>([])
    const [input, setInput] = useState('')
    const msgsEndRef = useRef<HTMLDivElement>(null)

    useEffect(() => {
        if (!socket) return;

        socket.on('receive_message', ({ username: user, message }) => {
            setMessages(prev => [...prev, { user, text: message }])
        })

        return () => {
            socket.off('receive_message')
        }
    }, [socket])

    useEffect(() => {
        msgsEndRef.current?.scrollIntoView({ behavior: 'smooth' })
    }, [messages])

    const send = (e: React.FormEvent) => {
        e.preventDefault()
        if (!input.trim() || !socket) return

        socket.emit('send_message', { roomId, username, message: input })
        setInput('')
    }

    return (
        <div style={{
            display: 'flex', flexDirection: 'column',
            height: '300px', width: '100%',
            border: '1px solid var(--tile-border)', borderRadius: '8px',
            background: 'rgba(0,0,0,0.05)'
        }}>
            <div style={{
                flex: 1, overflowY: 'auto', padding: '10px',
                display: 'flex', flexDirection: 'column', gap: '5px'
            }}>
                {messages.map((m, i) => (
                    <div key={i} style={{ wordBreak: 'break-word' }}>
                        <strong>{m.user}:</strong> {m.text}
                    </div>
                ))}
                <div ref={msgsEndRef} />
            </div>
            <form onSubmit={send} style={{ display: 'flex', borderTop: '1px solid var(--tile-border)' }}>
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
