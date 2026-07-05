# Release Process

LyricSheet macOS releases are distributed outside the Mac App Store. Release
artifacts must be Developer ID signed, hardened-runtime enabled, notarized, and
stapled before publishing. Unsigned local ZIPs can be rejected by Gatekeeper as
damaged or corrupt after download.

## How to Ship

1. Bump `version` in `package.json`.
2. Commit and merge to `master`.
3. Push a matching tag:

   ```sh
   git tag v0.2.1
   git push origin v0.2.1
   ```

4. Watch the **Release** GitHub Actions workflow.
5. Confirm the final **Verify published release** step passed.

## What The Workflow Does

1. Verifies the tag matches `package.json`.
2. Installs dependencies from `pnpm-lock.yaml`.
3. Runs typecheck and tests.
4. Imports the Developer ID Application certificate into an ephemeral keychain.
5. Builds LyricSheet with Electron Forge, Developer ID signing, hardened runtime,
   notarization, and stapling enabled.
6. Packages `LyricSheet.app` with `ditto --keepParent`.
7. Publishes or replaces the GitHub release ZIP for the tag.
8. Re-downloads the public ZIP and verifies the shipped app version, bundle ID,
   Developer ID signature, hardened runtime, code-signing integrity, Gatekeeper
   acceptance, and stapled notarization ticket.

Sparkle updates are intentionally out of scope for now.

## Required Secrets

Set these in GitHub repository secrets:

| Secret | Contents |
| --- | --- |
| `MACOS_CERT_P12` | Developer ID Application certificate, `.p12` export, base64-encoded |
| `MACOS_CERT_PASSWORD` | Password protecting the `.p12` |
| `ASC_KEY_ID` | App Store Connect API key ID for notarization |
| `ASC_ISSUER_ID` | App Store Connect issuer ID |
| `ASC_KEY_P8` | Contents of the App Store Connect API `.p8` key |

Optional repository variable:

| Variable | Default | Purpose |
| --- | --- | --- |
| `MACOS_SIGN_IDENTITY` | `Developer ID Application` | Exact signing identity if the keychain contains more than one Developer ID Application certificate |

## Local Notes

`pnpm make` is still useful for quick unsigned local packaging. Do not publish
those artifacts.

For a local release-shaped ZIP without signing secrets:

```sh
pnpm run release:mac
```

For a signed local run, the same environment variables used by CI must be set,
including `MACOS_SIGN=true`, `MACOS_SIGN_KEYCHAIN`, `ASC_KEY_PATH`,
`ASC_KEY_ID`, and `ASC_ISSUER_ID`.
