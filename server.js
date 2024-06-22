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
let clients = [];

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
    receivedPacket = req.body.packet;
    console.log('Packet received:', receivedPacket);

    // Send the update to all connected clients
    clients.forEach(client => client.res.write(receivedPacket));

    res.status(200).send('Packet received');
});

app.get('/events', (req, res) => {
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');

    // Send an initial message to confirm connection
    //res.write(`data: Connected\n\n`);

    const clientId = Date.now();
    clients.push({ id: clientId, res });

    req.on('close', () => {
        clients = clients.filter(client => client.id !== clientId);
    });
});

app.listen(port, () => {
    const message = `Web server is running on port ${port}`;
    console.log(message);
});
