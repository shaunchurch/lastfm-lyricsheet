#!/usr/bin/env bash
set -euo pipefail

fail() {
  echo "error: $*" >&2
  exit 1
}

usage() {
  cat <<'USAGE'
Usage: verify-published-release.sh --version <x.y.z> --release-repo <owner/repo> --tag <vX.Y.Z> --team-id <id> [--arch arm64|x64|universal]

Downloads the public GitHub release ZIP and DMG, checks both digests, and
verifies that Gatekeeper accepts the shipped app and disk image.
USAGE
}

version=""
release_repo=""
tag=""
arch="arm64"
team_id=""

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

[ -n "$version" ] || fail "--version is required"
[ -n "$release_repo" ] || fail "--release-repo is required"
[ -n "$tag" ] || fail "--tag is required"
[ -n "$team_id" ] || fail "--team-id is required"

case "$arch" in
  arm64|x64|universal) ;;
  *) fail "--arch must be arm64, x64, or universal" ;;
esac

base_temp="${RUNNER_TEMP:-${TMPDIR:-/tmp}}"
base_temp="${base_temp%/}"
workdir="$(mktemp -d "$base_temp/lyricsheet-published-release.XXXXXX")"
trap 'rm -rf "$workdir"' EXIT

zip_name="LyricSheet-darwin-${arch}-${version}.zip"
zip_url="https://github.com/${release_repo}/releases/download/${tag}/${zip_name}"
zip_path="$workdir/$zip_name"
zip_checksum_name="$zip_name.sha256"
zip_checksum_url="$zip_url.sha256"
zip_checksum_path="$workdir/$zip_checksum_name"
dmg_name="LyricSheet-darwin-${arch}-${version}.dmg"
dmg_url="https://github.com/${release_repo}/releases/download/${tag}/${dmg_name}"
dmg_path="$workdir/$dmg_name"
dmg_checksum_name="$dmg_name.sha256"
dmg_checksum_url="$dmg_url.sha256"
dmg_checksum_path="$workdir/$dmg_checksum_name"
unzipped_dir="$workdir/unzipped"
app_path="$unzipped_dir/LyricSheet.app"

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

if [ -n "${GH_TOKEN:-}" ]; then
  gh release download "$tag" \
    --repo "$release_repo" \
    --dir "$workdir" \
    --pattern "$zip_name" \
    --pattern "$zip_checksum_name" \
    --pattern "$dmg_name" \
    --pattern "$dmg_checksum_name" ||
    fail "could not download staged release assets"
else
  echo "Downloading published release assets for $tag"
  curl_retry "$zip_url" "$zip_path" || fail "could not download published release asset"
  curl_retry "$zip_checksum_url" "$zip_checksum_path" ||
    fail "could not download published ZIP checksum"
  curl_retry "$dmg_url" "$dmg_path" ||
    fail "could not download published DMG"
  curl_retry "$dmg_checksum_url" "$dmg_checksum_path" ||
    fail "could not download published DMG checksum"
fi
(cd "$workdir" && shasum -a 256 -c "$zip_checksum_name") ||
  fail "published ZIP checksum does not match"
(cd "$workdir" && shasum -a 256 -c "$dmg_checksum_name") ||
  fail "published DMG checksum does not match"

mkdir -p "$unzipped_dir"
ditto -x -k "$zip_path" "$unzipped_dir"
[ -d "$app_path" ] || fail "release zip did not contain LyricSheet.app"

"$(dirname "$0")/verify-macos-bundle.sh" \
  --app "$app_path" \
  --version "$version" \
  --arch "$arch" \
  --notarized \
  --team-id "$team_id"

"$(dirname "$0")/verify-macos-dmg.sh" \
  --dmg "$dmg_path" \
  --version "$version" \
  --arch "$arch" \
  --team-id "$team_id"

echo "Release $tag ZIP and DMG are signed, notarized, stapled, and Gatekeeper-accepted"
