# CheckMyForm AI - Development Roadmap

## Project Overview

**Goal:** Build a production-ready React Native mobile app that uses computer vision to analyze workout form in real-time, count reps, and provide instant feedback. Be sure to build slowly and commit in increments so as to now crash the Mac laptop that the app is being built on. Document everything being done in BuildJournal.md. Ensure each step works before moving on to the next step.

**Target Users:** Fitness enthusiasts, beginners learning proper form, home workout practitioners

**Tech Stack:**
- React Native + Expo (SDK 51+)
- TensorFlow.js with MoveNet Lightning (on-device pose detection)
- TypeScript
- Zustand (state management)
- Expo SQLite (local storage)
- Expo Camera + Reanimated 3

**Why MoveNet Lightning:**
- Fast inference (30+ FPS on modern devices)
- Runs entirely on-device (no API costs, works offline)
- Small model size (~7MB)
- Well-documented with React Native integration
- 17 keypoint detection (sufficient for form analysis)

---

## Phase 0: Project Setup & Environment Configuration

**Objective:** Get the development environment ready and project scaffolded

### Tasks:
- [ ] Initialize Expo project with TypeScript template
  ```bash
  npx create-expo-app@latest CheckMyFormAI --template expo-template-blank-typescript
  ```
- [ ] Install core dependencies:
  ```bash
  npx expo install expo-camera expo-gl @tensorflow/tfjs @tensorflow/tfjs-react-native @react-native-async-storage/async-storage expo-gl-cpp
  npx expo install zustand expo-sqlite expo-haptics expo-av
  npx expo install react-native-reanimated react-native-gesture-handler
  ```
- [ ] Configure app.json with camera permissions
- [ ] Set up project folder structure:
  ```
  src/
  ├── screens/
  ├── components/
  ├── services/
  ├── utils/
  ├── stores/
  ├── types/
  └── constants/
  ```
- [ ] Set up TypeScript configs and path aliases
- [ ] Create basic navigation structure (React Navigation)
- [ ] Initialize git repository with .gitignore

**Success Criteria:**
- App runs on device/simulator
- Camera permissions working
- Navigation between screens functional

---

## Phase 1: Pose Detection Foundation

**Objective:** Get MoveNet working with live camera feed and visualize keypoints

### Tasks:
- [ ] Initialize TensorFlow.js in app
- [ ] Load MoveNet Lightning model
- [ ] Set up Expo Camera with proper aspect ratio
- [ ] Implement pose detection on camera frames
  - Create `services/poseDetection.ts`
  - Handle model loading and inference
  - Process frames at target FPS (aim for 30)
- [ ] Create `PoseOverlay.tsx` component to draw keypoints
  - Use React Native SVG or Canvas
  - Draw 17 keypoints as circles
  - Draw skeleton connections between keypoints
- [ ] Add FPS counter for performance monitoring
- [ ] Implement basic error handling for model loading failures

**Key Files to Create:**
- `src/services/poseDetection.ts`
- `src/components/PoseOverlay.tsx`
- `src/screens/CameraScreen.tsx`
- `src/types/pose.ts`

**Success Criteria:**
- Camera feed displays smoothly
- Keypoints overlay on person in frame
- Maintains 25-30 FPS
- Keypoints track body movement accurately

**Technical Notes:**
- MoveNet outputs 17 keypoints: nose, eyes, ears, shoulders, elbows, wrists, hips, knees, ankles
- Each keypoint has: {x, y, score} where score is confidence (0-1)
- Only use keypoints with confidence > 0.3

---

## Phase 2: Angle Calculation & Form Analysis

**Objective:** Build the math/logic to analyze form from pose keypoints

### Tasks:
- [ ] Create angle calculation utilities
  - `src/utils/angleCalculations.ts`
  - Calculate angle between three points (e.g., hip-knee-ankle)
  - Implement vector math for body alignment checks
- [ ] Build form analysis for SQUATS
  - `src/services/formAnalysis/squatAnalysis.ts`
  - Track hip angle (target: < 90° at bottom)
  - Check knee position relative to toes
  - Monitor back angle (keep straight)
  - Detect squat depth
- [ ] Implement form scoring algorithm
  - Score each form metric (0-100)
  - Weight different factors (depth 40%, knee tracking 30%, back 30%)
  - Calculate overall form score
