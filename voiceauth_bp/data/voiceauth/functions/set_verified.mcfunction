## Mark the executing player as verified
# Usage (server console or RCON):
# execute as <playerName> run function voiceauth:set_verified

# Ensure scoreboard objective exists
scoreboard objectives add voiceauth_verified dummy

# Tag the player and set persistent scoreboard value
tag @s add voiceauth_verified
scoreboard players set @s voiceauth_verified 1

# Notify player
tellraw @s {"rawtext":[{"text":"§aVoiceAuth: You have been VERIFIED."}]}
