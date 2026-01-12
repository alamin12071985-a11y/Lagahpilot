import express from 'express';
import cors from 'cors';
import { Telegraf } from 'telegraf';
import { initializeApp } from 'firebase/app';
import { getDatabase, ref, set, get, remove, update, child } from 'firebase/database';
import path from 'path';
import { fileURLToPath } from 'url';

// --- Configuration ---
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const app = express();
const port = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());
app.use(express.static('public'));

// --- Firebase Setup ---
const firebaseConfig = {
    apiKey: "AIzaSyD1PPDhogcw7fBu27PkO1iuMfGFLUwMN70",
    authDomain: "fir-55206.firebaseapp.com",
    databaseURL: "https://fir-55206-default-rtdb.firebaseio.com",
    projectId: "fir-55206",
    storageBucket: "fir-55206.firebasestorage.app",
    messagingSenderId: "24586463698",
    appId: "1:24586463698:web:8b2f21073295ef4382400b",
    measurementId: "G-K676BWHYR4"
};

const firebaseApp = initializeApp(firebaseConfig);
const db = getDatabase(firebaseApp);
const dbRef = ref(db);

// --- Bot Management Memory ---
const activeBots = {}; // Store Telegraf instances: { botId: telegrafInstance }

// --- Helper Functions ---

// Start a single bot
async function startBotInstance(botId, token, commands = []) {
    try {
        if (activeBots[botId]) {
            await activeBots[botId].stop('Restarting');
            delete activeBots[botId];
        }

        const bot = new Telegraf(token);

        // Register Commands
        commands.forEach(cmd => {
            bot.command(cmd.command, (ctx) => {
                try {
                    // Simple eval for dynamic responses (CAUTION: use strictly for owner's bots)
                    // In a real SaaS, use a sandboxed VM or structured responses
                    if (cmd.response.startsWith('ctx.')) {
                        // Secure way: Create a function from string is risky, 
                        // for this demo we allow basic text replies
                        ctx.reply("Dynamic code execution is disabled in this safe mode. Use text.");
                    } else {
                        ctx.reply(cmd.response);
                    }
                } catch (e) {
                    ctx.reply('Error executing command.');
                }
            });
        });

        // Default Welcome
        bot.start((ctx) => ctx.reply('Welcome! Bot is hosted on Laga Host.'));

        await bot.launch();
        activeBots[botId] = bot;
        console.log(`Bot ${botId} started successfully.`);
        return true;
    } catch (error) {
        console.error(`Failed to start bot ${botId}:`, error.message);
        return false;
    }
}

// Stop a bot
async function stopBotInstance(botId) {
    if (activeBots[botId]) {
        try {
            await activeBots[botId].stop();
            delete activeBots[botId];
            return true;
        } catch (e) {
            console.error(e);
        }
    }
    return false;
}

// Initialize all 'RUNNING' bots on server start
async function initBots() {
    console.log("Initializing Bots from Firebase...");
    try {
        const snapshot = await get(child(dbRef, `bots`));
        if (snapshot.exists()) {
            const bots = snapshot.val();
            for (const [id, data] of Object.entries(bots)) {
                if (data.status === 'running') {
                    // Convert commands object to array if needed
                    const cmds = data.commands ? Object.values(data.commands) : [];
                    await startBotInstance(id, data.token, cmds);
                }
            }
        }
    } catch (error) {
        console.error("Error initializing bots:", error);
    }
}

// --- API Routes ---

// Get All Bots
app.get('/api/bots', async (req, res) => {
    try {
        const snapshot = await get(child(dbRef, `bots`));
        const bots = snapshot.exists() ? snapshot.val() : {};
        // Convert object to array for frontend
        const botsArray = Object.keys(bots).map(key => ({
            id: key,
            ...bots[key]
        }));
        res.json(botsArray);
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});

// Create Bot
app.post('/api/createBot', async (req, res) => {
    const { name, token } = req.body;
    const botId = Date.now().toString();
    const newBot = {
        id: botId,
        name: name || 'Unnamed Bot',
        token,
        status: 'stopped',
        created_at: new Date().toISOString(),
        uptime: 0
    };

    try {
        await set(ref(db, 'bots/' + botId), newBot);
        res.json({ success: true, botId });
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});

// Toggle Bot (Start/Stop)
app.post('/api/toggleBot', async (req, res) => {
    const { botId, action } = req.body; // action: 'start' or 'stop'
    
    try {
        const snapshot = await get(child(dbRef, `bots/${botId}`));
        if (!snapshot.exists()) return res.status(404).json({ error: "Bot not found" });
        
        const botData = snapshot.val();
        let success = false;

        if (action === 'start') {
            const cmds = botData.commands ? Object.values(botData.commands) : [];
            success = await startBotInstance(botId, botData.token, cmds);
            if (success) await update(ref(db, `bots/${botId}`), { status: 'running' });
        } else {
            success = await stopBotInstance(botId);
            await update(ref(db, `bots/${botId}`), { status: 'stopped' });
            success = true; // Even if not running, marking as stopped is success
        }

        if(success) res.json({ success: true });
        else res.status(400).json({ error: "Failed to toggle bot" });

    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});

// Delete Bot
app.post('/api/deleteBot', async (req, res) => {
    const { botId } = req.body;
    try {
        await stopBotInstance(botId);
        await remove(ref(db, `bots/${botId}`));
        res.json({ success: true });
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});

// Save Command
app.post('/api/saveCommand', async (req, res) => {
    const { botId, command, response } = req.body;
    const cmdId = Date.now().toString();
    try {
        await set(ref(db, `bots/${botId}/commands/${cmdId}`), {
            id: cmdId,
            command,
            response
        });
        
        // If bot is running, restart it to apply changes
        const snapshot = await get(child(dbRef, `bots/${botId}`));
        if(snapshot.exists() && snapshot.val().status === 'running') {
             const data = snapshot.val();
             const cmds = data.commands ? Object.values(data.commands) : [];
             await startBotInstance(botId, data.token, cmds);
        }

        res.json({ success: true });
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});

// Serve Frontend
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Start Server
app.listen(port, () => {
    console.log(`Laga Host Server running on port ${port}`);
    initBots(); // Restore bots
});
