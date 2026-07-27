#!/usr/bin/env bash
set -euo pipefail

fail() {
  echo "error: $*" >&2
  exit 1
}

[ "$(uname -m)" = arm64 ] || fail "macOS pipelines require an arm64 runner"

xcode_version="$(xcodebuild -version | awk '/^Xcode / {print $2; exit}')"
sdk_version="$(xcrun --sdk macosx --show-sdk-version)"

[[ "$xcode_version" == 26.* ]] ||
  fail "macOS pipelines require Xcode 26, got ${xcode_version:-unknown}"
[[ "$sdk_version" == 26.* ]] ||
  fail "macOS pipelines require the macOS 26 SDK, got ${sdk_version:-unknown}"

echo "Verified arm64, Xcode $xcode_version, and macOS SDK $sdk_version"
