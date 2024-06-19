const express = require('express');
const jwt = require('jsonwebtoken');
const dotenv = require('dotenv');
const cors = require('cors');

// Load environment variables from .env file
dotenv.config();

const app = express();
const port = process.env.PORT || 3000;
const secretKey = process.env.SECRET_KEY;

let receivedPacket = '';

app.use(express.json());
app.use(cors());
app.use(express.static('public'));

const authenticateJWT = (req, res, next) => {
    const token = req.header('Authorization');
    if (!token) {
        return res.status(401).send('Access Denied');
    }

    try {
        const verified = jwt.verify(token, secretKey);
        req.user = verified;
        next();
    } catch (error) {
        console.error('Invalid token', error);
        res.status(400).send('Invalid Token');
    }
};

app.post('/receive-packet', authenticateJWT, (req, res) => {
    console.log('Packet received:', req.body.packet);
    receivedPacket = req.body.packet;
    res.status(200).send('Packet received');
});

app.get('/packet', (req, res) => {
    res.json({ packet: receivedPacket });
});

app.listen(port, () => {
    console.log(`Web server is running on port ${port}`);
});
