require('dotenv').config();
const express = require('express');
const { Telegraf } = require('telegraf');
const admin = require("firebase-admin");
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const path = require('path');

const app = express();

// --- SECURITY ---
app.use(helmet({ contentSecurityPolicy: false }));
app.use(cors());
app.use(express.json({ limit: '10kb' }));
app.use(express.static(path.join(__dirname, 'public')));

// Rate Limiting
const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, 
    max: 100, 
    message: "Too many requests, slow down!"
});
app.use('/api/', limiter);

// --- FIREBASE ADMIN INIT ---
let serviceAccount;
try {
    if (process.env.FIREBASE_SERVICE_ACCOUNT) {
        serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
    } else {
        serviceAccount = require("./firebase-key.json");
    }
    admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
        // আপনার দেওয়া কনফিগ অনুযায়ী ডাটাবেস লিংক
        databaseURL: "https://fir-55206-default-rtdb.firebaseio.com"
    });
} catch (e) { console.error("Firebase Admin Error:", e.message); }

const db = admin.database();
const activeBots = {};

// --- PLANS ---
const PLANS = {
    free: { bots: 1, logs: false, editor: false },
    pro: { bots: 5, logs: true, editor: true },
    vip: { bots: 999, logs: true, editor: true }
};

// --- AUTH MIDDLEWARE ---
const verifyUser = async (req, res, next) => {
    const token = req.headers.authorization;
    if (!token) return res.status(401).json({ error: "No Access" });
    try {
        const decoded = await admin.auth().verifyIdToken(token);
        req.user = decoded;
        const uSnap = await db.ref(`users/${decoded.uid}`).once('value');
        req.userData = uSnap.val();
        if (!req.userData) return res.status(403).json({ error: "User setup incomplete" });
        next();
    } catch (e) { res.status(403).json({ error: "Invalid Token" }); }
};

// --- ENDPOINTS ---

// Secure Login (IP Locking)
app.post('/api/auth/login', async (req, res) => {
    const { token } = req.body;
    const ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress;
    
    try {
        const decoded = await admin.auth().verifyIdToken(token);
        const uid = decoded.uid;
        
        // Check IP Duplication
        const ipSnap = await db.ref('ip_records').orderByValue().equalTo(ip).once('value');
        let blockUser = false;

        if (ipSnap.exists()) {
            ipSnap.forEach(child => {
                if (child.key !== uid) blockUser = true; // Same IP, Different Account
            });
        }

        if (blockUser) {
            return res.status(403).json({ error: "Security Alert: Multiple accounts detected on this IP!" });
        }

        await db.ref(`ip_records/${uid}`).set(ip);

        const userRef = db.ref(`users/${uid}`);
        const uSnap = await userRef.once('value');
        
        if (!uSnap.exists()) {
            await userRef.set({
                email: decoded.email,
                name: decoded.name || 'User',
                plan: 'free',
                joined: Date.now(),
                ip: ip
            });
        }
        res.json({ success: true });

    } catch (e) { res.status(500).json({ error: e.message }); }
});

// Dashboard Data
app.get('/api/dashboard', verifyUser, async (req, res) => {
    const uid = req.user.uid;
    const botsSnap = await db.ref('bots').orderByChild('owner').equalTo(uid).once('value');
    const bots = [];
    botsSnap.forEach(b => bots.push({ id: b.key, ...b.val() }));

    // Mock Stats
    const stats = {
        total: Math.floor(Math.random() * 5000),
        active: Math.floor(Math.random() * 1200),
        weekly: Math.floor(Math.random() * 300)
    };

    res.json({ plan: req.userData.plan, bots, stats });
});

// Create Bot
app.post('/api/createBot', verifyUser, async (req, res) => {
    const limit = PLANS[req.userData.plan].bots;
    const botsSnap = await db.ref('bots').orderByChild('owner').equalTo(req.user.uid).once('value');
    
    if (botsSnap.numChildren() >= limit) return res.status(403).json({ error: "Upgrade Plan Required!" });

    const { name, token } = req.body;
    const botId = Date.now().toString();
    await db.ref(`bots/${botId}`).set({ name, token, owner: req.user.uid, status: 'STOP' });
    res.json({ success: true });
});

// Toggle Bot
app.post('/api/toggleBot', verifyUser, async (req, res) => {
    const { botId, action } = req.body;
    const botRef = await db.ref(`bots/${botId}`).once('value');
    if (botRef.val().owner !== req.user.uid) return res.status(403).json({ error: "Unauthorized" });

    if (action === 'start') {
        if (activeBots[botId]) activeBots[botId].stop();
        try {
            const bot = new Telegraf(botRef.val().token);
            bot.context.db = db;
            bot.context.botId = botId;
            
            // Commands Load
            const cmds = (await db.ref(`commands/${botId}`).once('value')).val() || {};
            Object.entries(cmds).forEach(([c, code]) => {
                bot.command(c, async (ctx) => {
                    try { new Function('ctx', code)(ctx); } catch(e){ ctx.reply('Error: '+e.message); }
                });
            });

            bot.launch();
            activeBots[botId] = bot;
            await db.ref(`bots/${botId}`).update({ status: 'RUN' });
        } catch (e) { return res.status(500).json({ error: "Invalid Token" }); }
    } else {
        if (activeBots[botId]) activeBots[botId].stop();
        delete activeBots[botId];
        await db.ref(`bots/${botId}`).update({ status: 'STOP' });
    }
    res.json({ success: true });
});

// Payment Request
app.post('/api/payment', verifyUser, async (req, res) => {
    const { trxId, plan, method } = req.body;
    await db.ref('payment_requests').push({
        uid: req.user.uid,
        email: req.userData.email,
        trxId, plan, method, time: Date.now()
    });
    res.json({ success: true });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`💎 Laga Host Server on ${PORT}`));