- [ ] Create form feedback messaging
  - `src/utils/feedbackMessages.ts`
  - Map form issues to user-friendly messages
  - "Go deeper", "Keep back straight", "Perfect form!"

**Key Files to Create:**
- `src/utils/angleCalculations.ts`
- `src/services/formAnalysis/squatAnalysis.ts`
- `src/services/formAnalysis/types.ts`
- `src/utils/feedbackMessages.ts`

**Success Criteria:**
- Accurate angle calculations from keypoints
- Form score updates in real-time
- Feedback messages are specific and helpful
- Can detect good vs bad form consistently

**Form Analysis Details for Squats:**
```typescript
// Key angles to track:
- hipAngle = angle(shoulder, hip, knee)
  Good: < 90°, Great: < 80°
- kneeAngle = angle(hip, knee, ankle)
  Good: 80-100°
- backAngle = angle(vertical, shoulder, hip)
  Good: < 15° from vertical
```

---

## Phase 3: Rep Counting Logic

**Objective:** Automatically count reps and detect full range of motion

### Tasks:
- [ ] Implement state machine for rep detection
  - `src/services/repCounter.ts`
  - States: STANDING → DESCENDING → BOTTOM → ASCENDING → STANDING
  - Transition based on hip/knee angles
- [ ] Add hysteresis to prevent false counts
  - Require angle thresholds with buffers
  - Minimum time in each state
- [ ] Detect full range of motion
  - Mark "half reps" vs full reps
  - Track depth achieved per rep
- [ ] Create rep counter UI component
  - `src/components/RepCounter.tsx`
  - Large, visible count display
  - Visual feedback for rep completion
- [ ] Add audio/haptic feedback
  - Haptic on rep count
  - Optional audio cue

**Key Files to Create:**
- `src/services/repCounter.ts`
- `src/components/RepCounter.tsx`
- `src/types/workout.ts`

**Success Criteria:**
- Accurately counts reps (95%+ accuracy)
- No false positives from small movements
- Distinguishes full reps from partial reps
- Feedback is immediate and satisfying

**State Machine Logic:**
```typescript
// Squat state transitions:
STANDING (hip angle > 160°)
  → DESCENDING (hip angle decreasing)
    → BOTTOM (hip angle < 90°, stable for 0.2s)
      → ASCENDING (hip angle increasing)
        → STANDING (hip angle > 160°) [COUNT REP]
```

---

## Phase 4: Multi-Exercise Support

**Objective:** Add push-ups and planks with exercise-specific logic

### Tasks:
- [ ] Create exercise selection screen
  - List of available exercises
  - Show exercise demo GIF/video
  - Exercise description and form cues
- [ ] Implement PUSH-UP analysis
  - `src/services/formAnalysis/pushupAnalysis.ts`
  - Track elbow angle (target 90° at bottom)
  - Check body alignment (straight line)
  - Monitor elbow flare angle
  - Rep counting state machine
- [ ] Implement PLANK analysis
  - `src/services/formAnalysis/plankAnalysis.ts`
  - Track hip height (maintain straight line)
  - Monitor back straightness
  - Time-based tracking (no reps)
  - Alert on form breakdown
- [ ] Create exercise-agnostic camera screen
  - Switch analysis based on selected exercise
  - Different UI overlays per exercise type
  - Unified feedback system
- [ ] Add exercise switching during workout (optional)

**Key Files to Create:**
- `src/screens/ExerciseSelectionScreen.tsx`
- `src/services/formAnalysis/pushupAnalysis.ts`
- `src/services/formAnalysis/plankAnalysis.ts`
- `src/services/exerciseManager.ts`

**Success Criteria:**
- Three exercises fully functional
- Smooth switching between exercises
- Each exercise has appropriate form checks
- UI adapts to exercise type (rep count vs timer)

**Push-up Form Analysis:**
```typescript
- elbowAngle = angle(shoulder, elbow, wrist)
  Bottom: 80-100°, Top: 160-180°
- bodyAlignment = check hip/shoulder/ankle line
  Good: < 15° deviation
- elbowFlare = angle between elbow-shoulder and vertical
  Good: < 45°
```

**Plank Form Analysis:**
```typescript
- hipHeight = relative position of hip to shoulder/ankle
  Good: within 10% of straight line
- backAngle = curvature check
  Good: < 10° deviation
- holdTime = duration with good form
```

