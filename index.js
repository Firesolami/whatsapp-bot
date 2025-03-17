require('dotenv');
const qrcode = require('qrcode-terminal');
const { Client, LocalAuth } = require('whatsapp-web.js');

const client = new Client({
  authStrategy: new LocalAuth(),
  puppeteer: {
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  }
});

client.on('qr', (qr) => {
  qrcode.generate(qr, { small: true });
  console.log('Scan this QR code with your WhatsApp app.');
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
