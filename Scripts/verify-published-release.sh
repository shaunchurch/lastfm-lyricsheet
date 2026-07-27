#!/usr/bin/env bash
set -euo pipefail

fail() {
  echo "error: $*" >&2
  exit 1
}

usage() {
  cat <<'USAGE'
Usage: verify-published-release.sh --version <x.y.z> --release-repo <owner/repo> --tag <vX.Y.Z> --team-id <id> [--arch arm64|x64|universal]

Downloads the public GitHub release zip and verifies that Gatekeeper can accept
the shipped macOS app.
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

asset_name="LyricSheet-darwin-${arch}-${version}.zip"
zip_url="https://github.com/${release_repo}/releases/download/${tag}/${asset_name}"
zip_path="$workdir/$asset_name"
checksum_name="$asset_name.sha256"
checksum_url="$zip_url.sha256"
checksum_path="$workdir/$checksum_name"
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
    --pattern "$asset_name" \
    --pattern "$checksum_name" || fail "could not download staged release assets"
else
  echo "Downloading published release asset: $zip_url"
  curl_retry "$zip_url" "$zip_path" || fail "could not download published release asset"
  curl_retry "$checksum_url" "$checksum_path" || fail "could not download published checksum"
fi
(cd "$workdir" && shasum -a 256 -c "$checksum_name") || fail "published checksum does not match"

mkdir -p "$unzipped_dir"
ditto -x -k "$zip_path" "$unzipped_dir"
[ -d "$app_path" ] || fail "release zip did not contain LyricSheet.app"

"$(dirname "$0")/verify-macos-bundle.sh" \
  --app "$app_path" \
  --version "$version" \
  --arch "$arch" \
  --notarized \
  --team-id "$team_id"

echo "Release $tag is signed, notarized, stapled, and Gatekeeper-accepted"
