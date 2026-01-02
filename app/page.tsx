'use client' // responsive


import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import styles from './Home.module.css'

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
    <main className={styles.main}>
      {/* Background overlay for depth */}
      <div className={styles.overlay} />

      <div className={styles.content}>

        {/* Title Section */}
        <div className={styles.floating}>
          <h1 className={styles.title}>
            Wrdl<span className={styles.titleSuffix}>.io</span>
          </h1>
          <p className={styles.subtitle}>
            Multiplayer Word Strategy
          </p>
        </div>

        {/* Mode Selection */}
        <div className={styles.modeContainer}>
          {/* Competitive Card */}
          <div
            className={`mode-card ${mode === 'competitive' ? 'selected' : ''} ${styles.modeCard}`}
            onClick={() => setMode('competitive')}
          >
            <div className={styles.iconWrapper}>
              <Image
                src="/competitive-icon.png"
                alt="Competitive Mode"
                fill
                className={styles.modeImage}
                style={{ filter: 'drop-shadow(0 0 15px rgba(138, 43, 226, 0.4))' }}
              />
            </div>
            <div className={styles.cardContent}>
              <h2 className={styles.modeTitle} style={{ color: mode === 'competitive' ? '#a78bfa' : '#fff' }}>Competitive</h2>
              <p className={styles.modeDescription} style={{ color: '#ccc' }}>
                1v1 Battle. Race to solve the word. <br />Interfere with your opponent.
              </p>
            </div>
          </div>

          {/* Cooperative Card */}
          <div
            className={`mode-card ${mode === 'coop' ? 'selected' : ''} ${styles.modeCard}`}
            onClick={() => setMode('coop')}
          >
            <div className={styles.iconWrapper}>
              <Image
                src="/cooperative-icon.png"
                alt="Cooperative Mode"
                fill
                className={styles.modeImage}
                style={{ filter: 'drop-shadow(0 0 15px rgba(46, 204, 113, 0.4))' }}
              />
            </div>
            <div className={styles.cardContent}>
              <h2 className={styles.modeTitle} style={{ color: mode === 'coop' ? '#4ade80' : '#fff' }}>Cooperative</h2>
              <p className={styles.modeDescription} style={{ color: '#ccc' }}>
                Team up. Solve together. <br />Share the board and victory.
              </p>
            </div>
          </div>
        </div>

        {/* Controls Section */}
        <div className={styles.controls}>
          <input
            className={`glass-input ${styles.input}`}
            placeholder="Enter Username"
            value={username}
            onChange={e => setUsername(e.target.value)}
          />

          <button
            className={`action-btn ${styles.createButton}`}
            onClick={createRoom}
          >
            Create {mode === 'competitive' ? 'Battle' : 'Team'}
          </button>

          <div className={styles.divider}>
            <div className={styles.line}></div>
            <span className={styles.orText}>OR</span>
            <div className={styles.line}></div>
          </div>

          <div className={styles.joinContainer}>
            <input
              className={`glass-input ${styles.joinInput}`}
              placeholder="Room ID"
              value={roomId}
              onChange={e => setRoomId(e.target.value)}
            />
            <button
              className={`action-btn ${styles.joinButton}`}
              onClick={joinRoom}
            >
              Join
            </button>
          </div>
        </div>
      </div>
      <div style={{ position: 'absolute', bottom: '10px', right: '10px', color: 'rgba(255,255,255,0.3)', fontSize: '0.8rem' }}>
        v1.1
      </div>
    </main>
  )
}
