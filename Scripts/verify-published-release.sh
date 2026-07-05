#!/usr/bin/env bash
set -euo pipefail

fail() {
  echo "error: $*" >&2
  exit 1
}

usage() {
  cat <<'USAGE'
Usage: verify-published-release.sh --version <x.y.z> --release-repo <owner/repo> --tag <vX.Y.Z> [--arch arm64|x64|universal]

Downloads the public GitHub release zip and verifies that Gatekeeper can accept
the shipped macOS app.
USAGE
}

version=""
release_repo=""
tag=""
arch="arm64"

while [ "$#" -gt 0 ]; do
  case "$1" in
    --version)
      version="${2:-}"
      shift 2
      ;;
    --release-repo)
      release_repo="${2:-}"
      shift 2
      ;;
    --tag)
      tag="${2:-}"
      shift 2
      ;;
    --arch)
      arch="${2:-}"
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

[ -n "$version" ] || fail "--version is required"
[ -n "$release_repo" ] || fail "--release-repo is required"
[ -n "$tag" ] || fail "--tag is required"

case "$arch" in
  arm64|x64|universal) ;;
  *) fail "--arch must be arm64, x64, or universal" ;;
esac

base_temp="${RUNNER_TEMP:-${TMPDIR:-/tmp}}"
base_temp="${base_temp%/}"
workdir="$(mktemp -d "$base_temp/lyricsheet-published-release.XXXXXX")"
trap 'rm -rf "$workdir"' EXIT

asset_name="LyricSheet-darwin-${arch}-${version}.zip"
zip_url="https://github.com/${release_repo}/releases/download/${tag}/${asset_name}"
zip_path="$workdir/$asset_name"
unzipped_dir="$workdir/unzipped"
app_path="$unzipped_dir/LyricSheet.app"
app_info_plist="$app_path/Contents/Info.plist"

curl_retry() {
  local url="$1"
  local output="$2"
  local max_attempts=12

  for attempt in $(seq 1 "$max_attempts"); do
    if curl -fsSL -H 'Cache-Control: no-cache' -o "$output" "$url"; then
      return 0
    fi

    if [ "$attempt" -eq "$max_attempts" ]; then
      return 1
    fi

    sleep 5
  done
}

plist_value() {
  /usr/libexec/PlistBuddy -c "Print :$2" "$1"
}

echo "Downloading published release asset: $zip_url"
curl_retry "$zip_url" "$zip_path" || fail "could not download published release asset"
shasum -a 256 "$zip_path"

mkdir -p "$unzipped_dir"
ditto -x -k "$zip_path" "$unzipped_dir"
[ -d "$app_path" ] || fail "release zip did not contain LyricSheet.app"
[ -f "$app_info_plist" ] || fail "release app is missing Contents/Info.plist"

actual_version="$(plist_value "$app_info_plist" CFBundleShortVersionString)"
actual_bundle_id="$(plist_value "$app_info_plist" CFBundleIdentifier)"

[ "$actual_version" = "$version" ] || fail "published app version is $actual_version, expected $version"
[ "$actual_bundle_id" = "com.lyricsheet.app" ] || fail "published app bundle id is $actual_bundle_id"

codesign_details="$workdir/codesign-details.txt"
codesign -dv --verbose=4 "$app_path" > "$codesign_details" 2>&1
grep -q '^Authority=Developer ID Application:' "$codesign_details" || fail "published app is not signed with a Developer ID Application certificate"
grep -Eq '^(Runtime Version=|.*flags=.*runtime)' "$codesign_details" || fail "published app does not have hardened runtime enabled"
grep -q '^TeamIdentifier=' "$codesign_details" || fail "published app has no signing team identifier"

codesign --verify --deep --strict --verbose=2 "$app_path"
spctl -a -vv --type execute "$app_path"
xcrun stapler validate "$app_path"

echo "Published release $tag is signed, notarized, stapled, and Gatekeeper-accepted"
