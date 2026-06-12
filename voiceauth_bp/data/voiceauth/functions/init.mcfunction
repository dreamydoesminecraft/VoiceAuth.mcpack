# VoiceAuth initialization function
# Runs on pack load and prepares this behavior pack.

# Ensure the verification scoreboard objective exists
scoreboard objectives add voiceauth_verified dummy

# Optional debug message on initialization
tellraw @a {"rawtext":[{"text":"§7[VoiceAuth] Behavior pack initialized."}]}
