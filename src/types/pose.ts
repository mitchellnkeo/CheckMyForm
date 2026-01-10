/**
 * ML Kit (BlazePose) keypoint indices
 * ML Kit outputs 33 keypoints (more detailed than MoveNet's 17)
 * We'll map the essential 17 keypoints for compatibility with form analysis
 */
export enum KeypointIndex {
  NOSE = 0,
  LEFT_EYE = 2,
  RIGHT_EYE = 5,
  LEFT_EAR = 7,
  RIGHT_EAR = 8,
  LEFT_SHOULDER = 11,
  RIGHT_SHOULDER = 12,
  LEFT_ELBOW = 13,
  RIGHT_ELBOW = 14,
  LEFT_WRIST = 15,
  RIGHT_WRIST = 16,
  LEFT_HIP = 23,
  RIGHT_HIP = 24,
  LEFT_KNEE = 25,
  RIGHT_KNEE = 26,
  LEFT_ANKLE = 27,
  RIGHT_ANKLE = 28,
}

/**
 * ML Kit keypoint type (from react-native-mlkit-pose-detection)
 */
export interface MLKitKeypoint {
  x: number;
  y: number;
  z?: number; // 3D position (optional)
  likelihood: number; // Confidence score (0-1)
}

/**
 * Single keypoint from MoveNet
 */
export interface Keypoint {
  x: number;
  y: number;
  score: number;
}

/**
 * Full pose detection result
 */
export interface Pose {
  keypoints: Keypoint[];
  score: number; // Overall pose confidence
}

/**
 * Skeleton connection between two keypoints
 */
export interface SkeletonConnection {
  start: KeypointIndex;
  end: KeypointIndex;
}

/**
 * Predefined skeleton connections for drawing
 */
export const SKELETON_CONNECTIONS: SkeletonConnection[] = [
  // Face
  { start: KeypointIndex.LEFT_EYE, end: KeypointIndex.RIGHT_EYE },
  { start: KeypointIndex.LEFT_EYE, end: KeypointIndex.NOSE },
  { start: KeypointIndex.RIGHT_EYE, end: KeypointIndex.NOSE },
  { start: KeypointIndex.LEFT_EAR, end: KeypointIndex.LEFT_EYE },
  { start: KeypointIndex.RIGHT_EAR, end: KeypointIndex.RIGHT_EYE },
  
  // Upper body
  { start: KeypointIndex.LEFT_SHOULDER, end: KeypointIndex.RIGHT_SHOULDER },
  { start: KeypointIndex.LEFT_SHOULDER, end: KeypointIndex.LEFT_ELBOW },
  { start: KeypointIndex.LEFT_ELBOW, end: KeypointIndex.LEFT_WRIST },
  { start: KeypointIndex.RIGHT_SHOULDER, end: KeypointIndex.RIGHT_ELBOW },
  { start: KeypointIndex.RIGHT_ELBOW, end: KeypointIndex.RIGHT_WRIST },
  
  // Torso
  { start: KeypointIndex.LEFT_SHOULDER, end: KeypointIndex.LEFT_HIP },
  { start: KeypointIndex.RIGHT_SHOULDER, end: KeypointIndex.RIGHT_HIP },
  { start: KeypointIndex.LEFT_HIP, end: KeypointIndex.RIGHT_HIP },
  
  // Lower body
  { start: KeypointIndex.LEFT_HIP, end: KeypointIndex.LEFT_KNEE },
  { start: KeypointIndex.LEFT_KNEE, end: KeypointIndex.LEFT_ANKLE },
  { start: KeypointIndex.RIGHT_HIP, end: KeypointIndex.RIGHT_KNEE },
  { start: KeypointIndex.RIGHT_KNEE, end: KeypointIndex.RIGHT_ANKLE },
];