---

## Phase 5: Workout History & Data Persistence

**Objective:** Save workout sessions and display progress over time

### Tasks:
- [ ] Set up Zustand store for workout state
  - `src/stores/workoutStore.ts`
  - Current session data
  - Exercise settings
  - User preferences
- [ ] Implement SQLite database schema
  - `src/services/database.ts`
  - Tables: workouts, exercises, reps
  - Methods: save, query, delete
- [ ] Create workout session model
  - Track: date, exercise, rep count, form scores, duration
  - Calculate session statistics
- [ ] Build workout history screen
  - `src/screens/HistoryScreen.tsx`
  - List of past workouts
  - Filter by exercise type
  - Simple statistics (total reps, avg form score)
- [ ] Add workout detail view
  - Show rep-by-rep breakdown
  - Form score graph
  - Notes/observations
- [ ] Implement data export (optional)
  - Export to CSV/JSON

**Key Files to Create:**
- `src/stores/workoutStore.ts`
- `src/services/database.ts`
- `src/screens/HistoryScreen.tsx`
- `src/screens/WorkoutDetailScreen.tsx`
- `src/types/database.ts`

**Success Criteria:**
- Workouts persist after app restart
- History loads quickly
- Can view past performance
- Data is organized and readable

**Database Schema:**
```sql
CREATE TABLE workouts (
  id INTEGER PRIMARY KEY,
  exercise_type TEXT,
  date TEXT,
  duration INTEGER,
  total_reps INTEGER,
  avg_form_score REAL
);

CREATE TABLE reps (
  id INTEGER PRIMARY KEY,
  workout_id INTEGER,
  rep_number INTEGER,
  form_score REAL,
  depth REAL,
  timestamp TEXT,
  FOREIGN KEY (workout_id) REFERENCES workouts(id)
);
```

---

## Phase 6: UX Polish & Onboarding

**Objective:** Make the app delightful to use and easy to understand

### Tasks:
- [ ] Create onboarding flow
  - `src/screens/OnboardingScreen.tsx`
  - Welcome screen
  - Camera permission request with context
  - Exercise demo carousel
  - Phone positioning guide
- [ ] Add camera setup guide
  - Show proper phone placement
  - Distance from camera (6-8 feet)
  - Angle recommendations
  - Full body visibility check
- [ ] Implement countdown timer before workout starts
  - 3-2-1 countdown with visual/audio
  - Give user time to get in position
- [ ] Add pause/resume functionality
  - Pause button during workout
  - Resume with countdown
- [ ] Create settings screen
  - Toggle audio feedback
  - Toggle haptic feedback
  - Adjust form strictness (beginner/advanced)
  - Dark/light mode
- [ ] Add empty states
  - No workout history yet
  - Camera not detecting person
  - Poor lighting conditions
- [ ] Implement loading states
  - Model loading indicator
  - Skeleton screens for history
- [ ] Add smooth animations
  - Use Reanimated 3 for transitions
  - Fade in/out feedback messages
  - Smooth rep counter increment
- [ ] Design app icon and splash screen

**Key Files to Create:**
- `src/screens/OnboardingScreen.tsx`
- `src/screens/SettingsScreen.tsx`
- `src/components/SetupGuide.tsx`
- `src/components/CountdownTimer.tsx`
- `src/components/EmptyState.tsx`

**Success Criteria:**
- New users understand how to use the app
- Loading states prevent confusion
- Animations feel smooth and natural
- Settings persist across sessions
- App feels professional and polished

---

## Phase 7: Performance Optimization

**Objective:** Ensure smooth performance across devices

