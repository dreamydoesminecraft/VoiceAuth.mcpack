RCON / Console examples — VoiceAuth

Use these examples from a host that exposes RCON or a server console API.

Generic (execute as player):

  execute as <playerName> run function voiceauth:set_verified

  execute as <playerName> run function voiceauth:clear_verified

Direct scoreboard (if you prefer scoreboard-backed persistence):

  scoreboard objectives add voiceauth_verified dummy
  scoreboard players set <playerName> voiceauth_verified 1

Examples for common hosts

- Remote console (mcrcon / rcon-cli):

  mcrcon -H <host> -P <port> -p <password> "execute as Player123 run function voiceauth:set_verified"

- Pterodactyl / Panel (send command):

  execute as Player123 run function voiceauth:set_verified

- Dedicated host with RCON JSON API (curl):

  curl -X POST "http://<rcon-proxy>/command" -d '{"command":"execute as Player123 run function voiceauth:set_verified"}'

Notes

- Replace `<playerName>` with the player's username. If you only have UUIDs, convert them server-side or use a host plugin that accepts UUIDs.
- Not all hosts expose raw console access; check your provider's control panel or API.
