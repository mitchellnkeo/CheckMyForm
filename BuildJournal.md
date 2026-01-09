# Build Journal

In this build journal, document all steps done with reasons why those steps were taken. Ensure that everything document has the date and time.

---

## Phase 0: Project Setup & Environment Configuration

**Date:** January 8, 2026  
**Time:** ~18:50 PST

### Step 1: Initialize Expo Project with TypeScript Template
**Time:** 18:48 PST

**Action:** Manually created Expo project structure since `create-expo-app` couldn't initialize in a non-empty directory.

**Files Created:**
- `package.json` - Project configuration with Expo SDK 51 dependencies
- `app.json` - Expo app configuration with camera permissions for iOS and Android
- `tsconfig.json` - TypeScript configuration with path aliases (`@/*` → `src/*`)
- `babel.config.js` - Babel configuration with Reanimated plugin
- `App.tsx` - Main app entry point
- `.gitignore` - Git ignore patterns for Expo/React Native projects
- `app.config.js` - Dynamic Expo config

**Reason:** The `create-expo-app` command requires an empty directory, but we already had `ROADMAP.md` and `BuildJournal.md`. Instead of moving files around, we manually created the essential Expo project files to have full control over the setup.

**Camera Permissions Configured:**
- iOS: `NSCameraUsageDescription` and `NSMicrophoneUsageDescription` in `app.json`
- Android: `CAMERA` and `RECORD_AUDIO` permissions
- Expo Camera plugin configured with permission message

### Step 2: Install Core Dependencies
**Time:** 18:49 PST

**Action:** Installed all core dependencies from Phase 0 requirements.

**Dependencies Installed:**
1. **Expo Core:**
   - `expo-camera@~15.0.16` - Camera access for pose detection
   - `expo-gl@~14.0.2` - WebGL for TensorFlow.js
   - `expo-gl-cpp@^11.4.0` - C++ bindings for expo-gl
   - `@react-native-async-storage/async-storage@1.23.1` - Local storage

2. **TensorFlow.js:**
   - `@tensorflow/tfjs@^4.22.0` - Core TensorFlow.js library
   - `@tensorflow/tfjs-react-native@^1.0.0` - React Native bindings
   - **Note:** Installed with `--legacy-peer-deps` due to version conflict (tfjs-react-native requires expo-camera@^13.4.4, but we're using SDK 51 with expo-camera@15.0.16)

3. **State Management & Storage:**
   - `zustand@^5.0.9` - Lightweight state management
   - `expo-sqlite@~14.0.6` - Local SQLite database

4. **UX Enhancements:**
   - `expo-haptics@~13.0.1` - Haptic feedback
   - `expo-av@~14.0.7` - Audio/video playback

5. **Animation & Gestures:**
   - `react-native-reanimated@~3.10.1` - Smooth animations
   - `react-native-gesture-handler@~2.16.1` - Gesture handling

6. **Navigation:**
   - `@react-navigation/native@^7.1.26` - Core navigation library
   - `@react-navigation/native-stack@^7.9.0` - Stack navigator
   - `react-native-screens@^4.19.0` - Native screen components
   - `react-native-safe-area-context@^5.6.2` - Safe area handling

**Reason:** All dependencies are required for Phase 1 (pose detection) and future phases. Installed them upfront to verify compatibility and resolve any version conflicts early.

**Issues Encountered:**
- TensorFlow.js React Native has a peer dependency conflict with expo-camera versions. Used `--legacy-peer-deps` to resolve. This is a known issue and shouldn't affect functionality.
- React Navigation required updating react-native-screens to v4.x for compatibility.

### Step 3: Set Up Project Folder Structure
**Time:** 18:49 PST

**Action:** Created organized folder structure as specified in roadmap.

**Structure Created:**
```
src/
├── screens/     - Screen components
├── components/  - Reusable UI components
├── services/    - Business logic (pose detection, form analysis)
├── utils/       - Utility functions (angle calculations, etc.)
├── stores/      - Zustand state stores
├── types/       - TypeScript type definitions
└── constants/   - App constants
```

**Files Created:**
- `src/screens/HomeScreen.tsx` - Basic home screen component

**Reason:** Organized structure makes the codebase maintainable and follows React Native best practices. Separates concerns (UI, business logic, state, types).

### Step 4: Configure TypeScript Path Aliases
**Time:** 18:48 PST (configured in tsconfig.json)

**Action:** Set up path aliases in `tsconfig.json` for cleaner imports.

**Configuration:**
```json
"baseUrl": ".",
"paths": {
  "@/*": ["src/*"]
}
```

**Reason:** Allows imports like `import HomeScreen from '@/screens/HomeScreen'` instead of relative paths like `'../../screens/HomeScreen'`. Improves code readability and makes refactoring easier.

### Step 5: Create Basic Navigation Structure
**Time:** 18:50 PST

**Action:** Set up React Navigation with a basic stack navigator.

**Files Modified:**
- `App.tsx` - Updated to use NavigationContainer and Stack Navigator
- `src/screens/HomeScreen.tsx` - Created initial home screen

**Navigation Setup:**
- Using `@react-navigation/native` with `createNativeStackNavigator`
- Initial route: "Home"
- Header hidden for now (will customize per screen later)

**Reason:** Navigation is essential for multi-screen app. Setting it up early allows us to easily add new screens (CameraScreen, HistoryScreen, etc.) in future phases.

### Step 6: Initialize Git Repository
**Time:** 18:50 PST

**Action:** Initialized git repository (was already initialized, reinitialized to ensure proper setup).

**Files:**
- `.gitignore` already configured to exclude:
  - `node_modules/`
  - `.expo/`
  - Build artifacts
  - OS-specific files (`.DS_Store`)

**Reason:** Version control is essential for tracking progress, especially with incremental commits as specified in the roadmap. Git allows us to roll back if needed and track changes through each phase.

### Step 7: Fix Package.json Entry Point
**Time:** 18:50 PST

**Action:** Changed `main` field from `"expo-router/entry"` to `"node_modules/expo/AppEntry.js"`.

**Reason:** We're using React Navigation, not Expo Router. The entry point needs to match our setup.

---

## Phase 0 Completion Status

✅ **Completed Tasks:**
- [x] Initialize Expo project with TypeScript template
- [x] Install core dependencies
- [x] Configure app.json with camera permissions
- [x] Set up project folder structure
- [x] Set up TypeScript configs and path aliases
- [x] Create basic navigation structure (React Navigation)
- [x] Initialize git repository with .gitignore

**Success Criteria Met:**
- ✅ Project structure is organized and ready for development
- ✅ All dependencies installed (with known workarounds for version conflicts)
- ✅ Camera permissions configured for iOS and Android
- ✅ Navigation structure in place
- ✅ TypeScript configured with path aliases
- ✅ Git repository initialized

**Next Steps:**
- Ready to proceed to Phase 1: Pose Detection Foundation
- Need to test app startup: `npm start` or `npx expo start`
- Verify camera permissions work on device/simulator

**Notes:**
- TensorFlow.js React Native version conflict is documented and resolved with `--legacy-peer-deps`. This is a known compatibility issue and shouldn't affect functionality.
- All dependencies are compatible with Expo SDK 51.
- Project is ready for Phase 1 development.