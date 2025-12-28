# ⚔️ Arena Shooter (Up to 8 Players)

A real-time multiplayer first-person shooter arena built with Three.js and Socket.io. Battle against up to 7 other players in an enclosed arena!

![Game Screenshot](https://img.shields.io/badge/Three.js-r128-green) ![Socket.io](https://img.shields.io/badge/Socket.io-4.5.4-blue) ![Node.js](https://img.shields.io/badge/Node.js-14%2B-brightgreen)

## 🎮 Features

### Gameplay
- ⚔️ **Multiplayer PvP Combat** - Battle against up to 7 other players (8 players max)
- 🏟️ **Enclosed Arena** - 40x40 unit arena with walls
- ❤️ **Health System** - 100 HP, 25 damage per hit (4 shots to kill)
- 💀 **Death & Respawn** - 3-second respawn after death
- 🔫 **Ammo Management** - 30 bullets with reload (R key)
- 📊 **Kill/Death Tracking** - Track your K/D ratio
- 🔊 **Sound Effects** - Dynamic audio using Web Audio API

### Multiplayer
- 👥 **Max 8 Players** - Battle royale style combat
- 🎯 **Real-time Combat** - See opponent's health and position
- 💚 **Health Bars** - Visual health indicators above players
- 🏆 **Live Scoreboard** - Track kills and deaths
- 🎮 **Player Name Tags** - See who you're fighting
- 🔄 **Auto-respawn** - Even works for inactive players

### Controls
- **W/A/S/D** - Move around
- **Mouse** - Look/Aim
- **Left Click** - Shoot
- **R** - Reload

## 🚀 Quick Start

### Prerequisites
- Node.js 14 or higher
- npm or yarn

### Installation

1. Clone the repository:
```bash
git clone https://github.com/idsithija/threejs-multi.git
cd threejs-multi
```

2. Install dependencies:
```bash
npm install
```

3. Start the server:
```bash
npm start
```

4. Open your browser and navigate to:
```
http://localhost:3000
```

## 🌐 Deploy to Render.com (FREE!)

Deploy your game for free so friends can play with you from anywhere!

### Steps:

1. **Sign up at [Render.com](https://render.com)** (free account)

2. **Create a New Web Service**:
   - Click "New +" → "Web Service"
   - Connect your GitHub account
   - Select the `threejs-multi` repository

3. **Configure the service**:
   - **Name**: `threejs-arena` (or any name you like)
   - **Environment**: `Node`
   - **Build Command**: `npm install`
   - **Start Command**: `npm start`
   - **Plan**: Select **Free**

4. **Deploy**:
   - Click "Create Web Service"
   - Wait 2-3 minutes for deployment
   - Your game will be live at: `https://your-app-name.onrender.com`

5. **Share with friends**:
   - Send them your Render URL
   - Maximum 8 players can play at once
   - Everyone clicks to start playing!

### ⚠️ Free Tier Notes:
- Service spins down after 15 minutes of inactivity
- First load after inactivity takes ~30 seconds to wake up
- Perfect for casual gaming with friends!
- No credit card required

## 🎯 How to Play

1. Enter your name on the start screen
2. Wait for other players to join (max 8 players)
3. Use WASD to move, mouse to aim
4. Click to shoot your opponent
5. Hit them 4 times to get a kill
6. Respawn after 3 seconds when killed
7. Battle for the highest K/D ratio!

## 🛠️ Technology Stack

- **Frontend**: Three.js r128 (3D graphics)
- **Backend**: Node.js + Express
- **Real-time Communication**: Socket.io
- **Audio**: Web Audio API

## 📁 Project Structure

```
threejs-multi/
├── public/
│   └── multiplayer-shooting-game.html  # Game client
├── server.js                            # Node.js server
├── package.json                         # Dependencies
├── render.yaml                          # Render config
└── README.md                            # This file
```

## 🐛 Troubleshooting

**Can't see other player?**
- Make sure both players have joined
- Refresh the page
- Check browser console for errors

**Game is slow?**
- Free tier has limited resources
- Works best with 2 players max

**Server won't start locally?**
- Run `npm install` again
- Check if port 3000 is available

## 📝 License

MIT License - feel free to use and modify!

## 🤝 Contributing

Pull requests are welcome! Feel free to improve the game.

---

Made with ❤️ for multiplayer gaming
