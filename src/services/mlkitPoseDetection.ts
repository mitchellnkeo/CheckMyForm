import { Pose, Keypoint, KeypointIndex } from '@/types/pose';
import { initializeVisionCameraFrameProcessor } from 'react-native-mlkit-pose-detection';
import type { Frame } from 'react-native-vision-camera';
import type { SKRNMLKitVisionCameraPluginResultPoseItem } from 'react-native-mlkit-pose-detection';

/**
 * Convert ML Kit pose detection results to our pose format
 * This function is worklet-compatible (can be called from frame processor)
 */
function convertMLKitPoseToPose(
  frame: Frame,
  mlkitPose: SKRNMLKitVisionCameraPluginResultPoseItem
): Pose | null {
  'worklet';
  
  const keypoints: Keypoint[] = [];
  let totalScore = 0;
  let validKeypoints = 0;

  // ML Kit keypoint names (BlazePose format - capitalized)
  const keypointMapping: { mlkitKey: string; ourIndex: KeypointIndex }[] = [
    { mlkitKey: 'Nose', ourIndex: KeypointIndex.NOSE },
    { mlkitKey: 'LeftEyeInner', ourIndex: KeypointIndex.LEFT_EYE },
    { mlkitKey: 'RightEyeInner', ourIndex: KeypointIndex.RIGHT_EYE },
    { mlkitKey: 'LeftEar', ourIndex: KeypointIndex.LEFT_EAR },
    { mlkitKey: 'RightEar', ourIndex: KeypointIndex.RIGHT_EAR },
    { mlkitKey: 'LeftShoulder', ourIndex: KeypointIndex.LEFT_SHOULDER },
    { mlkitKey: 'RightShoulder', ourIndex: KeypointIndex.RIGHT_SHOULDER },
    { mlkitKey: 'LeftElbow', ourIndex: KeypointIndex.LEFT_ELBOW },
    { mlkitKey: 'RightElbow', ourIndex: KeypointIndex.RIGHT_ELBOW },
    { mlkitKey: 'LeftWrist', ourIndex: KeypointIndex.LEFT_WRIST },
    { mlkitKey: 'RightWrist', ourIndex: KeypointIndex.RIGHT_WRIST },
    { mlkitKey: 'LeftHip', ourIndex: KeypointIndex.LEFT_HIP },
    { mlkitKey: 'RightHip', ourIndex: KeypointIndex.RIGHT_HIP },
    { mlkitKey: 'LeftKnee', ourIndex: KeypointIndex.LEFT_KNEE },
    { mlkitKey: 'RightKnee', ourIndex: KeypointIndex.RIGHT_KNEE },
    { mlkitKey: 'LeftAnkle', ourIndex: KeypointIndex.LEFT_ANKLE },
    { mlkitKey: 'RightAnkle', ourIndex: KeypointIndex.RIGHT_ANKLE },
  ];

  // Initialize array with 17 keypoints
  for (let i = 0; i < 17; i++) {
    keypoints.push({ x: 0, y: 0, score: 0 });
  }

  // Map ML Kit keypoints to our format
  const frameWidth = frame.width;
  const frameHeight = frame.height;
  
  keypointMapping.forEach(({ mlkitKey, ourIndex }) => {
    const mlkitKeypoint = mlkitPose[mlkitKey as keyof SKRNMLKitVisionCameraPluginResultPoseItem];
    if (mlkitKeypoint && mlkitKeypoint.inFrameLikelihood > 0.3) {
      // ML Kit returns pixel coordinates, normalize to 0-1 for our overlay
      keypoints[ourIndex] = {
        x: mlkitKeypoint.position.x / frameWidth, // Normalized 0-1
        y: mlkitKeypoint.position.y / frameHeight, // Normalized 0-1
        score: mlkitKeypoint.inFrameLikelihood,
      };
      totalScore += mlkitKeypoint.inFrameLikelihood;
      validKeypoints++;
    }
  });

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
}

/**
 * ML Kit Pose Detection Service
 * Uses Google's ML Kit for pose detection (BlazePose model) with Vision Camera
 */
class MLKitPoseDetectionService {
  private isInitialized = false;
  private isLoading = false;

  /**
   * Initialize ML Kit pose detection for Vision Camera
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
      console.log('Initializing ML Kit pose detection for Vision Camera...');
      
      // Initialize Vision Camera frame processor
      await initializeVisionCameraFrameProcessor({
        detectorMode: 'stream', // Use stream mode for real-time detection
        preferredHardwareConfigs: ['GPU'], // Use GPU acceleration
      });
      
      this.isInitialized = true;
      console.log('ML Kit pose detection ready for Vision Camera');
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
   * Process ML Kit pose detection results and convert to our format
   * This is a wrapper that can be called from JS (not worklet)
   * For worklet usage, use convertMLKitPoseToPose directly
   */
  processFrame(frame: Frame, mlkitPoses: SKRNMLKitVisionCameraPluginResultPoseItem[]): Pose | null {
    if (!this.isReady()) {
      return null;
    }

    try {
      if (!mlkitPoses || mlkitPoses.length === 0) {
        return null;
      }

      // Use the first detected pose (ML Kit can detect multiple)
      const mlkitPose = mlkitPoses[0];
      return convertMLKitPoseToPose(frame, mlkitPose);
    } catch (error) {
      console.error('Error processing frame with ML Kit:', error);
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

// Export conversion function for use in frame processors
export { convertMLKitPoseToPose };
