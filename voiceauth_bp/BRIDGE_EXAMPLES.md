Bridge examples — VoiceAuth Behavior Pack

Use these commands from server console or via RCON to apply verification for players.

Mark a player verified (adds tag + scoreboard):

  execute as <playerName> run function voiceauth:set_verified

Clear verification for a player:

  execute as <playerName> run function voiceauth:clear_verified

Notes:
- These functions live at `voiceauth_bp/data/voiceauth/functions/` and operate on `@s`, so wrap them with `execute as <playerName>` when calling from console.
- If your bridge only has UUIDs, convert UUID → username on your side or use a host-side plugin that accepts UUIDs.
- Alternatively, you can set the scoreboard directly:

  scoreboard objectives add voiceauth_verified dummy
  scoreboard players set <playerName> voiceauth_verified 1


