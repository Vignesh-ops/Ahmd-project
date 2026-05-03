# from repo root
npm install
npm run build
npx cap sync android

# build debug APK
cd android
./gradlew assembleDebug
cd ..

# install on device (USB + USB debugging enabled)
adb devices
adb install -r android/app/build/outputs/apk/debug/app-debug.apk



How to use:

Put APK files in public/apk/
Name pattern: anything-vX.apk (example: ahmad-enterprises-v2.apk)
Set current app version in lib/app-version.js when you release.
Important:

Android does not allow silent install from app without special device-owner privileges.
Current flow is: popup -> download link opens -> user installs APK.
Build command confirmation
./gradlew assembleDebug is not production (debug build only).
Production build commands:
npm run build
npm run android:sync
cd android
./gradlew assembleRelease (APK)
./gradlew bundleRelease (Play Store AAB)
Also important for production updates:

Increment versionCode/versionName in android/app/build.gradle, otherwise upgrade install can fail.
Configure release signing (keystore) for real distributable APK/AAB.
Build check: I ran npm run build and it passed successfully.






#new version
APK update popup flow added
Added native-only update check popup.
It scans public/apk for files like appname-v1.apk, appname-v3.apk, picks highest version, compares with current app version, and shows “Update Available”.
Added:
AppUpdatePrompt.jsx
app-update API route
app-version.js
provider wiring in providers.js
folder public/apk















