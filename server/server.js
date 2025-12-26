require('dotenv').config();
const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const cors = require('cors');
const bodyParser = require('body-parser');
const path = require('path');
const fs = require('fs');
const multer = require('multer'); // Requires: npm install multer

const app = express();

const PORT = process.env.PORT || 8787;
const SECRET_KEY = process.env.JWT_SECRET || 'dev_secret';

app.use(cors());
app.use(bodyParser.json());

// --- FILE UPLOAD SETUP ---
const UPLOADS_DIR = path.join(__dirname, 'uploads');
if (!fs.existsSync(UPLOADS_DIR)) {
    fs.mkdirSync(UPLOADS_DIR);
}

// Serve uploaded files statically
app.use('/uploads', express.static(UPLOADS_DIR));

const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, UPLOADS_DIR)
    },
    filename: function (req, file, cb) {
        // Generate unique filename: timestamp-random-originalName
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        const ext = path.extname(file.originalname);
        cb(null, uniqueSuffix + ext)
    }
});

const upload = multer({ 
    storage: storage,
    limits: { fileSize: 50 * 1024 * 1024 } // Increased to 50MB
});


// --- DB SETUP ---
const dbPath = path.resolve(__dirname, 'openkey.db');
const db = new sqlite3.Database(dbPath, (err) => {
    if (err) console.error('Error opening database', err);
    else {
        console.log('✅ Connected to SQLite database');
        initDb();
    }
});

function initDb() {
    db.serialize(() => {
        // 1. Create Tables
        db.run(`
            CREATE TABLE IF NOT EXISTS users (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                username TEXT UNIQUE NOT NULL,
                password_hash TEXT NOT NULL,
                avatar TEXT,
                last_seen DATETIME DEFAULT CURRENT_TIMESTAMP,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP
            )
        `);
        db.run(`
            CREATE TABLE IF NOT EXISTS messages (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                sender_id INTEGER,
                receiver_id INTEGER,
                content TEXT,
                attachment_url TEXT,
                attachment_type TEXT,
                is_read INTEGER DEFAULT 0,
                is_secret INTEGER DEFAULT 0,
                expires_at DATETIME,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP
            )
        `);
        
        // 2. Migrations (Safe Add Columns)
        const runMigration = (sql) => {
            db.run(sql, (err) => {
                 if (err && !err.message.includes('duplicate column name')) {
                     // console.log('Migration info:', err.message);
                 }
            });
        };

        runMigration("ALTER TABLE users ADD COLUMN last_seen DATETIME DEFAULT CURRENT_TIMESTAMP");
        runMigration("ALTER TABLE messages ADD COLUMN is_read INTEGER DEFAULT 0");
        runMigration("ALTER TABLE messages ADD COLUMN attachment_url TEXT");
        runMigration("ALTER TABLE messages ADD COLUMN attachment_type TEXT");
        runMigration("ALTER TABLE messages ADD COLUMN is_secret INTEGER DEFAULT 0");
        runMigration("ALTER TABLE messages ADD COLUMN expires_at DATETIME");
    });
}

// Middleware to update last_seen for online status
const updateLastSeen = (req, res, next) => {
    const token = req.headers['authorization']?.split(' ')[1];
    if (token) {
        jwt.verify(token, SECRET_KEY, (err, decoded) => {
            if (!err && decoded) {
                db.run('UPDATE users SET last_seen = CURRENT_TIMESTAMP WHERE id = ?', [decoded.id], (err) => {});
                req.user = decoded; 
            }
        });
    }
    next();
};

app.use(updateLastSeen);

// --- AUTH ROUTES ---

app.get('/register', (req, res) => {
    const { username, password } = req.query;
    if (!username || !password) return res.status(400).json({ error: 'Required fields missing' });

    const salt = bcrypt.genSaltSync(10);
    const hash = bcrypt.hashSync(password, salt);
    const avatar = `https://api.dicebear.com/7.x/initials/svg?seed=${username}`;
    const stmt = db.prepare('INSERT INTO users (username, password_hash, avatar) VALUES (?, ?, ?)');
    stmt.run(username, hash, avatar, function(err) {
        if (err) return res.status(409).json({ error: 'Username taken' });
        const token = jwt.sign({ id: this.lastID, username }, SECRET_KEY);
        res.json({ token, user: { id: this.lastID.toString(), username, avatar, isOnline: true } });
    });
});

app.post('/login', (req, res) => {
    const { username, password } = req.body;
    db.get('SELECT * FROM users WHERE username = ?', [username], (err, row) => {
        if (!row) return res.status(404).json({ error: 'User not found' });
        if (!bcrypt.compareSync(password, row.password_hash)) return res.status(401).json({ error: 'Invalid password' });
        
        const token = jwt.sign({ id: row.id, username: row.username }, SECRET_KEY);
        res.json({ token, user: { id: row.id.toString(), username: row.username, avatar: row.avatar, isOnline: true } });
    });
});

