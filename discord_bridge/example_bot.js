// Discord bot for VoiceAuth verification (discord.js v14)
// Usage: set DISCORD_TOKEN and optionally VOICEAUTH_WEBHOOK

import { Client, GatewayIntentBits } from 'discord.js';
import axios from 'axios';

const BOT_TOKEN = process.env.DISCORD_TOKEN;
const WEBHOOK_URL = process.env.VOICEAUTH_WEBHOOK || 'http://localhost:3000/verify';

if (!BOT_TOKEN) {
  console.error('ERROR: DISCORD_TOKEN environment variable not set');
  process.exit(1);
}

const client = new Client({ intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages, GatewayIntentBits.MessageContent] });

client.on('ready', () => {
  console.log('Discord bot ready');
});

client.on('messageCreate', async (msg) => {
  try {
    if (msg.author.bot) return;
    if (!msg.content.startsWith('!verify')) return;
    if (!msg.member || !msg.member.permissions.has('ADMINISTRATOR')) {
      await msg.reply('Admin only!');
      return;
    }

    const parts = msg.content.split(/\s+/);
    const uuid = parts[1];
    const allow = parts[2] !== '0';

    if (!uuid) {
      await msg.reply('Usage: `!verify <minecraft-uuid> [1|0]`');
      return;
    }

    try {
      await axios.post(WEBHOOK_URL, { uuid, verified: !!allow });
      await msg.reply(`✓ Verification sent for **${uuid}**: **${allow ? 'APPROVED' : 'DENIED'}**`);
      console.log(`[Discord] Verified ${uuid}: ${allow}`);
    } catch (e) {
      console.error('[Discord] Webhook error:', e.message);
      await msg.reply('❌ Failed to contact VoiceAuth webhook. Is it running?');
    }
  } catch (err) {
    console.error('[Discord] Message handler error:', err);
  }
});

client.login(BOT_TOKEN);

client.on('error', (err) => {
  console.error('[Discord] Client error:', err);
});

process.on('unhandledRejection', (err) => {
  console.error('[Discord] Unhandled rejection:', err);
});
