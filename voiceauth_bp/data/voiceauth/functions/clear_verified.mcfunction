## Remove verified status from the executing player
# Usage (server console or RCON):
# execute as <playerName> run function voiceauth:clear_verified

# Clear tag and scoreboard
tag @s remove voiceauth_verified
scoreboard players set @s voiceauth_verified 0

# Notify player
tellraw @s {"rawtext":[{"text":"§cVoiceAuth: Your verification has been CLEARED."}]}
