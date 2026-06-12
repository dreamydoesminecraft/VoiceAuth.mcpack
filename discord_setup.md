# VoiceAuth Discord Integration Setup

## Step 1: Install Dependencies
```bash
cd discord_bridge
npm install
```

## Step 2: Set Discord Token
```bash
export DISCORD_TOKEN="your_discord_bot_token_here"
```

## Step 3: Run Both Services

### Option A: Run separately in two terminals
```bash
# Terminal 1: Webhook
node webhook_stub.js

# Terminal 2: Discord Bot
DISCORD_TOKEN="your_token" node example_bot.js
```

### Option B: Run together
```bash
npm run dev
```

## Step 4: Test Verification in Discord
```
!verify <minecraft-uuid> 1
```

Example:
```
!verify 12345678-1234-5678-1234-567812345678 1
```

## How it Works

1. **Webhook listens** on `http://localhost:3000/verify`
   - Discord bot POSTs verification decisions here
   - Webhook queues them for the game to fetch

2. **Behavior Pack checks** webhook every 5 seconds
   - If verification pending, fetches from `/verify-pending/<uuid>`
   - Applies verification state to player

3. **Icons display** based on player VC state
   - `voiceauth_unmuted.png` (player only sees)
   - `voiceauth_muted.png` (player only sees)
   - `voiceauth_speaking.png` (other players see)
   - `voiceauth_silent.png` (other players see)

## Error Handling

If the webhook is offline:
- The behavior pack gracefully continues
- Players remain in local verification state
- No game crash
- Retry every 5 seconds

If Discord bot loses connection:
- Webhook still accepts verifications
- Game can still process them
- Bot auto-reconnects
