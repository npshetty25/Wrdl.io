'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'

export default function Lobby() {
  const router = useRouter()
  const [username, setUsername] = useState('')
  const [roomId, setRoomId] = useState('')
  const [mode, setMode] = useState<'competitive' | 'coop'>('competitive')

  const createRoom = () => {
    if (!username) return alert('Enter username')
    const id = Math.random().toString(36).substring(7)
    router.push(`/room/${id}?username=${username}&mode=${mode}`)
  }

  const joinRoom = () => {
    if (!username || !roomId) return alert('Enter username and room ID')
    router.push(`/room/${roomId}?username=${username}`)
  }

  return (
    <main style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: '100vh',
      padding: '2rem',
      overflow: 'hidden',
      position: 'relative'
    }}>
      {/* Background overlay for depth */}
      <div style={{
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: 'radial-gradient(circle at center, rgba(0,0,0,0) 0%, rgba(0,0,0,0.5) 100%)',
        zIndex: 0,
        pointerEvents: 'none'
      }} />

      <div style={{ zIndex: 1, width: '100%', maxWidth: '1200px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1.5rem' }}>

        {/* Title Section */}
        <div className="floating" style={{ textAlign: 'center' }}>
          <h1 style={{
            fontSize: '4rem',
            fontWeight: '900',
            margin: 0,
            background: 'linear-gradient(to right, #ffffff, #a0a0a0)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            filter: 'drop-shadow(0 0 20px rgba(255,255,255,0.2))',
            letterSpacing: '-2px'
          }}>
            Wrdl<span style={{ color: 'var(--color-correct)', WebkitTextFillColor: 'var(--color-correct)' }}>.io</span>
          </h1>
          <p style={{ color: '#888', fontSize: '1rem', marginTop: '0.2rem', letterSpacing: '4px', textTransform: 'uppercase' }}>
            Multiplayer Word Strategy
          </p>
        </div>

        {/* Mode Selection */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
          gap: '1rem',
          width: '100%',
          maxWidth: '800px'
        }}>
          {/* Competitive Card */}
          <div
            className={`mode-card ${mode === 'competitive' ? 'selected' : ''}`}
            onClick={() => setMode('competitive')}
            style={{
              padding: '1.5rem',
              borderRadius: '20px',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '0.5rem',
            }}
          >
            <div style={{ position: 'relative', width: '120px', height: '120px' }}>
              <Image
                src="/competitive-icon.png"
                alt="Competitive Mode"
                fill
                style={{ objectFit: 'contain', filter: 'drop-shadow(0 0 15px rgba(138, 43, 226, 0.4))' }}
              />
            </div>
            <h2 style={{ fontSize: '1.5rem', margin: 0, color: mode === 'competitive' ? '#a78bfa' : '#fff' }}>Competitive</h2>
            <p style={{ textAlign: 'center', color: '#ccc', margin: 0, fontSize: '0.9rem' }}>
              1v1 Battle. Race to solve the word. <br />Interfere with your opponent.
            </p>
          </div>

          {/* Cooperative Card */}
          <div
            className={`mode-card ${mode === 'coop' ? 'selected' : ''}`}
            onClick={() => setMode('coop')}
            style={{
              padding: '1.5rem',
              borderRadius: '20px',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '0.5rem',
            }}
          >
            <div style={{ position: 'relative', width: '120px', height: '120px' }}>
              <Image
                src="/cooperative-icon.png"
                alt="Cooperative Mode"
                fill
                style={{ objectFit: 'contain', filter: 'drop-shadow(0 0 15px rgba(46, 204, 113, 0.4))' }}
              />
            </div>
            <h2 style={{ fontSize: '1.5rem', margin: 0, color: mode === 'coop' ? '#4ade80' : '#fff' }}>Cooperative</h2>
            <p style={{ textAlign: 'center', color: '#ccc', margin: 0, fontSize: '0.9rem' }}>
              Team up. Solve together. <br />Share the board and victory.
            </p>
          </div>
        </div>

        {/* Controls Section */}
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          gap: '1.5rem',
          width: '100%',
          maxWidth: '400px',
          background: 'rgba(0,0,0,0.2)',
          padding: '2rem',
          borderRadius: '20px',
          backdropFilter: 'blur(10px)',
          border: '1px solid rgba(255,255,255,0.05)'
        }}>
          <input
            className="glass-input"
            placeholder="Enter Username"
            value={username}
            onChange={e => setUsername(e.target.value)}
            style={{
              padding: '1rem',
              fontSize: '1.1rem',
              borderRadius: '12px',
              color: 'white',
              width: '100%'
            }}
          />

          <button
            className="action-btn"
            onClick={createRoom}
            style={{
              padding: '1rem',
              fontSize: '1.2rem',
              cursor: 'pointer',
              background: 'linear-gradient(45deg, #538d4e, #7bc675)',
              color: 'white',
              border: 'none',
              borderRadius: '12px',
              fontWeight: 'bold',
              boxShadow: '0 4px 15px rgba(83, 141, 78, 0.4)'
            }}
          >
            Create {mode === 'competitive' ? 'Battle' : 'Team'}
          </button>

          <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
            <div style={{ flex: 1, height: '1px', background: 'rgba(255,255,255,0.1)' }}></div>
            <span style={{ color: '#666', fontSize: '0.9rem' }}>OR</span>
            <div style={{ flex: 1, height: '1px', background: 'rgba(255,255,255,0.1)' }}></div>
          </div>

          <div style={{ display: 'flex', gap: '10px' }}>
            <input
              className="glass-input"
              placeholder="Room ID"
              value={roomId}
              onChange={e => setRoomId(e.target.value)}
              style={{
                flex: 2,
                padding: '1rem',
                fontSize: '1rem',
                borderRadius: '12px',
                color: 'white'
              }}
            />
            <button
              className="action-btn"
              onClick={joinRoom}
              style={{
                flex: 1,
                padding: '1rem',
                fontSize: '1rem',
                cursor: 'pointer',
                background: 'rgba(255,255,255,0.1)',
                color: 'white',
                border: '1px solid rgba(255,255,255,0.1)',
                borderRadius: '12px',
                fontWeight: 'bold'
              }}
            >
              Join
            </button>
          </div>
        </div>
      </div>
    </main>
  )
}
