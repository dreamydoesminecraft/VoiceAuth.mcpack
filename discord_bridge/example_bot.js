// Minimal Discord bot example (ESM)
// Usage: set DISCORD_TOKEN and optionally VOICEAUTH_WEBHOOK

import { Client, Intents } from 'discord.js';
import axios from 'axios';

const BOT_TOKEN = process.env.DISCORD_TOKEN;
const WEBHOOK_URL = process.env.VOICEAUTH_WEBHOOK || 'http://localhost:3000/verify';

const client = new Client({ intents: [Intents.FLAGS.GUILDS, Intents.FLAGS.GUILD_MESSAGES] });

client.on('ready', () => {
  console.log('Discord bot ready');
});

client.on('messageCreate', async (msg) => {
  if (!msg.content.startsWith('!verify')) return;
  if (!msg.member.permissions.has('ADMINISTRATOR')) return;

  const parts = msg.content.split(/\s+/);
  const uuid = parts[1];
  const allow = parts[2] !== '0';

  if (!uuid) {
    msg.reply('Usage: !verify <minecraft-uuid> [1|0]');
    return;
  }

  try {
    await axios.post(WEBHOOK_URL, { uuid, verified: !!allow });
    msg.reply(`Sent verification for ${uuid}: ${allow}`);
  } catch (e) {
    console.error(e);
    msg.reply('Failed to contact VoiceAuth webhook.');
  }
});

client.login(BOT_TOKEN);
