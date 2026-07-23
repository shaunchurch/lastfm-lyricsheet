#!/usr/bin/env bash
# shellcheck disable=SC2016
set -euo pipefail

root="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
ci_workflow="$root/.github/workflows/ci.yml"
release_workflow="$root/.github/workflows/release.yml"
consumer="$root/.github/tart-runner-consumer.tsv"
actionlint_config="$root/.github/actionlint.yaml"
toolchain_action="$root/.github/actions/setup-macos-node/action.yml"
expected_consumer=$'tart-runner-consumer-v1\tlastfm-lyricsheet\tshaunchurch/lastfm-lyricsheet\tlastfm-lyricsheet-ci-tart-\tself-hosted,macOS,ARM64,tart-isolated,lastfm-lyricsheet'
runner_labels='runs-on: [self-hosted, macOS, ARM64, tart-isolated, lastfm-lyricsheet]'

fail() {
  echo "error: $*" >&2
  exit 1
}

require_literal() {
  local file="$1"
  local value="$2"
  grep -Fq -- "$value" "$file" || fail "$file is missing: $value"
}

[ -f "$ci_workflow" ] || fail "CI workflow is missing"
[ -f "$release_workflow" ] || fail "release workflow is missing"
[ -f "$consumer" ] || fail "Tart consumer declaration is missing"
[ -f "$actionlint_config" ] || fail "actionlint configuration is missing"
[ -f "$toolchain_action" ] || fail "shared toolchain action is missing"

[ "$(cat "$consumer")" = "$expected_consumer" ] ||
  fail "Tart consumer declaration does not match the controller contract"
[ "$(wc -l < "$consumer" | tr -d ' ')" = 1 ] ||
  fail "Tart consumer declaration must be one newline-terminated row"

for workflow in "$ci_workflow" "$release_workflow"; do
  require_literal "$workflow" "$runner_labels"
  require_literal "$workflow" 'uses: ./.github/actions/setup-macos-node'
done

for value in \
  'permissions:' \
  'contents: read' \
  'pnpm install --frozen-lockfile' \
  'pnpm run typecheck' \
  'pnpm test' \
  'bash Scripts/package-macos-release.sh' \
  'bash Scripts/verify-macos-bundle.sh'; do
  require_literal "$ci_workflow" "$value"
done

for value in \
  'bash Scripts/verify-macos-ci-toolchain.sh' \
  'corepack prepare pnpm@11.1.2 --activate' \
  'actions/setup-node@v4' \
  'node-version: 24' \
  'cache: pnpm'; do
  require_literal "$toolchain_action" "$value"
done

for value in \
  'APPLE_TEAM_ID: ${{ secrets.APPLE_TEAM_ID }}' \
  'MACOS_SIGN_IDENTITY=$SIGNING_IDENTITY_HASH' \
  'actions/upload-artifact@v4' \
  'shasum -a 256' \
  'Stage draft release' \
  'Source commit: $GITHUB_SHA' \
  'Published release $GITHUB_REF_NAME is immutable' \
  'Verify staged release' \
  'Publish verified release' \
  'Clean up signing material' \
  'if: always()' \
  'security delete-keychain'; do
  require_literal "$release_workflow" "$value"
done

require_literal "$actionlint_config" 'lastfm-lyricsheet'
require_literal "$actionlint_config" 'tart-isolated'

if grep -REq 'runs-on: (macos-|ubuntu-|windows-)' "$root/.github/workflows"; then
  fail "a workflow still uses a GitHub-hosted runner"
fi

echo "CI and release workflow contract passed"
