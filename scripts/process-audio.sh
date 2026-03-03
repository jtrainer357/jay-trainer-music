#!/usr/bin/env bash
# process-audio.sh — Generate MP3 preview clips and full versions from WAV sources
# Requires: ffmpeg
# Usage: bash scripts/process-audio.sh

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"
MUSIC_DIR="$PROJECT_DIR/Music"
PREVIEW_DIR="$PROJECT_DIR/src/assets/audio/previews"
FULL_DIR="$PROJECT_DIR/src/assets/audio/full"

PREVIEW_DURATION=60    # seconds
PREVIEW_BITRATE="128k"
FULL_BITRATE="320k"

# Check ffmpeg
if ! command -v ffmpeg &>/dev/null; then
  echo "ERROR: ffmpeg is required but not found in PATH"
  exit 1
fi

# Slugify a string: lowercase, replace spaces/special chars with hyphens, collapse multiples
slugify() {
  echo "$1" | tr '[:upper:]' '[:lower:]' | sed 's/[^a-z0-9]/-/g' | sed 's/--*/-/g' | sed 's/^-//;s/-$//'
}

# Convert a WAV to MP3 preview + full
# Args: $1=wav_path $2=release_slug $3=track_number $4=track_slug
convert_track() {
  local wav="$1"
  local release_slug="$2"
  local track_num="$3"
  local track_slug="$4"

  local padded_num
  padded_num=$(printf "%02d" "$track_num")
  local filename="${padded_num}-${track_slug}.mp3"

  local preview_out="$PREVIEW_DIR/$release_slug/$filename"
  local full_out="$FULL_DIR/$release_slug/$filename"

  mkdir -p "$PREVIEW_DIR/$release_slug"
  mkdir -p "$FULL_DIR/$release_slug"

  # Preview clip (60 seconds, 128kbps)
  if [ -f "$preview_out" ]; then
    echo "  SKIP preview: $filename (exists)"
  else
    echo "  Creating preview: $filename"
    ffmpeg -y -i "$wav" -t "$PREVIEW_DURATION" -b:a "$PREVIEW_BITRATE" -ar 44100 -ac 2 \
      -af "afade=t=out:st=$((PREVIEW_DURATION - 3)):d=3" \
      "$preview_out" -loglevel warning
  fi

  # Full version (320kbps)
  if [ -f "$full_out" ]; then
    echo "  SKIP full: $filename (exists)"
  else
    echo "  Creating full: $filename"
    ffmpeg -y -i "$wav" -b:a "$FULL_BITRATE" -ar 44100 -ac 2 \
      "$full_out" -loglevel warning
  fi
}

echo "=== Audio Processing Script ==="
echo "Source: $MUSIC_DIR"
echo ""

# ─── A Whisper Of Ruin — Deluxe Edition (15 tracks) ───
DELUXE_DIR="$MUSIC_DIR/Jay Trainer Band - A Whisper Of Ruin (Deluxe Edition)"
DELUXE_SLUG="a-whisper-of-ruin-deluxe"

if [ -d "$DELUXE_DIR" ]; then
  echo "Processing: A Whisper Of Ruin — Deluxe Edition"

  # Track order matches releases.json, mapped to WAV file numbers
  convert_track "$DELUXE_DIR/A Whisper Of Ruin (Deluxe Edition) - Jay Trainer Band - 01 The Southern Winds.wav"        "$DELUXE_SLUG" 1  "the-southern-winds"
  convert_track "$DELUXE_DIR/A Whisper Of Ruin (Deluxe Edition) - Jay Trainer Band - 12 Voodoo Child (Live).wav"        "$DELUXE_SLUG" 2  "voodoo-chile-live"
  convert_track "$DELUXE_DIR/A Whisper Of Ruin (Deluxe Edition) - Jay Trainer Band - 04 While The World Burns Down.wav" "$DELUXE_SLUG" 3  "while-the-world-burns-down"
  convert_track "$DELUXE_DIR/A Whisper Of Ruin (Deluxe Edition) - Jay Trainer Band - 03 Lovely In Black.wav"            "$DELUXE_SLUG" 4  "lovely-in-black"
  convert_track "$DELUXE_DIR/A Whisper Of Ruin (Deluxe Edition) - Jay Trainer Band - 02 Alibi.wav"                      "$DELUXE_SLUG" 5  "alibi"
  convert_track "$DELUXE_DIR/A Whisper Of Ruin (Deluxe Edition) - Jay Trainer Band - 08 By Cover Of A Great Lie.wav"    "$DELUXE_SLUG" 6  "by-cover-of-a-great-lie"
  convert_track "$DELUXE_DIR/A Whisper Of Ruin (Deluxe Edition) - Jay Trainer Band - 05 Wide Open Eyes.wav"             "$DELUXE_SLUG" 7  "wide-open-eyes"
  convert_track "$DELUXE_DIR/A Whisper Of Ruin (Deluxe Edition) - Jay Trainer Band - 06 Blackout Asylum (Part 1).wav"   "$DELUXE_SLUG" 8  "blackout-asylum-part-1"
  convert_track "$DELUXE_DIR/A Whisper Of Ruin (Deluxe Edition) - Jay Trainer Band - 07 Last December Dance.wav"        "$DELUXE_SLUG" 9  "last-december-dance"
  convert_track "$DELUXE_DIR/A Whisper Of Ruin (Deluxe Edition) - Jay Trainer Band - 09 Better To Breathe.wav"          "$DELUXE_SLUG" 10 "better-to-breathe"
  convert_track "$DELUXE_DIR/A Whisper Of Ruin (Deluxe Edition) - Jay Trainer Band - 10 Everything We Never Said.wav"   "$DELUXE_SLUG" 11 "everything-we-never-said"
  convert_track "$DELUXE_DIR/A Whisper Of Ruin (Deluxe Edition) - Jay Trainer Band - 11 Fractured (Acoustic).wav"       "$DELUXE_SLUG" 12 "fractured-acoustic"
  convert_track "$DELUXE_DIR/A Whisper Of Ruin (Deluxe Edition) - Jay Trainer Band - 13 Better To Breathe (Acoustic).wav" "$DELUXE_SLUG" 13 "better-to-breathe-acoustic"
  convert_track "$DELUXE_DIR/A Whisper Of Ruin (Deluxe Edition) - Jay Trainer Band - 14 Of The Sun (Live).wav"          "$DELUXE_SLUG" 14 "of-the-sun-live"
  convert_track "$DELUXE_DIR/A Whisper Of Ruin (Deluxe Edition) - Jay Trainer Band - 15 Her Mind.wav"                   "$DELUXE_SLUG" 15 "her-mind"

  echo ""
