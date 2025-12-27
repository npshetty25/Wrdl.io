# Wrdl.io (Realtime Wordle)🎮

A real-time multiplayer Wordle clone with Competitive and Cooperative modes.

## How to Start the Game

1.  **Open Terminal** (Command Prompt or PowerShell).
2.  **Navigate to the folder**:
    ```bash
    cd "c:\Users\shett\OneDrive\Desktop\wordle"
    ```
    *(Or wherever you saved the project)*
3.  **Start the Server**:
    ```bash
    npm run dev
    ```
4.  **Open Browser**:
    Go to [http://localhost:3000](http://localhost:3000)

## Features

-   **Multiplayer**: Real-time updates via Socket.io.
-   **Modes**:
    -   **Competitive**: Race to solve the word first.
    -   **Cooperative**: Work together on a shared board.
-   **Visuals**: Deep space animated background, glassmorphism UI.
-   **Timer**: Track your speed.
-   **Sharing**: QR Code and easy Link copying.

## Playing on Mobile (Local Network)

To play with friends on the same WiFi (or test on your phone):

1.  **Find your IP Address**:
    -   Run `ipconfig` in the terminal.
    -   Look for **IPv4 Address** (e.g., `192.168.1.5`).

2.  **Start Server for Network**:
    ```bash
    npm run dev -- -H 0.0.0.0
    ```

3.  **Connect**:
    -   On your phone, go to `http://YOUR_IP_ADDRESS:3000`
    -   Example: `http://192.168.1.5:3000`

**Note for QR Codes**:
When you open the game on your PC using the **IP Address** (not `localhost`), the QR code generated will work for your phone!

## Tech Stack
-   Next.js
-   Socket.io
-   TypeScript
-   Vanilla CSS
