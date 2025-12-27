'use client'

import { useEffect, useState } from 'react'
export default function Timer({ startTime }: { startTime: number }) {
    const [elapsed, setElapsed] = useState(0)

    useEffect(() => {
        if (!startTime) return
        const interval = setInterval(() => {
            setElapsed(Date.now() - startTime)
        }, 1000)
        return () => clearInterval(interval)
    }, [startTime])

    const cur = Math.max(0, elapsed);
    const seconds = Math.floor((cur / 1000) % 60)
    const minutes = Math.floor((cur / 1000 / 60) % 60)

    return (
        <div style={{
            fontSize: '1.2rem',
            fontWeight: 'bold',
            fontFamily: 'monospace',
            background: 'rgba(0,0,0,0.3)',
            padding: '5px 12px',
            borderRadius: '5px',
            border: '1px solid rgba(255,255,255,0.2)',
            color: '#fff',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '5px'
        }}>
            <span>⏱️</span>
            {minutes.toString().padStart(2, '0')}:{seconds.toString().padStart(2, '0')}
        </div>
    )
}
