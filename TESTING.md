VoiceAuth — Testing & Smoke Checks

Quick manual verification steps to validate the pack before deploying.

1) JSON and function validation

  # Install jq if needed
  jq --version

  # Basic JSON linting for manifests and tags
  jq . voiceauth_bp/manifest.json >/dev/null
  jq . voiceauth_rp/manifest.json >/dev/null

2) Run webhook stub (local test)

  cd discord_bridge
  npm install
  npm start

  # POST a test payload
  curl -X POST http://localhost:3000/verify -H 'Content-Type: application/json' \
    -d '{"uuid":"00000000-0000-0000-0000-000000000000","verified":true}'

3) In-game smoke checks

- Load the BP/RP into a test world with Experimental Gameplay + Script Engine enabled.
- Spawn a test player and verify the following:
  - On spawn, the player receives a verify request (check server logs).
  - Use RCON/console to run `execute as <player> run function voiceauth:set_verified` and confirm UI/messages.
  - Confirm `voiceauth_is_unlocked` is updated in the player's dynamic properties (if supported).

4) Verify persistence

- After marking a player verified, restart the world/server and confirm the player's `voiceauth_verified` tag remains.

5) Automated linting (optional)

- Add `eslint` or other linters to your environment to validate JS code under `voiceauth_bp/scripts/`.
