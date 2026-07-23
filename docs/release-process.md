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
   git tag v0.2.2
   git push origin v0.2.2
   ```

4. Watch the **Release** GitHub Actions workflow.
5. Confirm **Verify staged release** passed and **Publish verified release**
   completed.

## What The Workflow Does

1. Verifies the tag matches `package.json`.
2. Runs in a disposable Tart VM on the shared Mac mini and verifies the pinned
   arm64/Xcode 26 toolchain.
3. Installs dependencies from `pnpm-lock.yaml`.
4. Runs typecheck and tests.
5. Imports the expected Apple team's Developer ID Application certificate into
   an ephemeral keychain.
6. Builds LyricSheet with Electron Forge, Developer ID signing, hardened runtime,
   notarization, and stapling enabled.
7. Packages `LyricSheet.app` with `ditto --keepParent`, writes a SHA-256 file,
   and retains both as a workflow artifact.
8. Stages a draft GitHub release tied to the source commit. Published releases
   are immutable; only a draft owned by the same commit may be replaced.
9. Downloads the staged artifacts and verifies the checksum, shipped app
   version, bundle ID, architecture, expected signing team, hardened runtime,
   code-signing integrity, Gatekeeper acceptance, and notarization ticket.
10. Publishes the draft only after verification passes.
11. Removes the release keychain and API key material on every exit path. The
    Tart controller then erases the VM.

Sparkle updates are intentionally out of scope for now.

## Required Secrets

Set these in GitHub repository secrets:

| Secret | Contents |
| --- | --- |
| `MACOS_CERT_P12` | Developer ID Application certificate, `.p12` export, base64-encoded |
| `MACOS_CERT_PASSWORD` | Password protecting the `.p12` |
| `APPLE_TEAM_ID` | 10-character Apple Developer team ID expected in the certificate and shipped signature |
| `ASC_KEY_ID` | App Store Connect API key ID for notarization |
| `ASC_ISSUER_ID` | App Store Connect issuer ID |
| `ASC_KEY_P8` | Contents of the App Store Connect API `.p8` key |

## Continuous Integration

Pull requests and pushes to `master` run `.github/workflows/ci.yml`. CI uses the
same disposable Tart runner and pinned Node/pnpm toolchain as Release, but has
read-only permissions and no signing secrets. It typechecks, tests, packages an
unsigned arm64 app, and verifies the bundle without launching it.

Both workflows request the exact labels `self-hosted, macOS, ARM64,
tart-isolated, lastfm-lyricsheet`. The shared controller must pin the matching
`.github/tart-runner-consumer.tsv` declaration before jobs can be admitted.

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
