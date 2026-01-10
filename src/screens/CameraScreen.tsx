import React, { useEffect, useRef, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Dimensions,
  ActivityIndicator,
  Alert,
  Image,
} from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import * as tf from '@tensorflow/tfjs';
import '@tensorflow/tfjs-react-native';
import * as ImageManipulator from 'expo-image-manipulator';
import { poseDetectionService } from '@/services/poseDetection';
import { Pose } from '@/types/pose';
import PoseOverlay from '@/components/PoseOverlay';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');
const CAMERA_ASPECT_RATIO = 4 / 3; // Standard camera aspect ratio
const CAMERA_WIDTH = SCREEN_WIDTH;
const CAMERA_HEIGHT = SCREEN_WIDTH / CAMERA_ASPECT_RATIO;

// Target FPS for pose detection
// Note: Using lower rate (5 FPS) for MVP with takePictureAsync
// Future: Optimize to 30 FPS using expo-gl texture
const TARGET_FPS = 5; // Reduced for MVP - takePictureAsync is slow
const FRAME_INTERVAL_MS = 1000 / TARGET_FPS;

export default function CameraScreen() {
  const [permission, requestPermission] = useCameraPermissions();
  const [isInitialized, setIsInitialized] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [loadingMessage, setLoadingMessage] = useState('Initializing...');
  const [error, setError] = useState<string | null>(null);
  const [pose, setPose] = useState<Pose | null>(null);
  const [fps, setFps] = useState(0);

  const cameraRef = useRef<CameraView>(null);
  const lastFrameTimeRef = useRef<number>(0);
  const frameCountRef = useRef<number>(0);
  const fpsUpdateIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const processingRef = useRef<boolean>(false);

  // Initialize TensorFlow.js and load model
  useEffect(() => {
    let mounted = true;

    const initialize = async () => {
      try {
        setIsLoading(true);
        setError(null);
        setLoadingMessage('Initializing TensorFlow.js...');

        // Initialize pose detection service with progress callback
        await poseDetectionService.initialize((message) => {
          if (mounted) {
            setLoadingMessage(message);
          }
        });

        if (mounted) {
          setIsInitialized(true);
          setIsLoading(false);
          console.log('Pose detection initialized successfully');
        }
      } catch (err) {
        console.error('Initialization error:', err);
        if (mounted) {
          setError(
            err instanceof Error
              ? err.message
              : 'Failed to initialize pose detection'
          );
          setIsLoading(false);
          Alert.alert(
            'Initialization Error',
            'Failed to load pose detection model. Please restart the app.',
            [{ text: 'OK' }]
          );
        }
      }
    };

    initialize();

    return () => {
      mounted = false;
      // Cleanup on unmount
      poseDetectionService.dispose();
    };
  }, []);

  // FPS counter update
  useEffect(() => {
    fpsUpdateIntervalRef.current = setInterval(() => {
      setFps(frameCountRef.current);
      frameCountRef.current = 0;
    }, 1000);

    return () => {
      if (fpsUpdateIntervalRef.current) {
        clearInterval(fpsUpdateIntervalRef.current);
      }
    };
  }, []);

  // Start frame processing when camera is ready
  useEffect(() => {
    if (!isInitialized) {
      return;
    }

    const frameProcessor = setInterval(() => {
      processFrame();
    }, FRAME_INTERVAL_MS);

    return () => {
      clearInterval(frameProcessor);
    };
  }, [isInitialized, processFrame]);

  // Process camera frame for pose detection
  const processFrame = useCallback(async () => {
    if (!isInitialized || !cameraRef.current || processingRef.current) {
      return;
    }

    const now = Date.now();
    const timeSinceLastFrame = now - lastFrameTimeRef.current;

    // Throttle to target FPS
    if (timeSinceLastFrame < FRAME_INTERVAL_MS) {
      return;
    }

    processingRef.current = true;
    lastFrameTimeRef.current = now;

    try {
      // Capture frame from camera using takePictureAsync
      // NOTE: This is an MVP approach - takePictureAsync is slow (200-500ms per frame)
      // Processing at 5 FPS to avoid overwhelming the device
      // TODO: Optimize using expo-gl texture for real-time processing at 30 FPS
      
      const photo = await cameraRef.current.takePictureAsync({
        quality: 0.3, // Lower quality for faster processing
        base64: true,
        skipProcessing: true, // Skip processing for speed
        exif: false,
      });

      if (!photo || !photo.uri || !photo.base64) {
        processingRef.current = false;
        return;
      }

      // Resize image to model input size (256x256) for faster processing
      const manipulatedImage = await ImageManipulator.manipulateAsync(
        photo.uri,
        [{ resize: { width: 256, height: 256 } }],
        { 
          compress: 0.8, 
          format: ImageManipulator.SaveFormat.JPEG, 
          base64: true 
        }
      );

      if (!manipulatedImage.base64) {
        processingRef.current = false;
        return;
      }

      // Convert base64 image to tensor
      // Using a React Native compatible approach with Image component
      // This is a workaround - proper solution would use expo-gl texture
      const imageDataUri = `data:image/jpeg;base64,${manipulatedImage.base64}`;
      
      // Load image using React Native Image component
      return new Promise<void>((resolve) => {
        Image.getSize(
          imageDataUri,
          async (width, height) => {
            try {
              // For React Native, we need to use a different approach
              // Using fetch to get image data, then converting
              // Note: This is a simplified approach - may need optimization
              const response = await fetch(imageDataUri);
              const arrayBuffer = await response.arrayBuffer();
              const uint8Array = new Uint8Array(arrayBuffer);
              
              // Create image tensor from pixel data
              // This is a placeholder - actual implementation needs proper pixel extraction
              // For now, logging that we need to implement proper tensor conversion
              console.log('Frame captured, need to implement tensor conversion');
              
              // TODO: Implement proper image to tensor conversion for React Native
              // Options: expo-gl texture, react-native-image-to-tensor, or custom solution
              
              frameCountRef.current++;
              processingRef.current = false;
              resolve();
            } catch (tensorError) {
              console.error('Error processing image:', tensorError);
              processingRef.current = false;
              resolve();
            }
          },
          (error) => {
            console.error('Error getting image size:', error);
            processingRef.current = false;
            resolve();
          }
        );
      });
    } catch (err) {
      console.error('Error processing frame:', err);
      processingRef.current = false;
    }
  }, [isInitialized]);

  // Request camera permission
  if (!permission) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" />
        <Text style={styles.text}>Requesting camera permission...</Text>
      </View>
    );
  }

  if (!permission.granted) {
    return (
      <View style={styles.container}>
        <Text style={styles.text}>Camera permission is required</Text>
        <Text
          style={[styles.text, styles.button]}
          onPress={requestPermission}
        >
          Grant Permission
        </Text>
      </View>
    );
  }

  if (isLoading) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color="#00FF00" />
        <Text style={styles.text}>{loadingMessage}</Text>
        <Text style={styles.hintText}>
          First load may take 30-60 seconds{'\n'}
          (downloading ~7MB model)
        </Text>
        {error && <Text style={styles.errorText}>{error}</Text>}
      </View>
    );
  }

  if (error && !isInitialized) {
    return (
      <View style={styles.container}>
        <Text style={styles.errorText}>{error}</Text>
        <Text style={styles.text}>Please restart the app</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <CameraView
        ref={cameraRef}
        style={styles.camera}
        facing="front"
      >
        <PoseOverlay
          pose={pose}
          width={CAMERA_WIDTH}
          height={CAMERA_HEIGHT}
          modelInputSize={256}
        />
      </CameraView>

      {/* FPS Counter */}
      <View style={styles.fpsContainer}>
        <Text style={styles.fpsText}>FPS: {fps}</Text>
      </View>

      {/* Pose Score Indicator */}
      {pose && (
        <View style={styles.scoreContainer}>
          <Text style={styles.scoreText}>
            Confidence: {(pose.score * 100).toFixed(0)}%
          </Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
    justifyContent: 'center',
    alignItems: 'center',
  },
  camera: {
    width: CAMERA_WIDTH,
    height: CAMERA_HEIGHT,
  },
  text: {
    color: '#fff',
    fontSize: 16,
    marginTop: 20,
  },
  errorText: {
    color: '#ff0000',
    fontSize: 16,
    marginTop: 20,
    textAlign: 'center',
    paddingHorizontal: 20,
  },
  button: {
    marginTop: 20,
    padding: 10,
    backgroundColor: '#00FF00',
    borderRadius: 5,
    color: '#000',
  },
  fpsContainer: {
    position: 'absolute',
    top: 50,
    left: 20,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    padding: 10,
    borderRadius: 5,
  },
  fpsText: {
    color: '#00FF00',
    fontSize: 16,
    fontWeight: 'bold',
  },
  scoreContainer: {
    position: 'absolute',
    top: 100,
    left: 20,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    padding: 10,
    borderRadius: 5,
  },
  scoreText: {
    color: '#00FF00',
    fontSize: 14,
  },
  hintText: {
    color: '#999',
    fontSize: 12,
    marginTop: 10,
    textAlign: 'center',
    paddingHorizontal: 20,
  },
});
