# Verification record

## Google Maps update (14 October 2026)

Added native Android Google Maps, Places API (New) search, named custom pins, external directions and session-state integration. Local TypeScript and zero-warning lint passed; Jest passed 23 tests in 3 suites, and Metro generated the Android bundle with 20 assets. Six additional tests cover custom selection/saving/ride snapshots, invalid coordinates/built-in protection, duplicate coordinate rejection, reset and encoded directions URLs. Native map views/Places calls are mocked in renderer tests.

Local native compilation was attempted using JDK 17 and the user's SDK at `C:/Android/Sdk`, but Gradle again failed before project compilation with `Unable to establish loopback connection`. Independently, [GitHub Actions run 38451898191](https://github.com/vermakkrish/ManiPool/actions/runs/38451898191) and [PR run 38451922267](https://github.com/vermakkrish/ManiPool/actions/runs/38451922267) both passed quality and native Android jobs on commit `e88c296260ea4eab822b4226a62dd4826bab9622`. The x86_64 debug APK was generated and uploaded. This verifies native SDK/bridge compilation, not live authorization or UI operation.

Google Cloud billing/keys are not configured by this update; live map tiles, search results, native pin gestures and phone/emulator UI remain unverified for this version. See [Google Maps setup and device checklist](GOOGLE_MAPS.md). CI APKs have no configured key and require Metro; use your own restricted key/certificate and rebuild locally for live Google services.

The installed npm graph reports 54 inherited advisories (49 high, 5 moderate). No forced framework downgrade was applied.

Baseline: newly created public `vermakkrish/ManiPool`, clean `main`, initial commit `ef081fe99c6976e08495df86e98c09856aa5a872`, containing README and Node `.gitignore`. No application, dependency manifest, CI or baseline tests existed.

## Observed local results

| Check | Result |
| --- | --- |
| npm dependency install / lockfile install | Passed (`npm ci --ignore-scripts` on Node 24.11.1, npm 11.6.2) |
| `npm run typecheck` | Passed |
| `npm run lint` | Passed, zero warnings |
| `npm test -- --runInBand` | Passed: 17 tests, 2 suites |
| `npm run bundle:android` | Passed: Android production JavaScript bundle + 19 assets |
| Native `assembleDebug` | Environment blocked before project compilation: Gradle loopback connection failure |
| ADB / emulator | Environment blocked: Android preferences directory initialisation failure; no device walkthrough claimed |
| `git diff --check` | Passed before delivery |

The interaction test renders the actual app/navigation with mocked native components and presses through welcome, demo profile, matching, match details, explicit acceptance, vehicle choice/booking confirmation, start/completion and history. Pure tests verify the domain edge cases described in README. Renderer tests do not verify native Android views, date-picker dialogs, keyboard behaviour, real sharing, screenshots, accessibility services or small-device layout.

Metro reports a feature-flags subpath export fallback from the installed upstream React Native dependency graph; it still successfully generates the bundle. No warning suppression or vendor patch was introduced.

Native builds were attempted with Android Studio's JDK 25 and a downloaded Microsoft JDK 17, Gradle 9.4.1, and the installed Android SDK path. Both failed at local loopback initialisation. Native compilation was subsequently verified independently on GitHub Actions as recorded below.

Remote quality checks (npm ci, TypeScript, lint, all 17 tests and Metro) also passed on the implementation commit. The initial Android CI job lacked SDK tools in PATH; SDK setup was added. The older setup action then requested Google's removed `tools` package. CI was updated to the maintained SDK action, explicit `platform-tools`, and the platform identifier `platforms;android-37.0`, verified against Google's SDK repository metadata.

## Observed GitHub Actions results

[Run 38145193383](https://github.com/vermakkrish/ManiPool/actions/runs/38145193383) completed successfully on commit `c30172beccad8ef8233a5678bc40f784f195cee8` on 11 October 2026:

- Quality job: clean `npm ci`, TypeScript, zero-warning lint, 17 Jest tests and Android Metro bundle all passed.
- Android job: JDK 17, SDK 37.0, Build-Tools 37.0.0, NDK 27.1.12297006 and CMake 3.22.1; `./gradlew assembleDebug --no-daemon --max-workers=2 -PreactNativeArchitectures=x86_64` passed.
- Artifact `mahe-carpool-debug-x86_64` uploaded successfully (artifact ID `11704776584`). It contains a development debug APK for an x86_64 emulator, requires Metro, and is not a standalone release or an ARM phone build. Download it from the run's Artifacts section while retained by GitHub.

This verifies native compilation and APK generation. Installation, launch and the device walkthrough below remain unverified; successful compilation does not establish those results.

Non-breaking npm audit fixes were attempted. The final local install reports 53 inherited dependency advisories (48 high, 5 moderate), primarily propagated `braces` / `sprintf-js` findings in the Metro/Jest/framework tree. Forced audit fixes propose incompatible changes and were not applied. Review upstream patches before production use.

## Device walkthrough still required

- Launch and native date/time selection, invalid and past requests.
- Small-screen spacing, keyboard resize, TalkBack, Android back and activity restoration.
- Location search/saved places/map schematic, pickup selection, messages/quick actions and sharing dialog.
- Normal, two-rider/auto, no-match/recovery, cancellation and reset flows.
- Confirm no live services/permissions/charges and no secrets in native outputs.

The implementation is a local-session prototype; production authentication, backend persistence, routing, realtime messaging, payments, provider integration and push delivery are deliberately outside scope.