### Tasks:
- [ ] Optimize ML inference pipeline
  - Reduce frame processing to necessary FPS (don't process every frame)
  - Use requestAnimationFrame for smooth updates
  - Debounce expensive calculations
- [ ] Implement performance monitoring
  - Track FPS in production
  - Monitor memory usage
  - Log frame processing time
- [ ] Optimize bundle size
  - Use Hermes engine
  - Enable minification
  - Lazy load non-critical components
- [ ] Add device capability detection
  - Adjust quality settings for older devices
  - Fallback to lower FPS if needed
- [ ] Implement memory leak prevention
  - Proper cleanup of TensorFlow tensors
  - Dispose of unused model resources
  - Clear camera buffers
- [ ] Test on multiple devices
  - iOS: iPhone 12 or newer (recommended)
  - Android: Devices with 4GB+ RAM
  - Document minimum requirements

**Success Criteria:**
- Maintains 25-30 FPS on target devices
- No memory leaks during extended use
- Smooth animations even during ML inference
- App bundle < 50MB
- Fast cold start time (< 3 seconds)

**Performance Targets:**
```
- Frame processing: < 33ms (30 FPS)
- Model inference: < 25ms
- UI render time: < 16ms (60 FPS)
- Memory usage: < 250MB
- Cold start: < 3 seconds
```

---

## Phase 8: Testing & Bug Fixes

**Objective:** Ensure reliability and handle edge cases

### Tasks:
- [ ] Test different body types
  - Different heights
  - Various body proportions
  - Different clothing
- [ ] Test lighting conditions
  - Bright outdoor light
  - Indoor gym lighting
  - Low light scenarios
- [ ] Test camera angles
  - Side view (primary)
  - Slight angle variations
  - Suboptimal positioning
- [ ] Handle edge cases
  - Multiple people in frame (ignore extras)
  - No person detected (show guidance)
  - Person partially out of frame
  - Camera blocked/covered
- [ ] Add error boundaries
  - Graceful fallback for crashes
  - User-friendly error messages
  - Automatic error reporting (optional)
- [ ] Fix identified bugs
  - Prioritize by severity
  - Test fixes on multiple devices
- [ ] Accessibility testing
  - VoiceOver/TalkBack support
  - Sufficient contrast ratios
  - Large touch targets

**Success Criteria:**
- No critical bugs remain
- App handles edge cases gracefully
- Works in 90%+ of realistic conditions
- Error messages are helpful
- Accessible to users with disabilities

---

## Phase 9: Production Build & Deployment Prep

**Objective:** Prepare app for distribution (TestFlight/Play Store or portfolio demo)

### Tasks:
- [ ] Set up EAS Build
  - Configure eas.json
  - Create development and production profiles
  - Set up signing credentials
- [ ] Create production build
  - iOS: `eas build --platform ios`
  - Android: `eas build --platform android`
- [ ] Test production builds thoroughly
  - Install on real devices
  - Verify all features work
  - Check performance
- [ ] Create app store assets
  - Screenshots (5.5", 6.5" for iOS)
  - App icon (1024x1024)
  - Feature graphic (Android)
  - App preview video (optional)
- [ ] Write app store description
  - Clear value proposition
  - Feature list
  - Keywords for SEO
- [ ] Create privacy policy
  - Camera usage explanation
  - Data storage (local only)
  - No data sharing
- [ ] Set up TestFlight (iOS) or Internal Testing (Android)
  - Invite beta testers
  - Gather feedback
  - Iterate based on feedback
- [ ] (Optional) Submit to app stores
  - Follow platform guidelines
  - Respond to review feedback

**Success Criteria:**
- Production build installs and runs properly
- All assets look professional
- Privacy policy is clear and compliant
- Beta testers can access the app

---

## Phase 10: Portfolio Documentation

**Objective:** Create materials to showcase this project to potential employers

### Tasks:
- [ ] Create comprehensive GitHub README
  - Project overview and value prop
  - Technical architecture diagram
  - Key features with screenshots
  - Technologies used
  - Setup instructions
  - Future roadmap
- [ ] Record demo video
  - 60-90 second showcase
  - Show key features in action
  - Highlight form analysis
  - Display UI polish
- [ ] Write technical blog post
  - "Building Form Check AI: Real-time Pose Detection with React Native"
  - Explain technical challenges solved
  - Share performance optimizations
  - Include code snippets
- [ ] Create slide deck for interviews
  - Problem statement
  - Solution overview
  - Technical implementation
  - Results/metrics
  - Lessons learned
  - Future improvements
- [ ] Document key metrics
  - Pose detection FPS: [target 30]
  - Rep counting accuracy: [target 95%+]
  - App bundle size: [target < 50MB]
  - Cold start time: [target < 3s]
- [ ] Prepare talking points
  - Why this tech stack?
  - How did you handle X challenge?
  - What would you do differently?
  - How would you scale this?

**Deliverables:**
- GitHub repo with comprehensive README
- Demo video uploaded (YouTube/LinkedIn)
- Blog post published (Medium/Dev.to)
- Slide deck (PDF/Google Slides)
- Live demo build (APK/TestFlight link)

**Portfolio Repository Structure:**
```
README.md
├── Overview
├── Features
├── Technical Architecture
├── Technologies Used
├── Key Challenges & Solutions
├── Performance Metrics
├── Screenshots
├── Demo Video
├── Setup Instructions
└── Future Roadmap

/docs
├── ARCHITECTURE.md
├── API.md
└── CONTRIBUTING.md

/demo
├── demo-video.mp4
└── screenshots/
```

---

## Success Metrics

**Technical Metrics:**
- Pose detection FPS: 25-30 (on iPhone 12+, Pixel 5+)
- Rep counting accuracy: 95%+ for proper form
- Form analysis accuracy: 90%+ correlation with trainer feedback
- App bundle size: < 50MB
- Cold start time: < 3 seconds

**User Experience Metrics:**
- Time to first workout: < 2 minutes (including onboarding)
- App crash rate: < 1%
- User can complete workout without confusion

**Portfolio Impact Metrics:**
- Demo is impressive in first 10 seconds
- Technical depth is clear to hiring managers
- Shows end-to-end product thinking
- Demonstrates production-quality code

---

## Future Roadmap (Post-MVP)

Ideas to mention in interviews but not build yet:

**Phase 11+: Advanced Features**
- More exercises (deadlifts, lunges, bicep curls, etc.)
- Video recording of workouts with pose overlay
- Social features (share workouts, compete with friends)
- AI coach mode (real-time voice coaching)
- Integration with fitness trackers (Apple Health, Google Fit)
- Progress analytics and insights
- Custom workout programs
- Multi-person detection for group workouts
- Cloud sync across devices
- Web dashboard for detailed analytics

---

## Development Tips for Cursor AI

**When implementing each phase:**
1. Create types first (in `src/types/`)
2. Build services/utils with clear interfaces
3. Create components that consume services
4. Wire up to screens
5. Test thoroughly before moving to next phase

**Code Quality Standards:**
- Use TypeScript strictly (no `any` types)
- Write JSDoc comments for complex functions
- Keep components small and focused
- Separate business logic from UI
- Use custom hooks for reusable logic
- Follow React Native best practices
- Use meaningful variable names

**Git Workflow:**
- Create branch for each phase: `phase-1-pose-detection`
- Commit frequently with clear messages
- Merge to main after phase completion
- Tag releases: `v0.1.0-phase-1`

**Testing Strategy:**
- Manual testing on real device (required for camera/ML)
- Test each exercise thoroughly
- Verify on both iOS and Android
- Test edge cases early

---

## Estimated Timeline

- **Phase 0:** 1 day
- **Phase 1:** 2-3 days
- **Phase 2:** 2-3 days
- **Phase 3:** 2-3 days
- **Phase 4:** 3-4 days
- **Phase 5:** 2 days
- **Phase 6:** 3-4 days
- **Phase 7:** 2-3 days
- **Phase 8:** 3-4 days
- **Phase 9:** 2-3 days
- **Phase 10:** 2-3 days

**Total: 3-4 weeks** for a production-ready portfolio piece

---

## Resources

**Documentation:**
- [TensorFlow.js React Native](https://www.tensorflow.org/js/tutorials/setup)
- [MoveNet Model Guide](https://www.tensorflow.org/hub/tutorials/movenet)
- [Expo Camera](https://docs.expo.dev/versions/latest/sdk/camera/)
- [React Native Reanimated](https://docs.swmansion.com/react-native-reanimated/)

**Helpful Examples:**
- TensorFlow.js pose detection examples
- MoveNet demos on TF Hub
- React Native camera ML projects

**Community:**
- React Native Discord
- TensorFlow.js GitHub discussions
- Expo Forums

---

## Notes

- Focus on getting Phase 1 working well before moving on
- It's okay to simplify form analysis initially (can always improve)
- Test on a real device as early as possible (ML + camera doesn't work well in simulator)
- Keep the UI simple - users should focus on their workout, not the app
- Document challenges and solutions for your blog post
- Take screenshots and videos throughout development for portfolio materials

Good luck building! 🚀