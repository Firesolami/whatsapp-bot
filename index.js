const fs = require("fs");
const qrcode = require("qrcode");

const express = require("express");
const app = express();
const port = process.env.PORT || 3000;

const qrcode = require('qrcode-terminal');
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
let qrPath = "./qr.png";

client.on("qr", async (qr) => {
    console.log("QR Code received, generating image");

    await qrcode.toFile(qrPath, qr);
    
    console.log('QR Code generated');
});

app.get("/qr", (req, res) => {
  res.sendFile(qrPath, { root: __dirname });
});

// Start the server
app.listen(port, () => {
  console.log(`QR Code server running on PORT: ${port}`);
});

client.on('ready', () => {
  console.log('Bot is ready!');
});

client.on('message', async (message) => {
  if (message.author === process.env.PHONE_NUMBER) {
    console.log(`Message from ${process.env.USERNAME}: ${message.body}`);

    if (message.body.toLowerCase() === process.env.TAG_ALL_COMMAND) {
      console.log('Request to tag all group chat members');

      try {
        const chat = await client.getChatById(message.from);
        const participants = chat.participants;

        const mentions = participants.map((p) => p.id._serialized);
        const mentionText = participants.map((p) => `@${p.id.user}`).join(' ');

        await chat.sendMessage(`${mentionText}`, { mentions });
        console.log('Successfully tagged all group members');
      } catch {
        console.log('An error occured');
      }
    }
  }
});

client.on('disconnected', (reason) => {
  console.log('Disconnected:', reason);
  client.initialize();
});

client.initialize();
