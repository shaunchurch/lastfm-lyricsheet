#!/usr/bin/env bash
set -euo pipefail

fail() {
  echo "error: $*" >&2
  exit 1
}

usage() {
  cat <<'USAGE'
Usage: verify-macos-dmg.sh --dmg <path> --version <x.y.z> --arch <arm64|x64|universal> --team-id <id>

Checks the disk image's integrity, Developer ID signature, Gatekeeper
acceptance, stapled notarization ticket, layout, and contained app.
USAGE
}

dmg_path=""
version=""
arch=""
team_id=""

while [ "$#" -gt 0 ]; do
  case "$1" in
    --dmg)
      dmg_path="${2:-}"
      shift 2
      ;;
    --version)
      version="${2:-}"
      shift 2
      ;;
    --arch)
      arch="${2:-}"
      shift 2
      ;;
    --team-id)
      team_id="${2:-}"
      shift 2
      ;;
    --help|-h)
      usage
      exit 0
      ;;
    *)
      fail "unknown argument: $1"
      ;;
  esac
done

[ -f "$dmg_path" ] || fail "DMG not found at $dmg_path"
[ -n "$version" ] || fail "--version is required"
case "$arch" in
  arm64|x64|universal) ;;
  *) fail "--arch must be arm64, x64, or universal" ;;
esac
[[ "$team_id" =~ ^[A-Z0-9]{10}$ ]] ||
  fail "--team-id must be a 10-character Apple team ID"

base_temp="${RUNNER_TEMP:-${TMPDIR:-/tmp}}"
base_temp="${base_temp%/}"
workdir="$(mktemp -d "$base_temp/lyricsheet-dmg-verify.XXXXXX")"
mountpoint="$workdir/mounted"
details="$workdir/codesign-details.txt"
mounted=false

cleanup() {
  if [ "$mounted" = true ]; then
    if ! hdiutil detach "$mountpoint" -quiet 2>/dev/null; then
      echo "could not detach verification mount: $mountpoint" >&2
      return 1
    fi
    mounted=false
  fi
  case "$workdir" in
    "$base_temp"/lyricsheet-dmg-verify.*)
      find -x "$workdir" -depth -delete
      ;;
    *)
      echo "refusing unexpected verification cleanup path: $workdir" >&2
      return 1
      ;;
  esac
}
trap cleanup EXIT

hdiutil verify "$dmg_path" >/dev/null
codesign -dv --verbose=4 "$dmg_path" > "$details" 2>&1
grep -q '^Authority=Developer ID Application:' "$details" ||
  fail "DMG is not signed with a Developer ID Application certificate"
grep -Fq "TeamIdentifier=$team_id" "$details" ||
  fail "DMG is not signed by team $team_id"
codesign --verify --strict --verbose=2 "$dmg_path"
spctl -a -t open -vvv --context context:primary-signature "$dmg_path"
xcrun stapler validate "$dmg_path"

mkdir "$mountpoint"
hdiutil attach "$dmg_path" \
  -nobrowse \
  -readonly \
  -mountpoint "$mountpoint" \
  -quiet
mounted=true

[ -L "$mountpoint/Applications" ] ||
  fail "DMG is missing its Applications link"
[ "$(readlink "$mountpoint/Applications")" = /Applications ] ||
  fail "DMG Applications link has an unexpected target"

app_path="$mountpoint/LyricSheet.app"
"$(dirname "$0")/verify-macos-bundle.sh" \
  --app "$app_path" \
  --version "$version" \
  --arch "$arch" \
  --notarized \
  --team-id "$team_id"

hdiutil detach "$mountpoint" -quiet
mounted=false

echo "Verified signed and notarized LyricSheet DMG at $dmg_path"
