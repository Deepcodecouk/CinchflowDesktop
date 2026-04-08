# Windows Microsoft Store Packaging Plan (MSI-first)

## Summary
- Goal: ship CinchFlow to the Microsoft Store with the least disruption to the current Electron Forge setup.
- Chosen route: submit a classic Win32 installer to Microsoft Store using MSI, not AppX/MSIX.
- Keep the existing Squirrel channel for direct Windows downloads.
- Why this route: this repo already packages as a normal desktop app, Windows Store accepts EXE/MSI submissions, and the app does not need Windows package-identity features right now.
- Current repo facts:
  - Windows packaging today is Squirrel-only in `forge.config.ts`.
  - Squirrel startup handling exists in `src/main/index.ts`.
  - Packaged app data already goes to `app.getPath('userData')` in `src/main/db/connection.ts`, which is correct for installer upgrades.
  - No app icon is currently configured in `forge.config.ts`, and `assets/` is effectively empty.
  - Release docs are inconsistent: `README.md` says `npm run make` increments versions, but `package.json` shows only `make:next` runs the version-prep script.

## Build and Packaging Changes
1. Set up external prerequisites first.
- Create a Microsoft Partner Center account and reserve `CinchFlow`.
- Acquire an Authenticode code-signing certificate in PFX form for the first release.
- Finalize one publisher/manufacturer string and reuse it everywhere: certificate subject, MSI manufacturer, Store listing publisher, support docs.
- Produce Windows packaging assets: `.ico` installer icon, Store logos, screenshots, privacy policy URL, support URL.

2. Add a dedicated MSI maker without removing Squirrel.
- Install `@electron-forge/maker-wix`.
- Update `forge.config.ts` to import `MakerWix` and add a Windows MSI maker alongside `MakerSquirrel`.
- Keep Squirrel for the non-Store channel.
- Restrict WiX/MSI generation to Windows builds only.

3. Normalize Windows identity so upgrades remain stable.
- Stop versioning the executable filename. Use a stable executable name such as `cinchflow.exe`.
- Keep versioning only in installer artifact names.
- Set a stable Windows application identity string such as `com.cinchflow.desktop`.
- Define and persist one WiX `upgradeCode`; never regenerate it after first release.

4. Make signing and publisher data environment-driven.
- Read signing inputs from environment variables rather than hardcoding paths or secrets.
- Add build-time config for:
  - `WINDOWS_CERT_FILE`
  - `WINDOWS_CERT_PASSWORD`
  - `WINDOWS_MANUFACTURER`
  - `WINDOWS_UPGRADE_CODE`
- Wire these into the WiX maker config.
- Leave the runtime app code unchanged; this is packaging-only.

5. Add Windows release scripts and fix versioning ambiguity.
- Add a dedicated Windows Store build script that runs Forge for signed MSI output.
- Keep a separate direct-download Windows build path for Squirrel output.
- Change the release process so the app version is bumped explicitly before packaging.
- Update `README.md` so it matches the actual release scripts in `package.json`.

## Store Submission Workflow
1. Build a signed MSI from a clean Windows machine with WiX Toolset installed.
2. Verify the MSI and packaged EXE binaries are signed successfully.
3. Upload the MSI to a stable versioned HTTPS download URL that never changes after submission.
4. In Partner Center, create an EXE/MSI app submission, not an MSIX submission.
5. Enter Store metadata:
- product category
- description and feature bullets
- screenshots and logos
- privacy policy URL
- support contact / website
- certification notes explaining that data is stored locally and no account is required
6. Submit, review certification output, and treat any failed certification as a packaging bug, not a content-edit problem.

## Important Interfaces, Config, and File Changes
- `forge.config.ts`
  - Add `MakerWix`
  - Keep `MakerSquirrel`
  - Use stable `executableName`
  - Add WiX config for `manufacturer`, `exe`, `icon`, `upgradeCode`, signing
- `package.json`
  - Add Windows Store packaging script(s)
  - Clarify release/version workflow
- `assets/`
  - Add Windows `.ico`
  - Add Store listing image set
- `README.md`
  - Document Store build steps and correct versioning behavior
- No IPC, preload, renderer, or shared type contract changes are required.

## Test Cases and Acceptance Criteria
- Build succeeds on Windows with WiX installed and produces a signed `.msi`.
- Fresh install works for a standard non-admin user.
- App launches from Start menu after install.
- Uninstall removes the app cleanly from Programs and Features.
- Upgrade from MSI version N to N+1 works without changing the app identity or breaking shortcuts.
- Existing user data survives upgrade because the DB remains under Electron `userData`.
- Direct-download Squirrel build still works after adding WiX.
- Store submission passes the offline-installer and signing checks.
- Store listing has required screenshots, icons, privacy policy, and support details.

## Assumptions and Defaults
- Microsoft Store packaging will use MSI because it is the shortest path from this repo.
- Squirrel remains the direct-download Windows channel.
- No in-app updater will be added for the Store channel; Store delivery handles updates there.
- The executable name will be stabilized before the first MSI release.
- Inference from the current artifact layout plus Microsoft certification rules: the existing Squirrel output should not be used as the Store artifact because it is a multi-file installer/update bundle rather than the standalone offline `.exe` or `.msi` Microsoft certifies for classic submissions.

## References
- Microsoft Store submission FAQ: https://learn.microsoft.com/windows/apps/publish/faq/submit-your-app
- Microsoft Store EXE/MSI certification requirements: https://learn.microsoft.com/windows/apps/publish/publish-your-app/msi/app-certification-process
- Electron Forge WiX MSI maker: https://www.electronforge.io/config/makers/wix-msi
- Electron Forge WiX maker config API: https://js.electronforge.io/interfaces/_electron_forge_maker_wix.MakerWixConfig.html
- Electron Forge Squirrel maker: https://www.electronforge.io/config/makers/squirrel.windows
