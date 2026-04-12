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
