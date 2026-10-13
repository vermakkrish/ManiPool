# Android Google Maps setup

## Features and boundaries

Native Google maps appear on route preview, formed group, active ride and completion screens. Pickup/destination selection supports Google Places autocomplete (India) and named custom pins (long-press, drag, confirm). Selected locations work with the existing session state, saved places and ride snapshots. External driving directions open Google Maps.

Pre-acceptance screens retain approximate schematic views. Sample landmarks have no verified coordinates and are not plotted precisely: search Google for a landmark to obtain its location. Sequential pickup mode plots only your selected pickup and destination; other demo riders have no actual coordinates. No GPS permission, reverse geocoding, background tracking, real riders, in-app road route/ETA, road-based matching or provider booking was added. Fares, detours and common/sequential suggestions remain illustrative.

## Configure your Google Cloud project

1. Create/select a project at [Google Cloud Console](https://console.cloud.google.com/), and enable billing.
2. Enable **Maps SDK for Android** and **Places API (New)**.
3. Create an API key. Restrict its application to **Android apps**, package **com.mahecarpool**, and your debug signing certificate SHA-1.
4. Obtain your own debug certificate SHA-1:

   ```powershell
   cd "C:\dev\ManiPool\android"
   .\gradlew.bat signingReport
   ```

   Use the SHA1 for the app's debug variant. A teammate's PC or CI APK can have a different signing certificate and needs its own entry.
5. Restrict the key's APIs to **Maps SDK for Android** and **Places API (New)**. Follow [Google's key restrictions guide](https://developers.google.com/maps/api-security-best-practices).
6. In **android/local.properties**, keep your `sdk.dir` line and add:

   ```properties
   GOOGLE_MAPS_API_KEY=YOUR_RESTRICTED_ANDROID_KEY
   ```

   Replace the placeholder locally. Places uses the same key by default. A separately restricted Places key can be set with `GOOGLE_PLACES_API_KEY`. Environment variables with these names are also supported; local properties take precedence. Do not send keys in chat or commit this ignored file.
7. Review [Maps billing](https://developers.google.com/maps/documentation/android-sdk/usage-and-billing) and [Places billing](https://developers.google.com/maps/documentation/places/android-sdk/usage-and-billing). Autocomplete/details can incur charges. Set appropriate budgets/alerts and available quotas. Budget alerts do not automatically stop spending.

No Google Cloud project, billing account or key is created by this code change.

## Rebuild and run

Native dependency/key changes require a rebuild; Fast Refresh is insufficient. Start a Google APIs/Google Play emulator image (or a phone with supported Play services).

```powershell
# First terminal; leave Metro running
cd "C:\dev\ManiPool"
npm.cmd ci
npm.cmd start
```

```powershell
# Second terminal, with emulator running
cd "C:\dev\ManiPool"
adb devices
adb -s emulator-5554 reverse tcp:8081 tcp:8081
npm.cmd run android -- --no-packager --deviceId emulator-5554 --active-arch-only
```

Substitute your actual device ID if different. The `deviceId` deprecation notice is harmless.

## Device verification

1. Continue as Demo and open pickup selection. Search Google for a place/address and select a suggestion.
2. Select a different destination. Open route preview and check correctly labelled markers/camera framing.
3. Open pickup selection again. Long-press the map, drag the pin if needed, name it and choose **Use selected map point**. No point is committed before confirmation.
4. Save/revisit the custom location in the local list. Start a demo journey and confirm its snapshot is consistent.
5. Check approximate pre-acceptance views, formed-group map, external directions, active ride and completion.
6. Check unavailable network/key: helpful search error, sample landmarks, and **Map not loading? Use illustration** fallback. A configured key does not prove Google authorization; blank tiles may indicate network, restrictions, billing or Play services problems.

Live responses, tiles, gestures and device rendering require this configured-key walkthrough; they are not verified merely by a successful APK build.

## Implementation

`react-native-maps` is pinned at 1.29.11. Places SDK 5.3.0 is deliberately pinned, using Places API (New) and session tokens. SDK 6 removed methods used by this adapter; migrate the bridge against those contracts before upgrading it. Requested details are ID, display name, formatted address and location; no photos/reviews are requested.

The Android key is embedded in native resources/BuildConfig as required by mobile SDKs. APK contents are inspectable, so restrict keys by app/certificate/API. The JavaScript bridge exposes configuration booleans and results, not keys. Search uses the native SDK, not direct REST requests from JavaScript.

Official Google Maps attribution assets come from [Google's attribution guidance](https://developers.google.com/maps/documentation/places/android-sdk/policies). Returned provider attributions are available through **View place data providers**, preserving their HTML/links. Google content is held in memory for this app session; reset/process restart clears it. Persistent storage requires reviewing Google's content-retention rules. iOS Google Maps/Places is not configured.
