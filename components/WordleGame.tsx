'use client'

import { useEffect, useState, useRef } from 'react'
import GameBoard from './GameBoard'
import Keyboard from './Keyboard'
import { checkGuess, WORDS } from '@/lib/wordUtils'

import { Socket } from 'socket.io-client'
import confetti from 'canvas-confetti'
import toast, { Toaster } from 'react-hot-toast'

interface WordleGameProps {
    initialSolution: string
    socket?: Socket
    roomId?: string
    onGameOver?: (result: 'win' | 'loss') => void
    forcedGuesses?: string[]
    opponentGuesses?: string[]
    autoFillTrigger?: number
}

export default function WordleGame({ initialSolution, socket, roomId, onGameOver, forcedGuesses, opponentGuesses, autoFillTrigger }: WordleGameProps) {
    const [internalGuesses, setInternalGuesses] = useState<string[]>([])

    // Use forcedGuesses if provided, else internal state
    const guesses = forcedGuesses || internalGuesses

    const [currentGuess, setCurrentGuess] = useState('')
    const [turn, setTurn] = useState(0)
    const [isCorrect, setIsCorrect] = useState(false)
    const [usedKeys, setUsedKeys] = useState<Record<string, string>>({})
    const [isShaking, setIsShaking] = useState(false)
    const [message, setMessage] = useState('')

    const isGameOver = isCorrect || turn > 5;

    // Sync turn and check win for forcedGuesses (Coop)
    useEffect(() => {
        if (forcedGuesses) {
            setTurn(forcedGuesses.length);
            const lastGuess = forcedGuesses[forcedGuesses.length - 1];
            if (lastGuess === initialSolution) {
                setIsCorrect(true);
            }
        }
    }, [forcedGuesses, initialSolution]);

    // Handle Auto Fill Cheat
    useEffect(() => {
        if (autoFillTrigger && autoFillTrigger > 0) {
            setCurrentGuess(initialSolution)
        }
    }, [autoFillTrigger, initialSolution])

    // Update Keys when guesses change
    useEffect(() => {
        const newKeys: Record<string, string> = {}
        guesses.forEach(guess => {
            const statuses = checkGuess(guess, initialSolution)
            guess.split('').forEach((char, i) => {
                const status = statuses[i]
                const currentStatus = newKeys[char]
                if (status === 'correct') newKeys[char] = 'correct'
                else if (status === 'present' && currentStatus !== 'correct') newKeys[char] = 'present'
                else if (status === 'absent' && !newKeys[char]) newKeys[char] = 'absent'
            })
        })
        setUsedKeys(newKeys)
    }, [guesses, initialSolution])

    // Handle Input
    useEffect(() => {
        const handleKeyup = (e: KeyboardEvent) => {
            if (isGameOver) return

            // Ignore if typing in input/textarea
            const activeTag = document.activeElement?.tagName.toLowerCase();
            if (activeTag === 'input' || activeTag === 'textarea') return;

            const key = e.key.toUpperCase()

            if (key === 'ENTER') {
                submitGuess()
            } else if (key === 'BACKSPACE') {
                setCurrentGuess(prev => prev.slice(0, -1))
            } else if (/^[A-Z]$/.test(key)) {
                if (currentGuess.length < 5) {
                    setCurrentGuess(prev => prev + key)
                }
            }
        }

        window.addEventListener('keyup', handleKeyup)
        return () => window.removeEventListener('keyup', handleKeyup)
    }, [currentGuess, isGameOver]) // Removed 'turn' dep as submitGuess uses ref/latest state? No, submitGuess closes over state.

    // We need to fix submitGuess closure issue.
    // Actually, simpler to just use current vars, but re-attach listener on every render is fine for this app.
    // The dependency array handles re-attachment.

    const submitGuess = () => {
        if (currentGuess.length !== 5) {
            toast.error("Not enough letters")
            setIsShaking(true)
            setTimeout(() => setIsShaking(false), 600)
            return
        }
        if (!WORDS.includes(currentGuess)) {
            toast.error("Word not found")
            setIsShaking(true)
            setTimeout(() => setIsShaking(false), 600)
            return
        }

        // Logic
        if (!forcedGuesses) {
            setInternalGuesses(prev => [...prev, currentGuess])
        }
        setTurn(prev => prev + 1)

        // Check
        const won = currentGuess === initialSolution
        if (won) {
            setIsCorrect(true)
            toast.success("Splendid!", { duration: 3000 })
            confetti({
                particleCount: 100,
                spread: 70,
                origin: { y: 0.6 }
            })
            if (onGameOver) onGameOver('win')
        } else if (turn >= 5) {
            toast.error(`Game Over! Word was ${initialSolution}`, { duration: 4000 })
            if (onGameOver) onGameOver('loss')
        }

        // Socket emit
        if (socket && roomId) {
            socket.emit('submit_guess', {
                roomId,
                guess: currentGuess,
                turn: turn + 1,
                isCorrect: won
            })
        }

        setCurrentGuess('')
    }

    const showMessage = (msg: string) => {
        setMessage(msg)
        setTimeout(() => setMessage(''), 2000)
    }

    const onChar = (char: string) => {
        if (isGameOver) return
        if (currentGuess.length < 5) setCurrentGuess(prev => prev + char)
    }

    const onDelete = () => {
        if (isGameOver) return
        setCurrentGuess(prev => prev.slice(0, -1))
    }

    const onEnter = () => {
        if (isGameOver) return
        submitGuess()
    }

    return (
        <div style={{ position: 'relative', display: 'flex', flexDirection: 'column', alignItems: 'center', width: '100%' }}>
            <Toaster position="top-center" />
            <GameBoard guesses={guesses} currentGuess={currentGuess} turn={turn} solution={initialSolution} isShaking={isShaking} />

            <Keyboard
                onChar={onChar}
                onDelete={onDelete}
                onEnter={onEnter}
                usedKeys={usedKeys}
            />
        </div>
    )
}
