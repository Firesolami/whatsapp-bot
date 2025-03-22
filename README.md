# WhatsApp Bot

A WhatsApp bot that can tag all members in a group chat. Built with Node.js and [whatsapp-web.js](https://wwebjs.dev/).

More features coming soon. 🚀

Hopefully I'll not forget to update the docs when I add a new feature lol

## Features

- Tag all members in a group chat using a command
- QR code generation for WhatsApp Web authentication
- Auto mark messages as read
- Health check endpoint

## Prerequisites

- Node.js (v16 or higher)
- A WhatsApp account
- Git

## Setup

1. Clone the repository:

```bash
git clone https://github.com/firesolami/whatsapp-bot.git
cd whatsapp-bot
```

2. Install dependencies:

```bash
npm i
```

3. Create a `.env` file in the root directory with the following variables:

```env
PORT=3000
WA_USERNAME="your-name"
WA_PHONE_NUMBER="your-whatsapp-number@c.us"
WA_BOT_PHONE_NUMBER="bot-whatsapp-number"
TAG_ALL_COMMAND="your-tag-command"
ENDPOINT_SECRET="your-secret-key"
```

4. Start the bot:

```bash
npm start
```

For development with auto-reload:

```bash
npm run dev
```

5. When first starting the bot, scan the QR code available at:

```
http://localhost:3000/qr/your-endpoint-secret
```

## Usage

- To tag all members in a group: Send `@bot-number tag-all-command` in the group chat
- Only the authorized number (WA_PHONE_NUMBER) can use the tag all command
- The bot automatically marks messages as read

## Environment Variables

- `PORT`: Server port (default: 3000)
- `WA_USERNAME`: Your name (for logging)
- `WA_PHONE_NUMBER`: Your WhatsApp number in format "number@c.us"
- `WA_BOT_PHONE_NUMBER`: Bot's WhatsApp number
- `TAG_ALL_COMMAND`: Command to trigger tagging all members
- `ENDPOINT_SECRET`: Secret key for accessing QR code endpoint

## Contributions

Contributions are encouraged! If you have any ideas, suggestions, or find any issues, please feel free to open an issue or submit a pull request (PR). Your contributions are greatly appreciated!
