# MongoDB Setup Instructions

## 1. Create MongoDB Atlas Account (Free)

1. Go to https://www.mongodb.com/cloud/atlas/register
2. Sign up for free account
3. Create a new cluster (M0 Free tier)
4. Wait for cluster to deploy (~5 minutes)

## 2. Get Connection String

1. Click "Connect" on your cluster
2. Select "Connect your application"
3. Copy the connection string (looks like: `mongodb+srv://username:password@cluster.mongodb.net/`)
4. Replace `<password>` with your database password

## 3. Configure Environment Variables

Update `.env` file with your MongoDB connection string:

```
MONGODB_URI=mongodb+srv://YOUR_USERNAME:YOUR_PASSWORD@cluster.mongodb.net/shooting-game?retryWrites=true&w=majority
SESSION_SECRET=your-secret-key-change-this-to-random-string
PORT=3000
```

**Important:** Generate a random SESSION_SECRET for production

## 4. Whitelist IP Address

In MongoDB Atlas:
1. Go to Network Access
2. Click "Add IP Address"
3. Select "Allow Access from Anywhere" (0.0.0.0/0) for development
   - For production, whitelist only your server IP

## 5. Create Database User

In MongoDB Atlas:
1. Go to Database Access
2. Click "Add New Database User"
3. Create username and password
4. Give user "Read and Write" privileges

## 6. Test Locally

```bash
npm install
node server.js
```

Visit http://localhost:3000 and try registering a new account

## 7. Deploy to Railway

1. Add environment variables in Railway dashboard:
   - MONGODB_URI = your connection string
   - SESSION_SECRET = your secret key
   
2. Push to GitHub - Railway will auto-deploy

## Features Now Available

✅ User registration and login
✅ Persistent stats (kills, deaths, games played)
✅ Session management
✅ Secure password hashing
✅ Database-backed leaderboards

## Testing

- Register a new account
- Play a game
- Log out and log back in
- Your stats should persist!
