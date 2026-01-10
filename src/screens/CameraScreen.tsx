import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Dimensions,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { Camera, useCameraDevice, useFrameProcessor } from 'react-native-vision-camera';
import { useSharedValue, runOnJS } from 'react-native-reanimated';
import { scanSKRNMLKitPose } from 'react-native-mlkit-pose-detection';
import { mlkitPoseDetectionService, convertMLKitPoseToPose } from '@/services/mlkitPoseDetection';
import { Pose } from '@/types/pose';
import PoseOverlay from '@/components/PoseOverlay';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');
const CAMERA_ASPECT_RATIO = 4 / 3; // Standard camera aspect ratio
const CAMERA_WIDTH = SCREEN_WIDTH;
const CAMERA_HEIGHT = SCREEN_WIDTH / CAMERA_ASPECT_RATIO;

export default function CameraScreen() {
  const device = useCameraDevice('front');
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const [isInitialized, setIsInitialized] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [loadingMessage, setLoadingMessage] = useState('Initializing...');
  const [error, setError] = useState<string | null>(null);
  const pose = useSharedValue<Pose | null>(null);
  const [fps, setFps] = useState(0);

  const frameCountRef = useRef<number>(0);
  const fpsUpdateIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Request camera permission
  useEffect(() => {
    (async () => {
      const status = await Camera.requestCameraPermission();
      setHasPermission(status === 'granted');
    })();
  }, []);

  // Initialize ML Kit pose detection
  useEffect(() => {
    let mounted = true;

    const initialize = async () => {
      try {
        setIsLoading(true);
        setError(null);
        setLoadingMessage('Initializing ML Kit...');

        // Initialize ML Kit pose detection service
        await mlkitPoseDetectionService.initialize();

        if (mounted) {
          setIsInitialized(true);
          setIsLoading(false);
          setLoadingMessage('ML Kit ready!');
          console.log('ML Kit pose detection initialized successfully');
        }
      } catch (err) {
        console.error('Initialization error:', err);
        if (mounted) {
          setError(
            err instanceof Error
              ? err.message
              : 'Failed to initialize ML Kit pose detection'
          );
          setIsLoading(false);
          Alert.alert(
            'Initialization Error',
            'Failed to initialize ML Kit. Please restart the app.',
            [{ text: 'OK' }]
          );
        }
      }
    };

    if (hasPermission === true) {
      initialize();
    }

    return () => {
      mounted = false;
      // Cleanup on unmount
      mlkitPoseDetectionService.dispose();
    };
  }, [hasPermission]);

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

  // Update pose state from shared value (for UI rendering)
  const [poseState, setPoseState] = useState<Pose | null>(null);
  
  const updatePose = (newPose: Pose | null) => {
    'worklet';
    pose.value = newPose;
    runOnJS(setPoseState)(newPose);
  };

  // Vision Camera frame processor for real-time pose detection
  const frameProcessor = useFrameProcessor((frame) => {
    'worklet';
    
    if (!isInitialized) {
      return;
    }

    try {
      // Scan frame for poses using ML Kit (runs in worklet)
      const mlkitPoses = scanSKRNMLKitPose(frame);
      
      if (!mlkitPoses || mlkitPoses.length === 0) {
        updatePose(null);
        return;
      }
      
      // Convert ML Kit pose to our format (runs in worklet)
      const detectedPose = convertMLKitPoseToPose(frame, mlkitPoses[0]);
      
      // Update pose (runs on JS thread)
      updatePose(detectedPose);
      
      // Increment frame counter (runs on JS thread)
      runOnJS(() => {
        frameCountRef.current++;
      })();
    } catch (error) {
      console.error('Frame processor error:', error);
    }
  }, [isInitialized]);

  // Check camera permission and device
  if (hasPermission === null) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" />
        <Text style={styles.text}>Requesting camera permission...</Text>
      </View>
    );
  }

  if (hasPermission === false) {
    return (
      <View style={styles.container}>
        <Text style={styles.text}>Camera permission is required</Text>
        <Text style={styles.text}>
          Please grant camera permission in your device settings
        </Text>
      </View>
    );
  }

  if (!device) {
    return (
      <View style={styles.container}>
        <Text style={styles.text}>No camera device found</Text>
      </View>
    );
  }

  if (isLoading) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color="#00FF00" />
        <Text style={styles.text}>{loadingMessage}</Text>
        <Text style={styles.hintText}>
          ML Kit initializes quickly{'\n'}
          (no model download needed)
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
      <Camera
        device={device}
        isActive={isInitialized && hasPermission === true}
        frameProcessor={frameProcessor}
        style={styles.camera}
      >
        <PoseOverlay
          pose={poseState}
          width={CAMERA_WIDTH}
          height={CAMERA_HEIGHT}
          useNormalizedCoordinates={true}
        />
      </Camera>

      {/* FPS Counter */}
      <View style={styles.fpsContainer}>
        <Text style={styles.fpsText}>FPS: {fps}</Text>
      </View>

      {/* Pose Score Indicator */}
      {poseState && (
        <View style={styles.scoreContainer}>
          <Text style={styles.scoreText}>
            Confidence: {(poseState.score * 100).toFixed(0)}%
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
