/*
 * Copyright (c) 2024 Timothy Kelly and Peter Leibold
 *
 * This project is licensed under the Creative Commons Attribution-NonCommercial 4.0 International (CC BY-NC 4.0) License with additional terms.
 *
 * You are free to:
 * - Share — copy and redistribute the material in any medium or format
 * - Adapt — remix, transform, and build upon the material
 *
 * Under the following terms:
 * - Attribution — You must give appropriate credit, provide a link to the license, and indicate if changes were made. You may do so in any reasonable manner, but not in any way that suggests the licensor endorses you or your use.
 * - NonCommercial — You may not use the material for commercial purposes. Commercial purposes do not include use in commercial performances.
 *
 * Additional terms:
 * - The material may be used in commercial performances, provided that the performance itself is not a software product sold for profit.
 * - The material may not be included as part of any paid-for software package or any other software product that is sold for profit.
 *
 * To view a copy of this license, visit http://creativecommons.org/licenses/by-nc/4.0/ or send a letter to Creative Commons, PO Box 1866, Mountain View, CA 94042, USA.
 */


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
let venue = "capstr"
let showname = "this show"

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

app.post('/show-setup', authenticateJWT, (req, res) => {
    receivedPacket = req.body.packet;
    try {
        const parsedData = JSON.parse(receivedPacket);
        console.log('Parsed Data:', parsedData);

        venue = parsedData.venue;
        showname = parsedData.showname;
        
        console.log('Venue:', venue);
        console.log('Show Name:', showname);

        res.status(200).send('Setup received');
    } catch (error) {
        console.error('Error parsing JSON:', error);
        res.status(400).send('Invalid JSON format');
    }
});

app.get('/show-setup-client', (req, res) => {
    // Example data - replace with your actual logic to get the show setup data
    const showSetupData = {
        venue: venue,
        showname: showname
    };

    res.status(200).json(showSetupData);
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

// Send keep-alive messages to clients
setInterval(() => {
    try {
        clients.forEach(client => {
            if (!client.res.finished) {
                client.res.write('data: {"keepAlive": true}\n\n');
                console.log("ping sent");
            }
        });
    } catch (error) {
        console.error('Error in setInterval:', error);
    }
}, 15000);

app.listen(port, () => {
    const message = `Web server is running on port ${port}`;
    console.log(message);
});
