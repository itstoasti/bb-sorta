import React, { useEffect } from 'react';
import { View, StyleSheet, Dimensions } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withDelay,
  Easing,
  SharedValue,
} from 'react-native-reanimated';

interface Particle {
  id: number;
  x: number;
  y: number;
  angle: number;
  speed: number;
  size: number;
  delay: number;
}

interface ParticleEffectProps {
  trigger: number;
  color: string;
  x: number;
  y: number;
}

const PARTICLE_COUNT = 12;
const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

export const ParticleEffect: React.FC<ParticleEffectProps> = ({ trigger, color, x, y }) => {
  // Shared value to control the progress (0 to 1) of the animation
  const progress = useSharedValue(0);

  // Re-run the particle animation whenever the trigger updates
  useEffect(() => {
    if (trigger > 0) {
      progress.value = 0;
      progress.value = withTiming(1, {
        duration: 800,
        easing: Easing.out(Easing.quad),
      });
    }
  }, [trigger, progress]);

  // Pre-generate static offsets for the particles
  const particles: Particle[] = Array.from({ length: PARTICLE_COUNT }).map((_, i) => {
    const angle = (i * (360 / PARTICLE_COUNT) * Math.PI) / 180;
    const speed = 40 + Math.random() * 50; // Distance multiplier
    const size = 6 + Math.random() * 8; // Size of particle
    const delay = Math.random() * 150; // Staggered start delay

    return {
      id: i,
      x,
      y,
      angle,
      speed,
      size,
      delay,
    };
  });

  if (trigger === 0) return null;

  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none">
      {particles.map(p => {
        return (
          <ParticleItem
            key={`${trigger}_${p.id}`}
            particle={p}
            color={color}
            progress={progress}
          />
        );
      })}
    </View>
  );
};

interface ParticleItemProps {
  particle: Particle;
  color: string;
  progress: SharedValue<number>;
}

const ParticleItem: React.FC<ParticleItemProps> = ({ particle, color, progress }) => {
  const animatedStyle = useAnimatedStyle(() => {
    const t = progress.value;

    // Delay start for this particle
    const activeT = Math.max(0, t);
    
    // Position equations: center point + trajectory
    const tx = Math.cos(particle.angle) * particle.speed * activeT;
    const ty = Math.sin(particle.angle) * particle.speed * activeT - (activeT * 30); // Drifts upward
    
    // Opacity fades out towards the end
    const opacity = 1 - activeT;
    // Scale drops to zero
    const scale = 1.2 - activeT * 0.8;

    return {
      transform: [
        { translateX: particle.x + tx },
        { translateY: particle.y + ty },
        { scale },
      ],
      opacity,
    };
  });

  return (
    <Animated.View
      style={[
        styles.particle,
        animatedStyle,
        {
          width: particle.size,
          height: particle.size,
          borderRadius: particle.size / 2,
          backgroundColor: color,
          shadowColor: color,
        },
      ]}
    />
  );
};

const styles = StyleSheet.create({
  particle: {
    position: 'absolute',
    left: 0,
    top: 0,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 4,
    elevation: 3,
  },
});
export default ParticleEffect;
