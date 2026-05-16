VoiceAuth — Bedrock Verification‑Based Voice Control System

VoiceAuth is a Minecraft Bedrock Edition world add‑on that adds a human‑verification system for voice‑related controls.
It does not add real audio — instead, it provides the control layer for mic toggle, mute, and push‑to‑talk, locked behind verification.

This repository contains both the Behavior Pack and Resource Pack required for VoiceAuth to function.

---

🎤 Features

• Verification‑locked voice controls
• Mic toggle
• Mute toggle
• Push‑to‑talk
• VC lock/unlock system
• Anti‑bot & anti‑troll protection
• Lightweight Resource Pack
• Script API‑powered Behavior Pack
• Works in any world (Singleplayer, LAN, Realms, SMP)


---

📦 Included Packs

Behavior Pack (BP)

Handles all logic:

• Verification system
• Packet bridge
• VC lock/unlock
• Mic/mute/PTT logic
• Animation controller


Resource Pack (RP)

Handles visuals:

• UI icons (mic on/off, mute, PTT)
• VC state query
• RP manifest


Both packs are required.

---

📁 Folder Structure

VoiceAuth/
│
├── voiceauth_bp/
│   ├── manifest.json
│   ├── scripts/
│   │   ├── server/
│   │   │   ├── verify_handler.js
│   │   │   └── packet_bridge.js
│   │   └── client/
│   │       └── vc_controls.js
│   ├── functions/
│   │   └── init.mcfunction
│   └── animation_controllers/
│       └── vc_state_controller.json
│
└── voiceauth_rp/
    ├── manifest.json
    ├── animations/
    │   └── vc_state_query.json
    └── textures/
        └── ui/
            ├── mic_on.png
            ├── mic_off.png
            ├── mute.png
            └── ptt.png


---

🔐 Verification Flow

1. Player joins the world
2. VoiceAuth marks them as unverified
3. A verify_request packet is sent
4. External system (Discord bot, Java plugin, etc.) responds
5. VoiceAuth unlocks or locks VC controls


Unverified players cannot use any VC controls.

Learn more:
Verification System

---

🎮 Usage

Test Commands

• !mic — toggle microphone
• !mute — toggle mute
• !talk — push‑to‑talk (2 seconds)


UI Icons

Located in voiceauth_rp/textures/ui/:

• mic_on.png
• mic_off.png
• mute.png
• ptt.png


Need help designing icons?
Custom UI Icons

---

🛠 Installation

For Players

1. Download the .mcaddon
2. Tap to import into Minecraft
3. Enable both packs in your world
4. Enable required experimental toggles:• Beta APIs
• Script Engine

5. Join the world and verify


For Developers

Place folders into:

com.mojang/
  behavior_packs/
  resource_packs/


---

⚙ Requirements

• Minecraft Bedrock 1.21+
• Script API enabled
• Experimental toggles ON
• Optional: external verification system


---

👤 Credits

Developer: Dreamy Does Minecraft
Project: VoiceAuth
Platform: Minecraft Bedrock Edition
Purpose: Safe, verified voice control system for world owners

---

🚀 Exporting as `.mcaddon`

A full export guide is here:
.mcaddon Export Guide

---