app.get('/me', (req, res) => {
    const token = req.headers['authorization']?.split(' ')[1];
    if (!token) return res.status(401).json({ error: 'No token' });

    jwt.verify(token, SECRET_KEY, (err, decoded) => {
        if (err) return res.status(403).json({ error: 'Invalid token' });
        db.get('SELECT id, username, avatar FROM users WHERE id = ?', [decoded.id], (err, row) => {
            if (!row) return res.status(404).json({ error: 'User not found' });
            res.json({ user: { id: row.id.toString(), username: row.username, avatar: row.avatar, isOnline: true } });
        });
    });
});

// --- MESSAGING & UPLOAD ROUTES ---

// 1. Upload Endpoint
app.post('/upload', upload.single('file'), (req, res) => {
    if (!req.file) return res.status(400).json({ error: 'No file uploaded' });
    
    // Determine type basic logic
    const mime = req.file.mimetype;
    let type = 'file';
    
    // Treat everything that is NOT an image as a generic file (including video)
    if (mime.startsWith('image/')) {
        type = 'image';
    } 
    // Video will now fall into 'file' type, so client renders it as a download link
    
    res.json({ 
        url: `uploads/${req.file.filename}`, 
        type: type,
        originalName: req.file.originalname 
    });
});

// Get all users
app.get('/users', (req, res) => {
    if (!req.user) return res.status(401).json({ error: 'Unauthorized' });
    db.all('SELECT id, username, avatar, last_seen FROM users WHERE id != ?', [req.user.id], (err, rows) => {
        if (err) {
             if (err.message.includes('no such column')) {
                 return res.json([]);
             }
             return res.status(500).json({ error: err.message });
        }
        
        const users = rows.map(r => {
            let isOnline = false;
            if (r.last_seen) {
                const t = r.last_seen.split(/[- :]/);
                const lastSeenDate = new Date(Date.UTC(t[0], t[1]-1, t[2], t[3], t[4], t[5]));
                isOnline = (Date.now() - lastSeenDate.getTime()) < 20000;
            }

            return {
                id: r.id.toString(),
                username: r.username,
                avatar: r.avatar,
                isOnline: isOnline
            };
        });
        res.json(users);
    });
});

// Send Message (Supports text AND/OR attachment AND secret mode)
app.post('/messages', (req, res) => {
    if (!req.user) return res.status(401).json({ error: 'Unauthorized' });

    const { receiverId, text, attachmentUrl, attachmentType, isSecret } = req.body;
    
    // We do NOT handle TTL/expires logic here anymore as per request.

    const stmt = db.prepare('INSERT INTO messages (sender_id, receiver_id, content, attachment_url, attachment_type, is_secret) VALUES (?, ?, ?, ?, ?, ?)');
    stmt.run(
        req.user.id, 
        receiverId, 
        text || '', 
        attachmentUrl || null, 
        attachmentType || null, 
        isSecret ? 1 : 0, 
        function(err) {
            if (err) return res.status(500).json({ error: err.message });
            res.json({ success: true, id: this.lastID });
    });
});

// Mark messages as read
app.post('/messages/:partnerId/read', (req, res) => {
    if (!req.user) return res.status(401).json({ error: 'Unauthorized' });
    const stmt = db.prepare('UPDATE messages SET is_read = 1 WHERE sender_id = ? AND receiver_id = ?');
    stmt.run(req.params.partnerId, req.user.id, (err) => {
        if (err) console.error(err); // ignore
        res.json({ success: true });
    });
});

// Get Messages
app.get('/messages/:partnerId', (req, res) => {
    if (!req.user) return res.status(401).json({ error: 'Unauthorized' });
    
    const partnerId = req.params.partnerId;
    const myId = req.user.id;

    const sql = `
        SELECT * FROM messages 
        WHERE (sender_id = ? AND receiver_id = ?) 
           OR (sender_id = ? AND receiver_id = ?)
        ORDER BY created_at ASC
    `;
    
    db.all(sql, [myId, partnerId, partnerId, myId], (err, rows) => {
        if (err) return res.status(500).json({ error: err.message });
        
        const messages = rows.map(row => ({
            id: row.id.toString(),
            senderId: row.sender_id.toString(),
            text: row.content,
            attachmentUrl: row.attachment_url,
            attachmentType: row.attachment_type,
            timestamp: row.created_at,
            isMine: row.sender_id === myId,
            status: row.is_read ? 'read' : 'sent',
            isSecret: row.is_secret === 1
        }));
        
        res.json(messages);
    });
});

app.listen(PORT, () => {
    console.log(`🚀 Server running on http://localhost:${PORT}`);
});