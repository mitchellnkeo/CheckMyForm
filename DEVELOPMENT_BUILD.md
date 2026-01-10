# Development Build Setup

This project uses **React Native Vision Camera** and **ML Kit**, which require a **development build** (not Expo Go).

## Why Development Build?

- Vision Camera requires native modules that aren't available in Expo Go
- ML Kit frame processors need native code compilation
- Better performance for real-time ML processing

## Setup Instructions

### 1. Install EAS CLI (if not already installed)

```bash
npm install -g eas-cli
```

### 2. Login to Expo

```bash
eas login
```

### 3. Configure Development Build

The project is already configured for development builds. The native code will be generated when you run:

```bash
npx expo prebuild
```

### 4. Build for Your Device

#### For iOS (requires Mac):

```bash
# Generate native iOS project
npx expo prebuild --platform ios

# Install CocoaPods dependencies
cd ios
pod install
cd ..

# Run on iOS simulator or device
npx expo run:ios
```

#### For Android:

```bash
# Generate native Android project
npx expo prebuild --platform android

# Run on Android emulator or device
npx expo run:android
```

### 5. Development Workflow

After the initial build:

1. **Start Metro bundler:**
   ```bash
   npx expo start --dev-client
   ```

2. **Open the app** on your device/simulator (it should already be installed from step 4)

3. **Shake device** or press `Cmd+D` (iOS) / `Cmd+M` (Android) to open developer menu

### 6. Building for Physical Devices

#### iOS (requires Apple Developer account):

```bash
eas build --platform ios --profile development
```

#### Android:

```bash
eas build --platform android --profile development
```

Then install the build on your device using the provided link.

## Troubleshooting

### "Native module not found" errors

- Make sure you ran `npx expo prebuild`
- For iOS: Make sure you ran `pod install` in the `ios` directory
- Rebuild the app: `npx expo run:ios` or `npx expo run:android`

### Camera permission issues

- Check `app.json` has camera permissions configured
- On iOS: Check `Info.plist` has `NSCameraUsageDescription`
- On Android: Check `AndroidManifest.xml` has `CAMERA` permission

### ML Kit not working

- Make sure Babel plugin is configured in `babel.config.js`
- Check that `react-native-mlkit-pose-detection` is installed
- Verify Vision Camera frame processor is initialized

## Notes

- **Expo Go will NOT work** with this project
- You must use a development build
- First build takes longer (compiles native code)
- Subsequent builds are faster (only JS changes)

## Resources

- [Expo Development Builds](https://docs.expo.dev/development/introduction/)
- [Vision Camera Docs](https://react-native-vision-camera.com/)
- [ML Kit Pose Detection](https://github.com/swittk/react-native-mlkit-pose-detection)
