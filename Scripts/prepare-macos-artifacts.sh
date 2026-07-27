#!/usr/bin/env bash
set -euo pipefail

fail() {
  echo "error: $*" >&2
  exit 1
}

if [ "$#" -ne 2 ]; then
  fail "usage: $0 VERSION ARCH"
fi

version="$1"
arch="$2"

case "$version" in
  *[!0-9A-Za-z.+-]*|'') fail "invalid version '$version'" ;;
esac

case "$arch" in
  arm64|x64|universal) ;;
  *) fail "unsupported architecture '$arch'" ;;
esac

zip_path="out/make/zip/darwin/${arch}/LyricSheet-darwin-${arch}-${version}.zip"
zip_name="$(basename "$zip_path")"

[ -f "$zip_path" ] || fail "packaged ZIP not found at $zip_path"

digest="$(shasum -a 256 "$zip_path" | awk '{print $1}')"
printf '%s  %s\n' "$digest" "$zip_name" > "$zip_path.sha256"
printf 'zip_path=%s\nchecksum_path=%s\n' "$zip_path" "$zip_path.sha256"
