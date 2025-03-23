require('dotenv').config();
const qrcode = require('qrcode');

const mongoose = require('mongoose');
const { MongoStore } = require('wwebjs-mongo');

const express = require('express');
const app = express();
const port = process.env.PORT || 3000;

const { Client, RemoteAuth } = require('whatsapp-web.js');
const MONGO_URI = process.env.MONGO_URI;

async function connectDB() {
    try {
        await mongoose.connect(MONGO_URI);
        console.log('Connected to MongoDB');
    } catch (err) {
        console.error('Failed to connect to MongoDB:', err);
        process.exit(1);
    }
}

(async () => {
    await connectDB();

    const store = new MongoStore({ mongoose });

    const client = new Client({
        authStrategy: new RemoteAuth({
            store,
            backupSyncIntervalMs: 60000
        }),
        puppeteer: {
            args: ['--no-sandbox', '--disable-setuid-sandbox']
        }
    });

    // QR Code Generation
    let qrPath = './qr.png';

    client.on('qr', async (qr) => {
        console.log('QR Code received, generating image');
        await qrcode.toFile(qrPath, qr);
        console.log('QR Code generated');
    });

    app.get('/qr/:secret', (req, res) => {
        const { secret } = req.params;
        if (secret === process.env.ENDPOINT_SECRET) {
            res.sendFile(qrPath, { root: __dirname });
        } else {
            res.status(401).send('Go away');
        }
    });

    // Health check
    app.get('/ping', (req, res) => res.status(200).send('pong'));

    // Start the server
    app.listen(port, () =>
        console.log(`QR Code server running on PORT: ${port}`)
    );

    client.on('ready', () => console.log('Bot is ready!'));

    client.on('message', async (message) => {
        // Group messages
        if (
            message.author === process.env.WA_PHONE_NUMBER &&
            message.body.startsWith(`@${process.env.WA_BOT_PHONE_NUMBER}`)
        ) {
            console.log(
                `Message from ${process.env.WA_USERNAME}: ${message.body}`
            );

            if (
                message.body
                    .toLowerCase()
                    .includes(process.env.TAG_ALL_COMMAND) &&
                message.from.includes('@g.us')
            ) {
                console.log('Request to tag all group chat members');
                try {
                    const chat = await client.getChatById(message.from);
                    const participants = chat.participants;

                    const mentions = participants
                        .map((p) => p.id._serialized)
                        .filter(
                            (p) => p !== message.author && p !== message.to
                        );
                    const mentionText = participants
                        .map((p) => `@${p.id.user}`)
                        .filter(
                            (p) =>
                                p !== `@${message.author.split('@')[0]}` &&
                                p !== `@${message.to.split('@')[0]}`
                        )
                        .join(' ');

                    await chat.sendMessage(`${mentionText}`, { mentions });
                    console.log('Successfully tagged all group members');
                } catch {
                    console.log('An error occurred');
                }
            }
        } else {
            if (
                message.body.trim().toLowerCase() ===
                `@${process.env.WA_BOT_PHONE_NUMBER} ${process.env.TAG_ALL_COMMAND}`
            ) {
                console.log(`Request from ${message.from} to tag all members.`);
                message.reply('Lmao bro thought');
            }
            const unreadChat = await client.getChatById(message.from);
            await unreadChat.sendSeen();
        }

        // DMs
        if (
            message.from === process.env.WA_PHONE_NUMBER &&
            !message.from.includes('@g.us')
        ) {
            try {
                if (message.hasMedia) {
                    const media = await message.downloadMedia();
                    console.log('Received media');

                    if (!media.mimetype.startsWith('image/')) {
                        console.log('Unsupported file type:', media.mimetype);
                        await message.reply('Only supports pictures for now');
                        return;
                    }

                    await client.sendMessage(message.from, media, {
                        sendMediaAsSticker: true
                    });
                    console.log('Sent sticker');
                }
            } catch (error) {
                console.error('Error converting to sticker:', error);
                message.reply('Failed to convert to sticker.');
            }
        }
    });

    client.on('disconnected', (reason) => {
        console.log('Disconnected:', reason);
        client.initialize();
    });

    client.initialize();
})();
