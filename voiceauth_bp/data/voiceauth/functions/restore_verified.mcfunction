## Restore verified players — NOOP for tags-only persistence
# Player tags persist across server restarts. This function is retained for
# compatibility but does not alter player tags when using tags-only persistence.
# If you prefer scoreboard-backed persistence, replace this file with logic to
# tag players based on the `voiceauth_verified` scoreboard.

# Intentionally left blank (tags persist by default).
