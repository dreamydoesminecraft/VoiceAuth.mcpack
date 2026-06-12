// Simple webhook stub to accept verify_response POSTs
// Run with: node webhook_stub.js

import express from 'express';
const app = express();
app.use(express.json());

app.post('/verify', (req, res) => {
  const { uuid, verified } = req.body;
  console.log('Received verify:', uuid, verified);
  // TODO: Bridge this to the game server (RCON, console, or plugin)
  res.sendStatus(200);
});

app.listen(3000, () => console.log('VoiceAuth webhook listening on :3000'));
