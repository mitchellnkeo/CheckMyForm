import * as tf from '@tensorflow/tfjs';
import '@tensorflow/tfjs-react-native';
import { bundleResourceIO } from '@tensorflow/tfjs-react-native';
import { Pose, Keypoint } from '@/types/pose';

/**
 * MoveNet Lightning model URL from TensorFlow Hub
 * Using the Lightning version for faster inference (30+ FPS)
 */
const MOVENET_LIGHTNING_MODEL_URL =
  'https://tfhub.dev/google/tfjs-model/movenet/singlepose/lightning/4';

/**
 * Minimum confidence threshold for keypoints
 */
const MIN_KEYPOINT_SCORE = 0.3;

/**
 * Input image size for MoveNet Lightning (256x256)
 */
const MODEL_INPUT_SIZE = 256;

class PoseDetectionService {
  private model: tf.GraphModel | null = null;
  private isInitialized = false;
  private isLoading = false;

  /**
   * Initialize TensorFlow.js and load the MoveNet model
   */
  async initialize(): Promise<void> {
    if (this.isInitialized) {
      return;
    }

    if (this.isLoading) {
      throw new Error('Model is already loading');
    }

    try {
      this.isLoading = true;

      // Initialize TensorFlow.js for React Native
      await tf.ready();

      // Load MoveNet Lightning model
      console.log('Loading MoveNet Lightning model...');
      this.model = await tf.loadGraphModel(MOVENET_LIGHTNING_MODEL_URL, {
        fromTFHub: true,
      });

      console.log('MoveNet Lightning model loaded successfully');
      this.isInitialized = true;
    } catch (error) {
      console.error('Error initializing pose detection:', error);
      this.isLoading = false;
      throw new Error(
        `Failed to initialize pose detection: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    } finally {
      this.isLoading = false;
    }
  }

  /**
   * Check if the service is initialized
   */
  isReady(): boolean {
    return this.isInitialized && this.model !== null;
  }

  /**
   * Detect pose from an image tensor
   * @param imageTensor - Image tensor (will be resized to 256x256)
   * @returns Detected pose or null if no pose found
   */
  async detectPose(imageTensor: tf.Tensor3D): Promise<Pose | null> {
    if (!this.isReady() || !this.model) {
      throw new Error('Pose detection service not initialized');
    }

    try {
      // Resize image to model input size (256x256)
      const resized = tf.image.resizeBilinear(imageTensor, [
        MODEL_INPUT_SIZE,
        MODEL_INPUT_SIZE,
      ]);

      // Normalize to [0, 1] range
      const normalized = resized.div(255.0);

      // Add batch dimension: [1, 256, 256, 3]
      const batched = normalized.expandDims(0);

      // Run inference
      const predictions = this.model.predict(batched) as tf.Tensor;

      // Get keypoints from predictions
      const keypointsData = await predictions.data();

      // Clean up tensors
      resized.dispose();
      normalized.dispose();
      batched.dispose();
      predictions.dispose();

      // Parse keypoints
      const keypoints: Keypoint[] = [];
      let totalScore = 0;
      let validKeypoints = 0;

      // MoveNet outputs keypoints in format: [y1, x1, score1, y2, x2, score2, ...]
      // The output shape is [1, 1, 17, 3] where 17 is number of keypoints and 3 is [y, x, score]
      const keypointsArray = Array.from(keypointsData);
      
      for (let i = 0; i < 17; i++) {
        const y = keypointsArray[i * 3];
        const x = keypointsArray[i * 3 + 1];
        const score = keypointsArray[i * 3 + 2];

        if (score > MIN_KEYPOINT_SCORE) {
          keypoints.push({ x, y, score });
          totalScore += score;
          validKeypoints++;
        } else {
          keypoints.push({ x: 0, y: 0, score: 0 });
        }
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
      console.error('Error detecting pose:', error);
      return null;
    }
  }

  /**
   * Dispose of the model and free resources
   */
  dispose(): void {
    if (this.model) {
      this.model.dispose();
      this.model = null;
      this.isInitialized = false;
    }
  }
}

// Export singleton instance
export const poseDetectionService = new PoseDetectionService();
