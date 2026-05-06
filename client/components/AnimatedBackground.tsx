import { useEffect, useRef, useState } from 'react';
import { StyleSheet } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  Easing,
} from 'react-native-reanimated';

const FADE_DURATION = 300;

export interface AnimatedBackgroundProps {
  imageUrl: string | null;
}

/**
 * AnimatedBackground — renders a full-screen background image with crossfade
 * transitions when the image URL changes. Fades out to transparent when the
 * URL is null. Handles image load errors gracefully by fading out.
 */
export function AnimatedBackground({ imageUrl }: AnimatedBackgroundProps) {
  // Track two image layers for crossfade
  const [frontUrl, setFrontUrl] = useState<string | null>(null);
  const [backUrl, setBackUrl] = useState<string | null>(null);

  const frontOpacity = useSharedValue(0);
  const backOpacity = useSharedValue(0);

  // Track which layer is "active" (the one fading in)
  const activeLayerRef = useRef<'front' | 'back'>('front');

  useEffect(() => {
    if (imageUrl === null) {
      // Fade out both layers
      frontOpacity.value = withTiming(0, { duration: FADE_DURATION, easing: Easing.inOut(Easing.ease) });
      backOpacity.value = withTiming(0, { duration: FADE_DURATION, easing: Easing.inOut(Easing.ease) });
      return;
    }

    // Crossfade: put new image on the inactive layer, fade it in, fade old out
    if (activeLayerRef.current === 'front') {
      // New image goes to back layer
      setBackUrl(imageUrl);
      backOpacity.value = withTiming(1, { duration: FADE_DURATION, easing: Easing.inOut(Easing.ease) });
      frontOpacity.value = withTiming(0, { duration: FADE_DURATION, easing: Easing.inOut(Easing.ease) });
      activeLayerRef.current = 'back';
    } else {
      // New image goes to front layer
      setFrontUrl(imageUrl);
      frontOpacity.value = withTiming(1, { duration: FADE_DURATION, easing: Easing.inOut(Easing.ease) });
      backOpacity.value = withTiming(0, { duration: FADE_DURATION, easing: Easing.inOut(Easing.ease) });
      activeLayerRef.current = 'front';
    }
  }, [imageUrl, frontOpacity, backOpacity]);

  const frontAnimatedStyle = useAnimatedStyle(() => ({
    opacity: frontOpacity.value,
  }));

  const backAnimatedStyle = useAnimatedStyle(() => ({
    opacity: backOpacity.value,
  }));

  const handleFrontError = () => {
    frontOpacity.value = withTiming(0, { duration: FADE_DURATION, easing: Easing.inOut(Easing.ease) });
  };

  const handleBackError = () => {
    backOpacity.value = withTiming(0, { duration: FADE_DURATION, easing: Easing.inOut(Easing.ease) });
  };

  return (
    <>
      {backUrl && (
        <Animated.Image
          source={{ uri: backUrl }}
          style={[styles.image, backAnimatedStyle]}
          resizeMode="cover"
          onError={handleBackError}
          testID="animated-background-back"
        />
      )}
      {frontUrl && (
        <Animated.Image
          source={{ uri: frontUrl }}
          style={[styles.image, frontAnimatedStyle]}
          resizeMode="cover"
          onError={handleFrontError}
          testID="animated-background-front"
        />
      )}
    </>
  );
}

const styles = StyleSheet.create({
  image: {
    ...StyleSheet.absoluteFillObject,
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
});
