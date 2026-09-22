import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, Animated } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useVideoPlayer, VideoView } from 'expo-video';

interface AuthVideoBackgroundProps {
  videoSource: any;
  children: React.ReactNode;
}

export function AuthVideoBackground({
  videoSource,
  children,
}: AuthVideoBackgroundProps) {
  const player = useVideoPlayer(videoSource, (p) => {
    p.loop = true;
    p.muted = true;
    p.play();
  });

  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Delay animation slightly to let video load
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 800,
      useNativeDriver: true,
      delay: 150,
    }).start();
  }, [fadeAnim]);

  return (
    <View style={styles.container}>
      {/* Background Video Layer */}
      <View style={StyleSheet.absoluteFill}>
        <VideoView
          player={player}
          style={styles.video}
          contentFit="cover"
          nativeControls={false}
        />
      </View>

      {/* Base Dark Overlay to ensure readability on bright videos */}
      <View style={[StyleSheet.absoluteFill, { backgroundColor: 'rgba(10, 28, 22, 0.3)' }]} />

      {/* Cinematic Vignette Gradient Fade - Transparent top to solid dark bottom */}
      <LinearGradient
        colors={[
          'rgba(10, 28, 22, 0.2)',
          'rgba(10, 28, 22, 0.5)',
          'rgba(10, 28, 22, 0.9)',
          '#0A1C16',
        ]}
        locations={[0, 0.4, 0.75, 1.0]}
        style={StyleSheet.absoluteFill}
      />

      {/* Animated Foreground Content */}
      <Animated.View 
        style={[
          styles.contentWrapper, 
          { opacity: fadeAnim }
        ]}
      >
        <View style={styles.content}>{children}</View>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0A1C16',
  },
  video: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  contentWrapper: {
    flex: 1,
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 10,
  },
  content: {
    flex: 1,
    zIndex: 5,
  },
});
