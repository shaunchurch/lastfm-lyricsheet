#!/usr/bin/env bash
set -euo pipefail

fail() {
  echo "error: $*" >&2
  exit 1
}

app_name="LyricSheet"
version="$(node -p "require('./package.json').version")"
arch="${MACOS_RELEASE_ARCH:-arm64}"

case "$arch" in
  arm64|x64|universal) ;;
  *) fail "unsupported MACOS_RELEASE_ARCH '$arch'" ;;
esac

cache_env=(
  XDG_CACHE_HOME=.cache
  ELECTRON_CACHE=.cache/electron
  electron_config_cache=.cache/electron
  npm_config_devdir=.cache/node-gyp
)

env "${cache_env[@]}" pnpm exec electron-forge package --platform=darwin --arch="$arch"

app_path="out/${app_name}-darwin-${arch}/${app_name}.app"
zip_dir="out/make/zip/darwin/${arch}"
zip_path="${zip_dir}/${app_name}-darwin-${arch}-${version}.zip"

[ -d "$app_path" ] || fail "packaged app not found at $app_path"

mkdir -p "$zip_dir"
rm -f "$zip_path"
ditto -c -k --keepParent "$app_path" "$zip_path"

echo "$zip_path"