fi

# ─── Blackout Asylum — Remastered (5 tracks) ───
BLACKOUT_DIR="$MUSIC_DIR/Jay Trainer - Blackout Asylum (Remastered)"
BLACKOUT_SLUG="blackout-asylum"

if [ -d "$BLACKOUT_DIR" ]; then
  echo "Processing: Blackout Asylum (Remastered)"

  convert_track "$BLACKOUT_DIR/Jay Trainer - Blackout Asylum (Remastered) - 01 The Clearing.wav"              "$BLACKOUT_SLUG" 1 "the-clearing"
  convert_track "$BLACKOUT_DIR/Jay Trainer - Blackout Asylum (Remastered) - 02 Born Under A Bad Sign.wav"     "$BLACKOUT_SLUG" 2 "born-under-a-bad-sign"
  convert_track "$BLACKOUT_DIR/Jay Trainer - Blackout Asylum (Remastered) - 03 Begun Today.wav"               "$BLACKOUT_SLUG" 3 "begun-today"
  convert_track "$BLACKOUT_DIR/Jay Trainer - Blackout Asylum (Remastered) - 04 Same As A Poor Man.wav"        "$BLACKOUT_SLUG" 4 "same-as-a-poor-man"
  convert_track "$BLACKOUT_DIR/Jay Trainer - Blackout Asylum (Remastered) - 05 Of What Is Soon To Come.wav"   "$BLACKOUT_SLUG" 5 "of-what-is-soon-to-come"

  echo ""
fi

# ─── Den Of Thieves (6 tracks) ───
DOT_DIR="$MUSIC_DIR/Jay Trainer - Den Of Thieves"
DOT_SLUG="den-of-thieves"

if [ -d "$DOT_DIR" ]; then
  echo "Processing: Den Of Thieves"

  convert_track "$DOT_DIR/Jay Trainer - Den Of Thieves - 01 My Wide Open Eyes.wav"              "$DOT_SLUG" 1 "my-wide-open-eyes"
  convert_track "$DOT_DIR/Jay Trainer - Den Of Thieves - 02 Run Baby Run.wav"                   "$DOT_SLUG" 2 "run-baby-run"
  convert_track "$DOT_DIR/Jay Trainer - Den Of Thieves - 03 Ever More.wav"                      "$DOT_SLUG" 3 "ever-more"
  convert_track "$DOT_DIR/Jay Trainer - Den Of Thieves - 04 Imagine.wav"                        "$DOT_SLUG" 4 "imagine"
  convert_track "$DOT_DIR/Jay Trainer - Den Of Thieves - 05 Better To Breathe (Acoustic).wav"   "$DOT_SLUG" 5 "better-to-breathe-acoustic"
  convert_track "$DOT_DIR/Jay Trainer - Den Of Thieves - 06 Tiny Chinese (Live).wav"            "$DOT_SLUG" 6 "tiny-chinese-live"

  echo ""
fi

# ─── Of The Sun (10 tracks) ───
OTS_DIR="$MUSIC_DIR/Jay Trainer - Of The Sun"
OTS_SLUG="of-the-sun"

