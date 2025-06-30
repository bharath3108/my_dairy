const express = require('express');
const cors = require('cors');
const bcrypt = require('bcrypt');
const app = express();
const mysql2 = require('mysql2');

app.use(cors());
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

const connection = mysql2.createConnection({
    host: 'localhost',
    user: 'root',
    password: 'bunnyminnyR#1234',
    database: 'my_dairy'
});

connection.connect((err) => {
    if (err) {
        console.log(err);
        return;
    }
    console.log('connected to database');
});

app.get('/', (req, res) => {
    res.status(200).json("okkk");
});

// Fetch all posts
app.get('/posts', (req, res) => {
    connection.query('SELECT * FROM posts ORDER BY id DESC', (err, results) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(results);
    });
});

// Fetch single post by ID
app.get('/posts/:id', (req, res) => {
    const id = req.params.id;
    connection.query('SELECT * FROM posts WHERE id = ?', [id], (err, results) => {
        if (err) return res.status(500).json({ error: err.message });
        if (results.length === 0) return res.status(404).json({ error: 'Post not found' });
        res.json(results[0]);
    });
});

app.post('/registeruser', async (req, res) => {
    const { email, password } = req.body;
    try {
        const hashedPassword = await bcrypt.hash(password, 10);
        const sql = 'INSERT INTO users(emailId, password) VALUES (?, ?)';
        connection.query(sql, [email, hashedPassword], (err, result) => {
            if (err) {
                res.status(500).send('not inserted in users');
                return;
            }
            res.status(200).send('inserted in users');
        });
    } catch (err) {
        console.log(err);
        res.status(500).send('error while hashing password');
    }
});

app.post('/userLogin', async (req, res) => {
    const { email, password } = req.body;
    const sql = 'SELECT id, password FROM users WHERE emailId = ?';
    connection.query(sql, [email], async (err, results) => {
        if (err) {
            res.status(500).send('error querying user');
            return;
        }
        if (results.length === 0) {
            res.status(401).send('user not found');
            return;
        }
        const { id, password: hashedPassword } = results[0];
        const match = await bcrypt.compare(password, hashedPassword);
        if (match) {
            res.status(200).json({ id });
        } else {
            res.status(401).send('invalid credentials');
        }
    });
});

app.post('/newPost', async (req, res) => {
    const { postTitle, postDes, userid } = req.body;
    const userId = userid || req.body.userId;
    if (!userId) {
        res.status(400).send('missing user id');
        return;
    }
    const sql = 'INSERT INTO posts(userId, postTitle, postDes) VALUES (?, ?, ?)';
    connection.query(sql, [userId, postTitle, postDes], (err, result) => {
        if (err) {
            res.status(500).send('error inserting post');
            return;
        }
        res.status(200).send('post created');
    });
});

// Fetch posts for a specific user (optional endpoint)
app.get('/getMyPosts', async (req, res) => {
    const userId = req.query.id || req.body.id;
    if (!userId) {
        res.status(400).send('missing user id');
        return;
    }
    connection.query('SELECT * FROM posts WHERE userId = ?', [userId], (err, results) => {
        if (err) {
            res.status(500).send('error fetching posts');
            return;
        }
        res.status(200).json(results);
    });
});

app.listen(3000, () => {
    console.log('port is running');
});