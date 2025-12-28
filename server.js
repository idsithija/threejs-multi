require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const session = require('express-session');
const MongoStore = require('connect-mongo');
const User = require('./models/User');

const app = express();
const http = require('http').createServer(app);
const io = require('socket.io')(http, {
    cors: {
        origin: "*",
        methods: ["GET", "POST"]
    }
});

const PORT = process.env.PORT || 3000;

// MongoDB connection
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/shooting-game', {
    useNewUrlParser: true,
    useUnifiedTopology: true
}).then(() => {
    console.log('✓ MongoDB connected');
}).catch(err => {
    console.log('MongoDB connection error:', err);
});

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Session configuration
app.use(session({
    secret: process.env.SESSION_SECRET || 'your-secret-key',
    resave: false,
    saveUninitialized: false,
    store: MongoStore.create({
        mongoUrl: process.env.MONGODB_URI || 'mongodb://localhost:27017/shooting-game'
    }),
    cookie: {
        maxAge: 1000 * 60 * 60 * 24 * 7 // 1 week
    }
}));

let players = {};
const MAX_PLAYERS = 8;

app.use(express.static('public'));

// Auth Routes
app.post('/api/register', async (req, res) => {
    try {
        const { username, password } = req.body;

        // Validate input
        if (!username || !password) {
            return res.status(400).json({ error: 'Username and password required' });
        }

        if (username.length < 3 || username.length > 15) {
            return res.status(400).json({ error: 'Username must be 3-15 characters' });
        }

        if (password.length < 6) {
            return res.status(400).json({ error: 'Password must be at least 6 characters' });
        }

        // Check if user exists
        const existingUser = await User.findOne({ username });
        if (existingUser) {
            return res.status(400).json({ error: 'Username already taken' });
        }

        // Create new user
        const user = new User({ username, password });
        await user.save();

        // Set session
        req.session.userId = user._id;
        req.session.username = user.username;

        res.json({ 
            success: true,
            userId: user._id,
            username: user.username,
            stats: user.stats
        });
    } catch (error) {
        console.error('Registration error:', error);
        res.status(500).json({ error: 'Server error during registration' });
    }
});

app.post('/api/login', async (req, res) => {
    try {
        const { username, password } = req.body;

        // Validate input
        if (!username || !password) {
            return res.status(400).json({ error: 'Username and password required' });
        }

        // Find user
        const user = await User.findOne({ username });
        if (!user) {
            return res.status(401).json({ error: 'Invalid username or password' });
        }

        // Check password
        const isMatch = await user.comparePassword(password);
        if (!isMatch) {
            return res.status(401).json({ error: 'Invalid username or password' });
        }

        // Set session
        req.session.userId = user._id;
        req.session.username = user.username;

        res.json({ 
            success: true,
            userId: user._id,
            username: user.username,
            stats: user.stats
        });
    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ error: 'Server error during login' });
    }
});

app.post('/api/logout', (req, res) => {
    req.session.destroy();
    res.json({ success: true });
});

app.get('/api/user', (req, res) => {
    if (req.session.userId) {
        User.findById(req.session.userId).then(user => {
            if (user) {
                res.json({ 
                    authenticated: true,
                    userId: user._id,
                    username: user.username,
                    stats: user.stats
                });
            } else {
                res.json({ authenticated: false });
            }
        });
    } else {
        res.json({ authenticated: false });
    }
});

app.get('/', (req, res) => {
    res.sendFile(__dirname + '/public/multiplayer-shooting-game.html');
});

io.on('connection', (socket) => {
    console.log('Player connected:', socket.id);

    socket.on('joinGame', (data) => {
        // Remove any old player with the same name (handles refreshes)
        for (let id in players) {
            if (players[id].name === data.name && id !== socket.id) {
                console.log(`Removing old instance of ${data.name} (${id})`);
                delete players[id];
                io.emit('playerLeft', {
                    playerId: id,
                    players: players
                });
            }
        }

        // Check max players AFTER cleaning up duplicates
        if (Object.keys(players).length >= MAX_PLAYERS) {
            socket.emit('maxPlayersReached');
            socket.disconnect();
            return;
        }

        players[socket.id] = {
            id: socket.id,
            name: data.name,
            userId: data.userId || null, // Store user ID for database updates
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
        
        // Broadcast muzzle flash to all other players
        socket.broadcast.emit('playerShot', {
            shooterId: socket.id,
            position: shooter ? shooter.position : null
        });
        
        if (shooter && victim && victim.health > 0) {
            const damage = 25; // 4 shots to kill
            victim.health -= damage;
            
            if (victim.health <= 0) {
                victim.health = 0;
                victim.deaths++;
                shooter.kills++;
                
                console.log(`${shooter.name} killed ${victim.name}`);
                
                // Notify all players that victim died (to hide mesh)
                io.emit('playerDied', {
                    victimId: data.targetId
                });
                
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
            // Server generates spawn position
            const spawnX = (Math.random() - 0.5) * 30;
            const spawnZ = (Math.random() - 0.5) * 30;
            const spawnRotation = Math.random() * Math.PI * 2;
            
            players[socket.id].health = 100;
            players[socket.id].position = { x: spawnX, y: 1.6, z: spawnZ };
            players[socket.id].rotation = { y: spawnRotation };
            
            // Send spawn position back to the respawning player
            io.to(socket.id).emit('playerRespawned', {
                id: socket.id,
                name: players[socket.id].name,
                position: players[socket.id].position,
                health: 100,
                rotation: players[socket.id].rotation
            });
            
            // Broadcast to other players
            socket.broadcast.emit('playerRespawned', {
                id: socket.id,
                name: players[socket.id].name,
                position: players[socket.id].position,
                health: 100,
                rotation: players[socket.id].rotation
            });
            
            // Update stats for everyone
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

    socket.on('disconnect', async () => {
        console.log('Player disconnected:', socket.id);
        
        // Save stats to database if authenticated
        if (players[socket.id] && players[socket.id].userId) {
            try {
                await User.findByIdAndUpdate(players[socket.id].userId, {
                    $inc: {
                        'stats.kills': players[socket.id].kills || 0,
                        'stats.deaths': players[socket.id].deaths || 0,
                        'stats.gamesPlayed': 1
                    }
                });
                console.log(`Saved stats for user: ${players[socket.id].name}`);
            } catch (error) {
                console.error('Error saving stats:', error);
            }
        }
        
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