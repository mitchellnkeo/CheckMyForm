/**
 * MoveNet keypoint indices
 * MoveNet Lightning outputs 17 keypoints
 */
export enum KeypointIndex {
  NOSE = 0,
  LEFT_EYE = 1,
  RIGHT_EYE = 2,
  LEFT_EAR = 3,
  RIGHT_EAR = 4,
  LEFT_SHOULDER = 5,
  RIGHT_SHOULDER = 6,
  LEFT_ELBOW = 7,
  RIGHT_ELBOW = 8,
  LEFT_WRIST = 9,
  RIGHT_WRIST = 10,
  LEFT_HIP = 11,
  RIGHT_HIP = 12,
  LEFT_KNEE = 13,
  RIGHT_KNEE = 14,
  LEFT_ANKLE = 15,
  RIGHT_ANKLE = 16,
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
