#!/usr/bin/env bash
set -euo pipefail

fail() {
  echo "error: $*" >&2
  exit 1
}

require_env() {
  local name="$1"
  [ -n "${!name:-}" ] || fail "MACOS_SIGN=true requires $name"
}

app_name="LyricSheet"
version="$(node -p "require('./package.json').version")"
arch="${MACOS_RELEASE_ARCH:-arm64}"

case "$version" in
  *[!0-9A-Za-z.+-]*|'') fail "invalid package version '$version'" ;;
esac

case "$arch" in
  arm64|x64|universal) ;;
  *) fail "unsupported MACOS_RELEASE_ARCH '$arch'" ;;
esac

app_path="out/${app_name}-darwin-${arch}/${app_name}.app"
maker_dmg_path="out/make/${app_name}-${version}-${arch}.dmg"
dmg_dir="out/make/dmg/darwin/${arch}"
dmg_path="${dmg_dir}/${app_name}-darwin-${arch}-${version}.dmg"

[ -d "$app_path" ] || fail "packaged app not found at $app_path"

cache_env=(
  XDG_CACHE_HOME=.cache
  ELECTRON_CACHE=.cache/electron
  electron_config_cache=.cache/electron
  npm_config_devdir=.cache/node-gyp
)

mkdir -p "$dmg_dir"
rm -f "$maker_dmg_path" "$dmg_path"
env "${cache_env[@]}" pnpm exec electron-forge make \
  --targets=@electron-forge/maker-dmg \
  --skip-package \
  --platform=darwin \
  --arch="$arch"

[ -f "$maker_dmg_path" ] ||
  fail "Electron Forge DMG not found at $maker_dmg_path"
mv "$maker_dmg_path" "$dmg_path"

if [ "${MACOS_SIGN:-false}" = true ]; then
  for name in \
    MACOS_SIGN_IDENTITY \
    MACOS_SIGN_KEYCHAIN \
    ASC_KEY_PATH \
    ASC_KEY_ID \
    ASC_ISSUER_ID; do
    require_env "$name"
  done

  codesign \
    --sign "$MACOS_SIGN_IDENTITY" \
    --keychain "$MACOS_SIGN_KEYCHAIN" \
    --identifier com.lyricsheet.app.dmg \
    --timestamp \
    "$dmg_path"
  codesign --verify --strict --verbose=2 "$dmg_path"

  base_temp="${RUNNER_TEMP:-${TMPDIR:-/tmp}}"
  base_temp="${base_temp%/}"
  submit_plist="$base_temp/lyricsheet-dmg-notary-submit.plist"
  notary_log="$base_temp/lyricsheet-dmg-notary-log.json"
  notary_auth=(
    --key "$ASC_KEY_PATH"
    --key-id "$ASC_KEY_ID"
    --issuer "$ASC_ISSUER_ID"
  )
  rm -f "$submit_plist" "$notary_log"

  if ! xcrun notarytool submit "$dmg_path" \
    "${notary_auth[@]}" \
    --wait \
    --timeout 1h \
    --output-format plist > "$submit_plist"; then
    cat "$submit_plist" >&2
    fail "DMG notarization submission failed"
  fi

  submission_status="$(
    /usr/libexec/PlistBuddy -c 'Print :status' "$submit_plist"
  )"
  submission_id="$(
    /usr/libexec/PlistBuddy -c 'Print :id' "$submit_plist"
  )"
  [ -n "$submission_id" ] || fail "DMG notarization returned no submission ID"

  xcrun notarytool log "$submission_id" "$notary_log" "${notary_auth[@]}"
  if [ "$submission_status" != Accepted ]; then
    cat "$notary_log" >&2
    fail "DMG notarization status is '$submission_status'"
  fi
  if grep -Eq '"severity"[[:space:]]*:[[:space:]]*"(warning|error)"' "$notary_log"; then
    cat "$notary_log" >&2
    fail "DMG notarization log contains warnings or errors"
  fi

  xcrun stapler staple "$dmg_path"
  xcrun stapler validate "$dmg_path"
  spctl -a -t open -vvv --context context:primary-signature "$dmg_path"
fi

echo "$dmg_path"
