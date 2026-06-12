## Apply verification to the executing player (selector-based via execute as)
# Usage (server console or RCON):
# execute as <playerName> run function voiceauth:apply_verify

# Tag the player persistently
tag @s add voiceauth_verified

# (Optional) Keep scoreboard parity for hosts using it
scoreboard objectives add voiceauth_verified dummy
scoreboard players set @s voiceauth_verified 1

tellraw @s {"rawtext":[{"text":"§aVoiceAuth: Verified (applied)."}]}
