#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "$0")" && pwd)"
BP_DIR="$ROOT_DIR/voiceauth_bp"
RP_DIR="$ROOT_DIR/voiceauth_rp"
BP_OUTPUT="$ROOT_DIR/VoiceAuth_BP.mcpack"
RP_OUTPUT="$ROOT_DIR/VoiceAuth_RP.mcpack"

if [[ ! -d "$BP_DIR" ]]; then
  echo "Behavior Pack directory not found: $BP_DIR"
  exit 1
fi

if [[ ! -d "$RP_DIR" ]]; then
  echo "Resource Pack directory not found: $RP_DIR"
  exit 1
fi

cd "$ROOT_DIR"

rm -f "$BP_OUTPUT" "$RP_OUTPUT"

zip -r "$BP_OUTPUT" "$(basename "$BP_DIR")" > /dev/null
zip -r "$RP_OUTPUT" "$(basename "$RP_DIR")" > /dev/null

printf "Generated packs:\n  %s\n  %s\n" "$BP_OUTPUT" "$RP_OUTPUT"
