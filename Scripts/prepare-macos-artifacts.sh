#!/usr/bin/env bash
set -euo pipefail

fail() {
  echo "error: $*" >&2
  exit 1
}

if [ "$#" -lt 2 ] || [ "$#" -gt 3 ]; then
  fail "usage: $0 VERSION ARCH [--with-dmg]"
fi

version="$1"
arch="$2"
with_dmg=false
if [ "$#" -eq 3 ]; then
  [ "$3" = --with-dmg ] || fail "unknown argument '$3'"
  with_dmg=true
fi

case "$version" in
  *[!0-9A-Za-z.+-]*|'') fail "invalid version '$version'" ;;
esac

case "$arch" in
  arm64|x64|universal) ;;
  *) fail "unsupported architecture '$arch'" ;;
esac

zip_path="out/make/zip/darwin/${arch}/LyricSheet-darwin-${arch}-${version}.zip"
zip_name="$(basename "$zip_path")"
zip_checksum_path="$zip_path.sha256"

[ -f "$zip_path" ] || fail "packaged ZIP not found at $zip_path"

digest="$(shasum -a 256 "$zip_path" | awk '{print $1}')"
printf '%s  %s\n' "$digest" "$zip_name" > "$zip_checksum_path"
printf 'zip_path=%s\nzip_checksum_path=%s\n' \
  "$zip_path" "$zip_checksum_path"

if [ "$with_dmg" = true ]; then
  dmg_path="out/make/dmg/darwin/${arch}/LyricSheet-darwin-${arch}-${version}.dmg"
  dmg_name="$(basename "$dmg_path")"
  dmg_checksum_path="$dmg_path.sha256"
  [ -f "$dmg_path" ] || fail "packaged DMG not found at $dmg_path"

  digest="$(shasum -a 256 "$dmg_path" | awk '{print $1}')"
  printf '%s  %s\n' "$digest" "$dmg_name" > "$dmg_checksum_path"
  printf 'dmg_path=%s\ndmg_checksum_path=%s\n' \
    "$dmg_path" "$dmg_checksum_path"
fi