if [ -d "$OTS_DIR" ]; then
  echo "Processing: Of The Sun"

  convert_track "$OTS_DIR/Jay Trainer - Of The Sun - 01 Better To Breathe.wav"                  "$OTS_SLUG" 1  "better-to-breathe"
  convert_track "$OTS_DIR/Jay Trainer - Of The Sun - 02 Witness.wav"                            "$OTS_SLUG" 2  "witness"
  convert_track "$OTS_DIR/Jay Trainer - Of The Sun - 03 Ever More.wav"                          "$OTS_SLUG" 3  "ever-more"
  convert_track "$OTS_DIR/Jay Trainer - Of The Sun - 04 Tom Smith Program.wav"                  "$OTS_SLUG" 4  "tom-smith-program"
  convert_track "$OTS_DIR/Jay Trainer - Of The Sun - 05 Of The Sun.wav"                         "$OTS_SLUG" 5  "of-the-sun"
  convert_track "$OTS_DIR/Jay Trainer - Of The Sun - 06 By Cover of a Great Lie.wav"            "$OTS_SLUG" 6  "by-cover-of-a-great-lie"
  convert_track "$OTS_DIR/Jay Trainer - Of The Sun - 07 Soulful Rights, Soulful Days.wav"       "$OTS_SLUG" 7  "soulful-rights-soulful-days"
  convert_track "$OTS_DIR/Jay Trainer - Of The Sun - 08 It's Not My Cross to Bear.wav"          "$OTS_SLUG" 8  "its-not-my-cross-to-bear"
  convert_track "$OTS_DIR/Jay Trainer - Of The Sun - 09 Fractured.wav"                          "$OTS_SLUG" 9  "fractured"
  convert_track "$OTS_DIR/Jay Trainer - Of The Sun - 10 The Evening Wore On.wav"                "$OTS_SLUG" 10 "the-evening-wore-on"

  echo ""
fi

# ─── The Waking Hours (9 tracks) ───
TWH_DIR="$MUSIC_DIR/Jay Trainer - The Waking Hours"
TWH_SLUG="the-waking-hours"

if [ -d "$TWH_DIR" ]; then
  echo "Processing: The Waking Hours"

  convert_track "$TWH_DIR/Jay Trainer - The Waking Hours - 01 Maybe Off to Wonder.wav"          "$TWH_SLUG" 1 "maybe-off-to-wonder"
  convert_track "$TWH_DIR/Jay Trainer - The Waking Hours - 02 Tiny Chinese.wav"                 "$TWH_SLUG" 2 "tiny-chinese"
  convert_track "$TWH_DIR/Jay Trainer - The Waking Hours - 03 Tinseltown.wav"                   "$TWH_SLUG" 3 "tinseltown"
  convert_track "$TWH_DIR/Jay Trainer - The Waking Hours - 04 In The Waking Hours.wav"          "$TWH_SLUG" 4 "in-the-waking-hours"
  convert_track "$TWH_DIR/Jay Trainer - The Waking Hours - 05 A Knight, Death and the Devil.wav" "$TWH_SLUG" 5 "a-knight-death-and-the-devil"
  convert_track "$TWH_DIR/Jay Trainer - The Waking Hours - 06 Fractured (Live).wav"             "$TWH_SLUG" 6 "fractured-live"
  convert_track "$TWH_DIR/Jay Trainer - The Waking Hours - 07 August Brings (Live).wav"         "$TWH_SLUG" 7 "august-brings-live"
  convert_track "$TWH_DIR/Jay Trainer - The Waking Hours - 08 Tiny Chinese (Live).wav"          "$TWH_SLUG" 8 "tiny-chinese-live"
  convert_track "$TWH_DIR/Jay Trainer - The Waking Hours - 09 Voodoo Child (Live).wav"          "$TWH_SLUG" 9 "voodoo-child-live"

  echo ""
fi

# ─── Lifeline (single) ───
LIFELINE_WAV="$MUSIC_DIR/Jay Trainer - Lifeline.wav"
if [ -f "$LIFELINE_WAV" ]; then
  echo "Processing: Lifeline"
  convert_track "$LIFELINE_WAV" "lifeline" 1 "lifeline"
  echo ""
fi

# ─── Last Days Of Summer (single) ───
LAST_DAYS_WAV="$MUSIC_DIR/Jay Trainer Band - Last Days Of Summer.wav"
if [ -f "$LAST_DAYS_WAV" ]; then
  echo "Processing: Last Days Of Summer"
  convert_track "$LAST_DAYS_WAV" "last-days-of-summer" 1 "last-days-of-summer"
  echo ""
fi

# ─── The Southern Winds — East Coast Mix (single) ───
SOUTHERN_WAV="$MUSIC_DIR/Jay Trainer - The Southern Winds (East Coast Mix).wav"
if [ -f "$SOUTHERN_WAV" ]; then
  echo "Processing: The Southern Winds (East Coast Mix)"
  convert_track "$SOUTHERN_WAV" "the-southern-winds" 1 "the-southern-winds-east-coast-mix"
  echo ""
fi

echo "=== Done ==="
echo "Previews: $PREVIEW_DIR"
echo "Full MP3s: $FULL_DIR"
