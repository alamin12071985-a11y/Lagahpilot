require('dotenv').config();
const { Telegraf } = require('telegraf');
const express = require('express');
const cors = require('cors');
const path = require('path');
const admin = require("firebase-admin");
const fs = require('fs');

const app = express();
app.use(express.json());
app.use(cors({ origin: '*' }));
app.use(express.static(path.join(__dirname, 'public')));

// --- Firebase Initialization ---
// নোট: Render-এ হোস্ট করার সময় এনভায়রনমেন্ট ভেরিয়েবল ব্যবহার করা ভালো,
// তবে সহজ করার জন্য আমরা এখানে ফাইল রিড করছি।
let serviceAccount;
try {
    if (process.env.FIREBASE_SERVICE_ACCOUNT) {
        serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
    } else {
        serviceAccount = require("./firebase-key.json");
    }

    admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
        // আপনার ডাটাবেস URL এখানে দিন (Firebase Console > Realtime Database)
        databaseURL: "https://fir-55206-default-rtdb.firebaseio.com" 
    });
    console.log("🔥 Firebase Connected Successfully!");
} catch (error) {
    console.error("❌ Firebase Init Error: 'firebase-key.json' missing or invalid URL.");
    console.error("Make sure to replace databaseURL in server.js line 27");
}

const db = admin.database();
const activeBots = {}; // Store running bot instances

// --- Bot Management Functions ---

async function launchBot(botId) {
    try {
        const botSnapshot = await db.ref(`bots/${botId}`).once('value');
        const botData = botSnapshot.val();

        if (!botData || !botData.token) return false;

        // Stop existing instance if running
        if (activeBots[botId]) {
            try { await activeBots[botId].stop('SIGTERM'); } catch (e) {}
            delete activeBots[botId];
        }

        const bot = new Telegraf(botData.token);
        
        // Load Commands
        const cmdSnapshot = await db.ref(`commands/${botId}`).once('value');
        const commands = cmdSnapshot.val() || {};

        // Register Commands
        Object.entries(commands).forEach(([cmdName, code]) => {
            bot.command(cmdName, async (ctx) => {
                try {
                    // Safety: In production, sanitize this!
                    const runCode = new Function('ctx', code);
                    runCode(ctx);
                } catch (err) {
                    ctx.reply(`⚠️ Script Error: ${err.message}`);
                }
            });
        });

        bot.launch();
        activeBots[botId] = bot;
        
        await db.ref(`bots/${botId}`).update({ status: 'RUN' });
        return true;
    } catch (error) {
        console.error(`Error launching bot ${botId}:`, error);
        await db.ref(`bots/${botId}`).update({ status: 'STOP' });
        return false;
    }
}

async function stopBot(botId) {
    if (activeBots[botId]) {
        try { await activeBots[botId].stop('SIGTERM'); } catch (e) {}
        delete activeBots[botId];
    }
    await db.ref(`bots/${botId}`).update({ status: 'STOP' });
    return true;
}

// --- API Endpoints ---

// Get All Bots
app.get('/api/bots', async (req, res) => {
    try {
        const snapshot = await db.ref('bots').once('value');
        const bots = snapshot.val() || {};
        // Convert object to array for frontend
        const botList = Object.keys(bots).map(key => ({
            botId: key,
            ...bots[key]
        }));
        res.json(botList);
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});

// Create Bot
app.post('/api/createBot', async (req, res) => {
    const { token, name } = req.body;
    if (!token || !name) return res.status(400).json({ error: "Missing fields" });

    const botId = Date.now().toString(); // Simple ID generation
    const newBot = {
        token,
        name,
        status: 'STOP',
        createdAt: admin.database.ServerValue.TIMESTAMP
    };

    try {
        await db.ref(`bots/${botId}`).set(newBot);
        res.json({ success: true, botId });
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});

// Delete Bot
app.post('/api/deleteBot', async (req, res) => {
    const { botId } = req.body;
    try {
        await stopBot(botId);
        await db.ref(`bots/${botId}`).remove();
        await db.ref(`commands/${botId}`).remove();
        res.json({ success: true });
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});

// Toggle Bot (Start/Stop)
app.post('/api/toggleBot', async (req, res) => {
    const { botId, action } = req.body; // action: 'start' or 'stop'
    try {
        if (action === 'start') {
            await launchBot(botId);
        } else {
            await stopBot(botId);
        }
        res.json({ success: true });
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});

// Get Commands
app.get('/api/commands', async (req, res) => {
    const { botId } = req.query;
    try {
        const snapshot = await db.ref(`commands/${botId}`).once('value');
        res.json(snapshot.val() || {});
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});

// Save Command
app.post('/api/saveCommand', async (req, res) => {
    const { botId, commandName, code } = req.body;
    try {
        await db.ref(`commands/${botId}/${commandName}`).set(code);
        // Restart bot to apply changes if running
        if (activeBots[botId]) {
            await stopBot(botId);
            await launchBot(botId);
        }
        res.json({ success: true });
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});

// Delete Command
app.post('/api/deleteCommand', async (req, res) => {
    const { botId, commandName } = req.body;
    try {
        await db.ref(`commands/${botId}/${commandName}`).remove();
        if (activeBots[botId]) {
            await stopBot(botId);
            await launchBot(botId);
        }
        res.json({ success: true });
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`🚀 LagaHost Server running on port ${PORT}`));
