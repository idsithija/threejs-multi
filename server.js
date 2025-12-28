const express = require('express');
const app = express();
const http = require('http').createServer(app);
const io = require('socket.io')(http, {
    cors: {
        origin: "*",
        methods: ["GET", "POST"]
    }
});

const PORT = process.env.PORT || 3000;

let players = {};
const MAX_PLAYERS = 2;

app.use(express.static('public'));

app.get('/', (req, res) => {
    res.sendFile(__dirname + '/public/multiplayer-shooting-game.html');
});

io.on('connection', (socket) => {
    console.log('Player connected:', socket.id);

    socket.on('joinGame', (data) => {
        // Check max players
        if (Object.keys(players).length >= MAX_PLAYERS) {
            socket.emit('maxPlayersReached');
            socket.disconnect();
            return;
        }

        players[socket.id] = {
            id: socket.id,
            name: data.name,
            kills: 0,
            deaths: 0,
            health: 100,
            position: { x: 0, y: 1.6, z: 5 },
            rotation: { y: 0 }
        };

        socket.emit('playerInfo', {
            id: socket.id,
            players: players
        });

        io.emit('playerJoined', {
            players: players
        });

        console.log(`${data.name} joined the arena (${Object.keys(players).length}/${MAX_PLAYERS})`);
    });

    socket.on('playerMove', (data) => {
        if (players[socket.id]) {
            players[socket.id].position = data.position;
            players[socket.id].rotation = data.rotation;
            if (data.health !== undefined) {
                players[socket.id].health = data.health;
            }

            socket.broadcast.emit('playerMoved', {
                id: socket.id,
                name: players[socket.id].name,
                position: data.position,
                rotation: data.rotation,
                health: players[socket.id].health
            });
        }
    });

    socket.on('shootPlayer', (data) => {
        const shooter = players[socket.id];
        const victim = players[data.targetId];
        
        if (shooter && victim && victim.health > 0) {
            const damage = 25; // 4 shots to kill
            victim.health -= damage;
            
            if (victim.health <= 0) {
                victim.health = 0;
                victim.deaths++;
                shooter.kills++;
                
                console.log(`${shooter.name} killed ${victim.name}`);
                
                // Auto-respawn after 3 seconds (in case client is inactive)
                setTimeout(() => {
                    if (players[data.targetId] && players[data.targetId].health === 0) {
                        const spawnX = (Math.random() - 0.5) * 30;
                        const spawnZ = (Math.random() - 0.5) * 30;
                        
                        players[data.targetId].health = 100;
                        players[data.targetId].position = { x: spawnX, y: 1.6, z: spawnZ };
                        
                        io.emit('playerRespawned', {
                            id: data.targetId,
                            name: players[data.targetId].name,
                            position: players[data.targetId].position,
                            health: 100,
                            rotation: players[data.targetId].rotation
                        });
                        
                        // Force client to respawn
                        io.to(data.targetId).emit('forceRespawn', {
                            position: players[data.targetId].position
                        });
                    }
                }, 3000);
            }
            
            // Notify the victim
            io.to(data.targetId).emit('playerHit', {
                victimId: data.targetId,
                shooterId: socket.id,
                health: victim.health,
                damage: damage
            });
            
            // Update stats for everyone
            io.emit('statsUpdate', {
                players: players
            });
        }
    });

    socket.on('respawn', (data) => {
        if (players[socket.id]) {
            players[socket.id].health = 100;
            players[socket.id].position = data.position;
            if (data.rotation) {
                players[socket.id].rotation = data.rotation;
            }
            
            io.emit('playerRespawned', {
                id: socket.id,
                name: players[socket.id].name,
                position: data.position,
                health: 100,
                rotation: players[socket.id].rotation
            });
            
            // Also update stats to ensure consistency
            io.emit('statsUpdate', {
                players: players
            });
        }
    });

    socket.on('scoreUpdate', (data) => {
        if (players[socket.id]) {
            players[socket.id].score = data.score;
            io.emit('scoreUpdate', {
                players: players
            });
        }
    });

    socket.on('disconnect', () => {
        console.log('Player disconnected:', socket.id);
        delete players[socket.id];
        
        io.emit('playerLeft', {
            playerId: socket.id,
            players: players
        });
    });
});

http.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
    console.log(`1v1 Arena - Visit http://localhost:${PORT} to play`);
    console.log(`Max players: ${MAX_PLAYERS}`);
});