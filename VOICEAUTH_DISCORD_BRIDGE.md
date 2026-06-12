Discord Verification Bridge — VoiceAuth

Overview

VoiceAuth emits verification requests inside the Behavior Pack via the `PacketEvent` channel `voiceauth:verify_request`.
An external system (Discord bot) must respond with a verification payload and deliver it to the Behavior Pack as a `voiceauth:verify_response` packet.

Expected payload (JSON):

{
  "uuid": "<player-uuid>",
  "verified": true
}

Integration approaches

1) Preferred: Server-side bridge plugin
- Run a small bridge on the game host (Java/Bedrock server) that can call the Behavior Pack event bus.
- Example: a dedicated plugin can inject `voiceauth:verify_response` into the BP by calling a script API or by sending a message the BP bridge accepts.

2) RCON/console commands
- If your host exposes an RCON or console API, the Discord bot can issue in-game commands to set a scoreboard or run a function that the BP respects.
- Example command sequence the bridge might run:
  - `scoreboard players set <playerName> voiceauth_unlocked 1`
  - `tellraw <playerName> {"rawtext":[{"text":"Verified via Discord."}]}`

3) HTTP webhook + local bridge
- Run a small HTTP endpoint on the game host (Node.js script included below) that accepts the verify payload from your Discord bot and then translates it to an in-game action (RCON, server API or other).

Sample Discord bot (Node.js)

This example forwards verification decisions to a local webhook at `http://localhost:3000/verify`.
You can adapt the webhook to call your server console/RCON or another bridge.

File: `discord_bridge/example_bot.js`

```js
// Minimal example using discord.js v14 and axios
import { Client, Intents } from 'discord.js';
import axios from 'axios';

const BOT_TOKEN = process.env.DISCORD_TOKEN;
const WEBHOOK_URL = process.env.VOICEAUTH_WEBHOOK || 'http://localhost:3000/verify';

const client = new Client({ intents: [Intents.FLAGS.GUILDS, Intents.FLAGS.GUILD_MESSAGES] });

client.on('ready', () => {
  console.log('Discord bot ready');
});

// Example command: !verify <minecraftUUID> (admin-only)
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
```

Local webhook stub (Node.js)

This simple Express server receives the payload and logs it. Replace the `console.log` with RCON/console calls to the game host.

File: `discord_bridge/webhook_stub.js`

```js
import express from 'express';
const app = express();
app.use(express.json());

app.post('/verify', (req, res) => {
  const { uuid, verified } = req.body;
  console.log('Received verify:', uuid, verified);
  // TODO: bridge this to the game server (RCON, server API, or other)
  res.sendStatus(200);
});

app.listen(3000, () => console.log('VoiceAuth webhook listening on :3000'));
```

Delivering payload to Behavior Pack

- The Behavior Pack must receive the `{ uuid, verified }` object and call `PacketEvent._emit('voiceauth:verify_response', data)` inside the server environment.
- How you deliver that depends on your host. Common options:
  - A dedicated server plugin that can call into the Bedrock addon script API.
  - An RCON/console script that sets a scoreboard value or tag the BP monitors.
  - A local bridge that has access to both HTTP and the server console.

Bridge: console examples

If your Discord bridge can run server console commands (RCON or direct console), you can call the small mcfunctions included in the BP to apply verification for a player.

- To mark a player verified (adds tag + scoreboard):

  execute as <playerName> run function voiceauth:set_verified

- To clear verification for a player:

  execute as <playerName> run function voiceauth:clear_verified

Notes:
- These functions are included in `voiceauth_bp/data/voiceauth/functions/` and set/remove the `voiceauth_verified` tag and the `voiceauth_verified` scoreboard value. Use the `execute as` wrapper so the function runs with the target player as `@s`.
- If your bridge has access to player UUIDs instead of names, convert UUID → username on your side before issuing the `execute as` command, or use a host-side plugin that accepts UUIDs.

Next steps

- If you want, I can:
  - add a minimal `webhook_stub.js` to this repo and document how to run it
  - implement a concrete RCON example for a specific Bedrock host (tell me which host you use)
  - add an optional `apply_verify.mcfunction` helper that accepts a selector if you'd prefer a single command

Choose one and I’ll add it.
