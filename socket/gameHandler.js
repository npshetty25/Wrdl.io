// Standalone server logic to avoid TS require issues
const WORDS_LIST = [
    'ABUSE', 'ADULT', 'AGENT', 'ANGER', 'APPLE', 'AWARD', 'BASIS', 'BEACH', 'BIRTH', 'BLOCK', 'BLOOD', 'BOARD', 'BRAIN', 'BREAD', 'BREAK', 'BROWN', 'BUYER', 'CAUSE', 'CHAIN', 'CHAIR', 'CHEST', 'CHIEF', 'CHILD', 'CHINA', 'CLAIM', 'CLASS', 'CLOCK', 'COACH', 'COAST', 'COURT', 'COVER', 'CREAM', 'CRIME', 'CROSS', 'CROWD', 'CROWN', 'CYCLE', 'DANCE', 'DEATH', 'DEPTH', 'DOUBT', 'DRAFT', 'DRAMA', 'DREAM', 'DRESS', 'DRINK', 'DRIVE', 'EARTH', 'ENEMY', 'ENTRY', 'ERROR', 'EVENT', 'FAITH', 'FAULT', 'FIELD', 'FIGHT', 'FINAL', 'FLOOR', 'FOCUS', 'FORCE', 'FRAME', 'FRANK', 'FRONT', 'FRUIT', 'GLASS', 'GRANT', 'GRASS', 'GREEN', 'GROUP', 'GUIDE', 'HEART', 'HENRY', 'HORSE', 'HOTEL', 'HOUSE', 'IMAGE', 'INDEX', 'INPUT', 'ISSUE', 'JAPAN', 'JONES', 'JUDGE', 'KNIFE', 'LAURA', 'LAYER', 'LEVEL', 'LEWIS', 'LIGHT', 'LIMIT', 'LUNCH', 'MAJOR', 'MARCH', 'MATCH', 'METAL', 'MODEL', 'MONEY', 'MONTH', 'MOTOR', 'MOUTH', 'MUSIC', 'NIGHT', 'NOISE', 'NORTH', 'NOVEL', 'NURSE', 'OFFER', 'ORDER', 'OTHER', 'OWNER', 'PANEL', 'PAPER', 'PARTY', 'PEACE', 'PETER', 'PHASE', 'PHONE', 'PIECE', 'PILOT', 'PITCH', 'PLACE', 'PLANE', 'PLANT', 'PLATE', 'POINT', 'POUND', 'POWER', 'PRESS', 'PRICE', 'PRIDE', 'PRIZE', 'PROOF', 'QUEEN', 'RADIO', 'RANGE', 'RATIO', 'REPLY', 'RIGHT', 'RIVER', 'ROUND', 'ROUTE', 'RUGBY', 'SCALE', 'SCENE', 'SCOPE', 'SCORE', 'SENSE', 'SHAPE', 'SHARE', 'SHEEP', 'SHEET', 'SHIFT', 'SHIRT', 'SHOCK', 'SIGHT', 'SIMON', 'SKILL', 'SLEEP', 'SMILE', 'SMITH', 'SMOKE', 'SOUND', 'SOUTH', 'SPACE', 'SPEED', 'SPITE', 'SPORT', 'SQUAD', 'STAFF', 'STAGE', 'START', 'STATE', 'STEAM', 'STEEL', 'STICK', 'STOCK', 'STONE', 'STORE', 'STUDY', 'STUFF', 'STYLE', 'SUGAR', 'TABLE', 'TASTE', 'TERRY', 'THEME', 'THING', 'TITLE', 'TOTAL', 'TOUCH', 'TOWER', 'TRACK', 'TRADE', 'TRAIN', 'TREAT', 'TRUST', 'TRUTH', 'UNCLE', 'UNION', 'UNITY', 'VALUE', 'VIDEO', 'VISIT', 'VOICE', 'WASTE', 'WATCH', 'WATER', 'WHILE', 'WHITE', 'WHOLE', 'WOMAN', 'WORLD', 'YOUTH', 'ZEBRA'
];

const rooms = new Map();

module.exports = (io) => {
    io.on('connection', (socket) => {
        console.log('User connected:', socket.id);

        socket.on('join_room', ({ roomId, username, mode }) => {
            // Create room if not exists
            if (!rooms.has(roomId)) {
                const roomMode = mode || 'competitive';
                rooms.set(roomId, {
                    id: roomId,
                    players: [],
                    state: 'waiting',
                    solution: WORDS_LIST[Math.floor(Math.random() * WORDS_LIST.length)],
                    mode: roomMode,
                    guesses: [],
                    startTime: null
                });
            }

            const room = rooms.get(roomId);
            const maxPlayers = room.mode === 'coop' ? 4 : 2;

            if (room.players.length < maxPlayers) {
                if (!room.players.find(p => p.id === socket.id)) {
                    room.players.push({ id: socket.id, username, score: 0 });
                    socket.join(roomId);
                }

                io.to(roomId).emit('player_joined', {
                    players: room.players,
                    roomId,
                    mode: room.mode
                });

                if (room.state === 'playing') {
                    socket.emit('game_start', {
                        solution: room.solution,
                        initialGuesses: room.mode === 'coop' ? room.guesses : [],
                        startTime: room.startTime
                    });
                } else {
                    const shouldStart = room.mode === 'coop' || room.players.length >= 2;

                    if (shouldStart) {
                        room.state = 'playing';
                        room.startTime = Date.now();
                        io.to(roomId).emit('game_start', {
                            solution: room.solution,
                            initialGuesses: [],
                            startTime: room.startTime
                        });
                    }
                }
            } else {
                socket.emit('error_full', 'Room is full');
            }
        });

        socket.on('submit_guess', ({ roomId, guess, turn, isCorrect }) => {
            const room = rooms.get(roomId);
            if (!room) return;

            if (room.mode === 'coop') {
                room.guesses.push(guess);
                io.to(roomId).emit('shared_guess', { guess, turn, isCorrect });

                if (isCorrect) {
                    io.to(roomId).emit('game_over', { winner: 'Team', solution: room.solution });
                } else if (room.guesses.length >= 6) {
                    io.to(roomId).emit('game_over', { winner: 'None', solution: room.solution });
                }
            } else {
                socket.to(roomId).emit('opponent_guess', { guess, turn, isCorrect });
                if (isCorrect) {
                    io.to(roomId).emit('game_over', { winner: socket.id, solution: room.solution });
                }
            }
        });

        socket.on('send_message', ({ roomId, username, message, type = 'text' }) => {
            io.to(roomId).emit('receive_message', { username, message, type });
        });

        socket.on('play_again', ({ roomId }) => {
            const room = rooms.get(roomId);
            if (room) {
                room.solution = WORDS_LIST[Math.floor(Math.random() * WORDS_LIST.length)];
                room.guesses = [];
                room.startTime = Date.now();
                io.to(roomId).emit('game_start', {
                    solution: room.solution,
                    initialGuesses: [],
                    startTime: room.startTime
                });
            }
        });

        socket.on('disconnect', () => {
            rooms.forEach((room, roomId) => {
                const index = room.players.findIndex(p => p.id === socket.id);
                if (index !== -1) {
                    room.players.splice(index, 1);
                    io.to(roomId).emit('player_left', socket.id);
                    if (room.players.length === 0) {
                        rooms.delete(roomId);
                    }
                }
            });
        });
    });
};
