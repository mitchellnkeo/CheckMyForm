import React, { useEffect, useRef, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Dimensions,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import * as tf from '@tensorflow/tfjs';
import '@tensorflow/tfjs-react-native';
import { poseDetectionService } from '@/services/poseDetection';
import { Pose } from '@/types/pose';
import PoseOverlay from '@/components/PoseOverlay';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');
const CAMERA_ASPECT_RATIO = 4 / 3; // Standard camera aspect ratio
const CAMERA_WIDTH = SCREEN_WIDTH;
const CAMERA_HEIGHT = SCREEN_WIDTH / CAMERA_ASPECT_RATIO;

// Target FPS for pose detection
const TARGET_FPS = 30;
const FRAME_INTERVAL_MS = 1000 / TARGET_FPS;

export default function CameraScreen() {
  const [permission, requestPermission] = useCameraPermissions();
  const [isInitialized, setIsInitialized] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
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

        // Initialize pose detection service
        await poseDetectionService.initialize();

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
      // Note: For real-time processing, we'll need to use expo-gl texture
      // For now, this is a placeholder that will be optimized in next iteration
      // The actual implementation will use GL texture to get frames efficiently
      
      // TODO: Implement frame capture using expo-gl texture
      // For MVP, we'll process frames less frequently to avoid performance issues
      
      frameCountRef.current++;
    } catch (err) {
      console.error('Error processing frame:', err);
    } finally {
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
        <Text style={styles.text}>Loading pose detection model...</Text>
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
});
