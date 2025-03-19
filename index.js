require('dotenv').config();
const fs = require('fs');
const qrcode = require('qrcode');

const express = require('express');
const app = express();
const port = process.env.PORT || 3000;

const { Client, LocalAuth } = require('whatsapp-web.js');

// Client setup
const client = new Client({
  authStrategy: new LocalAuth({
    dataPath: '/app/.wwebjs_auth'
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
app.get('/ping', (req, res) => {
  res.status(200).send('pong');
});

// Start the server
app.listen(port, () => {
  console.log(`QR Code server running on PORT: ${port}`);
});

client.on('ready', () => {
  console.log('Bot is ready!');
});

client.on('message', async (message) => {
  if (
    message.author === process.env.WA_PHONE_NUMBER &&
    message.body.startsWith(`@${process.env.WA_BOT_PHONE_NUMBER}`)
  ) {
    console.log(`Message from ${process.env.WA_USERNAME}: ${message.body}`);

    if (
      message.body.toLowerCase().includes(process.env.TAG_ALL_COMMAND) &&
      message.from.includes('@g.us')
    ) {
      console.log('Request to tag all group chat members');

      try {
        const chat = await client.getChatById(message.from);
        const participants = chat.participants;

        const mentions = participants
          .map((p) => p.id._serialized)
          .filter((p) => {
            return p !== message.author && p !== message.to;
          });
        const mentionText = participants
          .map((p) => `@${p.id.user}`)
          .filter((p) => {
            return (
              p !== `@${message.author.split('@')[0]}` &&
              p !== `@${message.to.split('@')[0]}`
            );
          })
          .join(' ');

        await chat.sendMessage(`${mentionText}`, { mentions });
        console.log('Successfully tagged all group members');
      } catch {
        console.log('An error occured');
      }
    }
  } else {
    if (
      message.body.trim().toLowerCase() ===
      `@${process.env.WA_BOT_PHONE_NUMBER} ${process.env.TAG_ALL_COMMAND}`
    ) {
      console.log(`Request from ${message.from} to tag all members.`);
      message.reply('Bro thought');
    }
    const unreadChat = await client.getChatById(message.from);
    await unreadChat.sendSeen();
  }
});

client.on('disconnected', (reason) => {
  console.log('Disconnected:', reason);
  client.initialize();
});

client.initialize();
