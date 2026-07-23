#!/usr/bin/env bash
set -euo pipefail

fail() {
  echo "error: $*" >&2
  exit 1
}

usage() {
  cat <<'USAGE'
Usage: verify-macos-bundle.sh --app <path> --version <x.y.z> --arch <arm64|x64|universal> [--signed] [--notarized] [--team-id <id>]

Checks a packaged LyricSheet app's identity, version, architecture, and payload.
Signed builds can also be checked for Developer ID, hardened runtime, and a
stapled notarization ticket.
USAGE
}

app_path=""
version=""
arch=""
signed=false
notarized=false
team_id=""

while [ "$#" -gt 0 ]; do
  case "$1" in
    --app)
      app_path="${2:-}"
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
    --signed)
      signed=true
      shift
      ;;
    --notarized)
      signed=true
      notarized=true
      shift
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

[ -n "$app_path" ] || fail "--app is required"
[ -n "$version" ] || fail "--version is required"

case "$arch" in
  arm64|x64|universal) ;;
  *) fail "--arch must be arm64, x64, or universal" ;;
esac

info_plist="$app_path/Contents/Info.plist"
executable="$app_path/Contents/MacOS/LyricSheet"
app_asar="$app_path/Contents/Resources/app.asar"

[ -d "$app_path" ] || fail "app not found at $app_path"
[ -f "$info_plist" ] || fail "app is missing Contents/Info.plist"
[ -x "$executable" ] || fail "app is missing its LyricSheet executable"
[ -f "$app_asar" ] || fail "app is missing Contents/Resources/app.asar"

plist_value() {
  /usr/libexec/PlistBuddy -c "Print :$2" "$1"
}

actual_version="$(plist_value "$info_plist" CFBundleShortVersionString)"
actual_bundle_id="$(plist_value "$info_plist" CFBundleIdentifier)"
actual_executable="$(plist_value "$info_plist" CFBundleExecutable)"

[ "$actual_version" = "$version" ] ||
  fail "app version is $actual_version, expected $version"
[ "$actual_bundle_id" = "com.lyricsheet.app" ] ||
  fail "app bundle id is $actual_bundle_id"
[ "$actual_executable" = "LyricSheet" ] ||
  fail "app executable is $actual_executable"

binary_arches="$(lipo -archs "$executable")"
case "$arch" in
  arm64)
    [ "$binary_arches" = arm64 ] || fail "app architecture is $binary_arches, expected arm64"
    ;;
  x64)
    [ "$binary_arches" = x86_64 ] || fail "app architecture is $binary_arches, expected x86_64"
    ;;
  universal)
    [[ " $binary_arches " == *" arm64 "* && " $binary_arches " == *" x86_64 "* ]] ||
      fail "universal app architectures are $binary_arches"
    ;;
esac

if [ "$signed" = true ]; then
  details="$(mktemp "${TMPDIR:-/tmp}/lyricsheet-codesign.XXXXXX")"
  trap 'rm -f "$details"' EXIT
  codesign -dv --verbose=4 "$app_path" > "$details" 2>&1
  grep -q '^Authority=Developer ID Application:' "$details" ||
    fail "app is not signed with a Developer ID Application certificate"
  grep -Eq '^(Runtime Version=|.*flags=.*runtime)' "$details" ||
    fail "app does not have hardened runtime enabled"
  grep -q '^TeamIdentifier=' "$details" || fail "app has no signing team identifier"
  if [ -n "$team_id" ]; then
    grep -Fq "TeamIdentifier=$team_id" "$details" ||
      fail "app is not signed by team $team_id"
  fi
  codesign --verify --deep --strict --verbose=2 "$app_path"
fi

if [ "$notarized" = true ]; then
  spctl -a -vv --type execute "$app_path"
  xcrun stapler validate "$app_path"
fi

echo "Verified LyricSheet $version ($arch) at $app_path"
