# VoiceAuth

VoiceAuth is a Minecraft Bedrock Edition mod/add-on that provides voice chat controls with built-in authorization to stop bots and trolls. It does not add actual audio; it adds the control layer for microphone toggle, mute, and push-to-talk behind a verification gate.

VoiceAuth uses an external Discord verification flow to authorize players before they can use voice controls.

This repository contains the raw Behavior Pack and Resource Pack required to run VoiceAuth in a Bedrock world.

---

## Features

- Verification-locked voice controls
- Mic toggle
- Mute toggle
- Push-to-talk
- Voice control lock/unlock flow
- Anti-bot and anti-troll protection
- Lightweight Behavior Pack with Script API support
- Compatible with Singleplayer, LAN, Realms, and SMP

---

## Included Packs

### Behavior Pack (`voiceauth_bp/`)

Handles the implementation logic:

- player verification
- packet bridge
- voice control lock/unlock
- mic/mute/PTT state management
- script entry points and initialization

### Resource Pack (`voiceauth_rp/`)

Handles resource data for the voice state system:

- animation state query
- runtime resource metadata

Both packs are required for VoiceAuth to work correctly.

---

## Installation

### In Minecraft

1. Copy `voiceauth_bp/` into `com.mojang/behavior_packs/`
2. Copy `voiceauth_rp/` into `com.mojang/resource_packs/`
3. Open your world settings
4. Enable both packs in the world
5. Turn on Experimental Gameplay and Script Engine
6. Launch the world

### Note

This repository contains the raw pack folders. If you want a `.mcaddon` file, package the folders yourself or use a Bedrock add-on exporter.

---

## Requirements

- Minecraft Bedrock Edition 1.21 or newer
- Script Engine enabled
- Experimental gameplay toggles enabled
- External Discord verification bridge or compatible auth connector

---

## Usage

VoiceAuth gates voice control features until a player is verified by an external system, typically a Discord bot or connector.

Common control commands:

- `!mic` — toggle microphone
- `!mute` — toggle mute
- `!talk` — push-to-talk

Unverified players are prevented from using VC controls until verification completes.

---

## Folder Structure

- `voiceauth_bp/`
  - `manifest.json`
  - `scripts/`
    - `server/`
      - `verify_handler.js`
      - `packet_bridge.js`
    - `client/`
      - `vc_controls.js`
  - `functions/`
    - `init.mcfunction`

- `voiceauth_rp/`
  - `manifest.json`
  - `animation_controllers/`
    - `vc_state_controllers.json`
  - `animations/`
    - `vc_state_query.json`

---

## Verification Flow

1. Player enters the world
2. VoiceAuth marks them as unverified
3. A verification request is emitted to an external system
4. A Discord bot or auth bridge confirms the player
5. Voice controls are unlocked or remain locked

---

## Discord integration

VoiceAuth expects an external verification system (e.g., a Discord bot) to confirm players.

Payload (POST JSON):

{
  "uuid": "<player-uuid>",
  "verified": true
}

Delivery options:
- Run a local webhook on the server and have your Discord bot POST to it (see `discord_bridge/`).
- If you have console/RCON access, call the included mcfunctions:

  execute as <playerName> run function voiceauth:set_verified

  execute as <playerName> run function voiceauth:clear_verified

See `VOICEAUTH_DISCORD_BRIDGE.md` for more details and examples.


## Credits

- Developer: Princess Kenny Does Minecraft
- Project: VoiceAuth
- Platform: Minecraft Bedrock Edition

---

## License & Support

See the repository root for license, contribution, and support guidelines.

---