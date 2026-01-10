import React from 'react';
import { View, StyleSheet, Dimensions } from 'react-native';
import Svg, { Circle, Line } from 'react-native-svg';
import { Pose, KeypointIndex, SKELETON_CONNECTIONS } from '@/types/pose';

interface PoseOverlayProps {
  pose: Pose | null;
  width: number;
  height: number;
  useNormalizedCoordinates?: boolean; // If true, coordinates are 0-1 (ML Kit), else pixel coordinates
}

/**
 * Component to overlay pose keypoints and skeleton on camera feed
 * Supports both normalized coordinates (0-1) from ML Kit and pixel coordinates
 */
export default function PoseOverlay({
  pose,
  width,
  height,
  useNormalizedCoordinates = true, // ML Kit uses normalized coordinates
}: PoseOverlayProps) {
  if (!pose) {
    return null;
  }

  // Scale factor: if normalized, scale from 0-1 to screen size
  // If pixel coordinates, use 1:1 (or adjust based on model input size)
  const scaleX = useNormalizedCoordinates ? width : 1;
  const scaleY = useNormalizedCoordinates ? height : 1;

  // Keypoint colors
  const keypointColor = '#00FF00'; // Green
  const keypointRadius = 4;
  const skeletonColor = '#00FF00'; // Green
  const skeletonWidth = 2;

  return (
    <View style={[StyleSheet.absoluteFill, { width, height }]} pointerEvents="none">
      <Svg width={width} height={height}>
        {/* Draw skeleton connections */}
        {SKELETON_CONNECTIONS.map((connection, index) => {
          const startKeypoint = pose.keypoints[connection.start];
          const endKeypoint = pose.keypoints[connection.end];

          // Only draw if both keypoints have valid scores
          if (startKeypoint.score > 0 && endKeypoint.score > 0) {
            const x1 = startKeypoint.x * scaleX;
            const y1 = startKeypoint.y * scaleY;
            const x2 = endKeypoint.x * scaleX;
            const y2 = endKeypoint.y * scaleY;

            return (
              <Line
                key={`skeleton-${index}`}
                x1={x1}
                y1={y1}
                x2={x2}
                y2={y2}
                stroke={skeletonColor}
                strokeWidth={skeletonWidth}
                opacity={Math.min(startKeypoint.score, endKeypoint.score)}
              />
            );
          }
          return null;
        })}

        {/* Draw keypoints */}
        {pose.keypoints.map((keypoint, index) => {
          if (keypoint.score > 0) {
            const x = keypoint.x * scaleX;
            const y = keypoint.y * scaleY;

            return (
              <Circle
                key={`keypoint-${index}`}
                cx={x}
                cy={y}
                r={keypointRadius}
                fill={keypointColor}
                opacity={keypoint.score}
              />
            );
          }
          return null;
        })}
      </Svg>
    </View>
  );
}
