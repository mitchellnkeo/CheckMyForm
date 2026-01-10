import { Pose, Keypoint, KeypointIndex } from '@/types/pose';
import MLKitPoseDetection from 'react-native-mlkit-pose-detection';

/**
 * ML Kit Pose Detection Service
 * Uses Google's ML Kit for pose detection (BlazePose model)
 */
class MLKitPoseDetectionService {
  private isInitialized = false;
  private isLoading = false;

  /**
   * Initialize ML Kit pose detection
   */
  async initialize(): Promise<void> {
    if (this.isInitialized) {
      return;
    }

    if (this.isLoading) {
      throw new Error('ML Kit is already initializing');
    }

    try {
      this.isLoading = true;
      console.log('Initializing ML Kit pose detection...');
      
      // ML Kit doesn't require explicit initialization
      // It initializes on first use
      this.isInitialized = true;
      console.log('ML Kit pose detection ready');
    } catch (error) {
      console.error('Error initializing ML Kit:', error);
      this.isLoading = false;
      throw new Error(
        `Failed to initialize ML Kit: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    } finally {
      this.isLoading = false;
    }
  }

  /**
   * Check if the service is initialized
   */
  isReady(): boolean {
    return this.isInitialized;
  }

  /**
   * Detect pose from an image URI
   * @param imageUri - URI of the image (file:// or local path)
   * @returns Detected pose or null if no pose found
   */
  async detectPose(imageUri: string): Promise<Pose | null> {
    if (!this.isReady()) {
      throw new Error('ML Kit pose detection service not initialized');
    }

    try {
      // ML Kit pose detection
      const poses = await MLKitPoseDetection.detectPose(imageUri);

      if (!poses || poses.length === 0) {
        return null;
      }

      // Use the first detected pose (ML Kit can detect multiple)
      const mlkitPose = poses[0];

      // Convert ML Kit keypoints to our format
      // ML Kit has 33 keypoints, we'll extract the 17 we need
      const keypoints: Keypoint[] = [];
      let totalScore = 0;
      let validKeypoints = 0;

      // Map ML Kit's 33 keypoints to our 17 keypoint indices
      const keypointMapping: { mlkitIndex: number; ourIndex: KeypointIndex }[] = [
        { mlkitIndex: 0, ourIndex: KeypointIndex.NOSE }, // Nose
        { mlkitIndex: 2, ourIndex: KeypointIndex.LEFT_EYE }, // Left eye
        { mlkitIndex: 5, ourIndex: KeypointIndex.RIGHT_EYE }, // Right eye
        { mlkitIndex: 7, ourIndex: KeypointIndex.LEFT_EAR }, // Left ear
        { mlkitIndex: 8, ourIndex: KeypointIndex.RIGHT_EAR }, // Right ear
        { mlkitIndex: 11, ourIndex: KeypointIndex.LEFT_SHOULDER }, // Left shoulder
        { mlkitIndex: 12, ourIndex: KeypointIndex.RIGHT_SHOULDER }, // Right shoulder
        { mlkitIndex: 13, ourIndex: KeypointIndex.LEFT_ELBOW }, // Left elbow
        { mlkitIndex: 14, ourIndex: KeypointIndex.RIGHT_ELBOW }, // Right elbow
        { mlkitIndex: 15, ourIndex: KeypointIndex.LEFT_WRIST }, // Left wrist
        { mlkitIndex: 16, ourIndex: KeypointIndex.RIGHT_WRIST }, // Right wrist
        { mlkitIndex: 23, ourIndex: KeypointIndex.LEFT_HIP }, // Left hip
        { mlkitIndex: 24, ourIndex: KeypointIndex.RIGHT_HIP }, // Right hip
        { mlkitIndex: 25, ourIndex: KeypointIndex.LEFT_KNEE }, // Left knee
        { mlkitIndex: 26, ourIndex: KeypointIndex.RIGHT_KNEE }, // Right knee
        { mlkitIndex: 27, ourIndex: KeypointIndex.LEFT_ANKLE }, // Left ankle
        { mlkitIndex: 28, ourIndex: KeypointIndex.RIGHT_ANKLE }, // Right ankle
      ];

      // Initialize array with 17 keypoints
      for (let i = 0; i < 17; i++) {
        keypoints.push({ x: 0, y: 0, score: 0 });
      }

      // Map ML Kit keypoints to our format
      if (mlkitPose.landmarks && Array.isArray(mlkitPose.landmarks)) {
        keypointMapping.forEach(({ mlkitIndex, ourIndex }) => {
          const mlkitKeypoint = mlkitPose.landmarks[mlkitIndex];
          if (mlkitKeypoint && mlkitKeypoint.likelihood > 0.3) {
            // ML Kit uses normalized coordinates (0-1), convert to pixel coordinates
            // Note: We'll need image dimensions to convert properly
            // For now, using normalized coordinates (will scale in overlay)
            keypoints[ourIndex] = {
              x: mlkitKeypoint.x, // Normalized 0-1
              y: mlkitKeypoint.y, // Normalized 0-1
              score: mlkitKeypoint.likelihood,
            };
            totalScore += mlkitKeypoint.likelihood;
            validKeypoints++;
          }
        });
      }

      // Calculate overall pose score
      const poseScore = validKeypoints > 0 ? totalScore / validKeypoints : 0;

      // Return pose if we have enough valid keypoints
      if (validKeypoints >= 5) {
        return {
          keypoints,
          score: poseScore,
        };
      }

      return null;
    } catch (error) {
      console.error('Error detecting pose with ML Kit:', error);
      return null;
    }
  }

  /**
   * Dispose of resources
   */
  dispose(): void {
    this.isInitialized = false;
  }
}

// Export singleton instance
export const mlkitPoseDetectionService = new MLKitPoseDetectionService();
