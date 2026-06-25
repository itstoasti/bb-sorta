import React, { useEffect, useState } from 'react';
import { View, StyleSheet, Dimensions } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  Easing,
  runOnJS,
} from 'react-native-reanimated';
import { THEME } from '../utils/theme';
import { StrawState, ActiveAction, BobaLayer } from '../hooks/useGameState';

interface CupLayout {
  x: number;
  y: number;
  width: number;
  height: number;
}

interface StrawComponentProps {
  straw: StrawState;
  selectedCupId: string | null;
  activeAction: ActiveAction | null;
  cupLayouts: Record<string, CupLayout>;
  commitAction: () => void;
  equippedStraw?: string;
}

const STRAW_WIDTH = 24;
const STRAW_HEIGHT = 160;
const LAYER_HEIGHT = 38;

export const StrawComponent: React.FC<StrawComponentProps> = ({
  straw,
  selectedCupId,
  activeAction,
  cupLayouts,
  commitAction,
  equippedStraw = 'classic',
}) => {
  const [isVisible, setIsVisible] = useState(false);

  // Reanimated shared values for position
  const strawX = useSharedValue(0);
  const strawY = useSharedValue(0);
  const rotation = useSharedValue(0);

  // Monitor target selection and actions to drive the straw animation
  useEffect(() => {
    // Determine which cup the straw should associate with
    const targetCupId = activeAction ? activeAction.cupId : selectedCupId;
    if (!targetCupId) {
      setIsVisible(false);
      return;
    }

    const layout = cupLayouts[targetCupId];
    if (!layout) return;

    setIsVisible(true);

    const startX = layout.x + layout.width / 2 - STRAW_WIDTH / 2;
    const floatY = layout.y - STRAW_HEIGHT + 25;

    // SCENARIO A: An action is actively executing (SUCK or DISPENSE)
    if (activeAction) {
      // Calculate how deep the straw should dip based on the cup fill height
      const cupLayersCount = cupLayouts[activeAction.cupId] ? (activeAction.type === 'suck' ? 4 : 3) : 0; 
      // We estimate the cup fill height: each layer is 45px.
      // Sucking: dip to the current top layer.
      // Dispensing: dip to the top layer index that the new layers will land on.
      const currentFillLevel = activeAction.type === 'suck' 
        ? Math.max(1, activeAction.targetLayers.length) 
        : Math.max(1, activeAction.targetLayers.length);

      // Deep dip calculation
      const dipDepth = layout.height - (currentFillLevel * 32);
      const dipY = layout.y + dipDepth - STRAW_HEIGHT + 45;

      // Orchestrate animation sequence:
      // 1. Move to float height above target cup
      strawX.value = withTiming(startX, { duration: 250, easing: Easing.out(Easing.quad) });
      strawY.value = withTiming(floatY, { duration: 250, easing: Easing.out(Easing.quad) }, () => {
        
        // 2. Dip down into the cup
        strawY.value = withTiming(dipY, { duration: 250, easing: Easing.inOut(Easing.quad) }, () => {
          
          // 3. Commit state changes at the bottom of the dip
          runOnJS(commitAction)();

          // Add a tiny rotation wobble for juice suction effect
          rotation.value = withTiming(activeAction.type === 'suck' ? -3 : 3, { duration: 50 }, () => {
            rotation.value = withTiming(0, { duration: 50 });
          });

          // 4. Dip back up to float height
          strawY.value = withTiming(floatY, { duration: 250, easing: Easing.out(Easing.quad) });
        });
      });

    // SCENARIO B: Idle, floating above selected cup
    } else {
      strawX.value = withTiming(startX, { duration: 300, easing: Easing.out(Easing.back(1.2)) });
      strawY.value = withTiming(floatY, { duration: 300, easing: Easing.out(Easing.back(1.2)) });
    }
  }, [activeAction, selectedCupId, cupLayouts, commitAction, strawX, strawY, rotation]);

  const animatedStrawStyle = useAnimatedStyle(() => {
    return {
      transform: [
        { translateX: strawX.value },
        { translateY: strawY.value },
        { rotate: `${rotation.value}deg` },
      ],
      opacity: isVisible ? 1 : 0,
    };
  });

  // Layers inside the straw: index 0 (bottom of stack) is rendered at the top,
  // and the last index (tip of straw) is rendered at the bottom.
  const visibleLayers = [...straw.currentLayers];

  return (
    <Animated.View
      pointerEvents="none"
      style={[styles.strawContainer, animatedStrawStyle]}
    >
      {/* Translucent Straw Tube */}
      <View
        style={[
          styles.strawBody,
          equippedStraw === 'candy' && styles.candyStrawBody,
          equippedStraw === 'gold' && styles.goldStrawBody,
          equippedStraw === 'neon' && styles.neonStrawBody,
        ]}
      >
        {/* Glow detail */}
        <View style={styles.strawGlow} />

        {/* Straw spiral pattern stripes */}
        {equippedStraw === 'candy' ? (
          <View style={styles.candyStripeOverlay} />
        ) : (
          <View style={styles.stripeOverlay} />
        )}

        {/* Layers inside the straw */}
        <View style={styles.contentsContainer}>
          {visibleLayers.map((layer, index) => (
            <StrawLayerItem key={`${layer.id}_straw_${index}`} layer={layer} />
          ))}
        </View>
      </View>

      {/* Angle tip of the straw */}
      <View
        style={[
          styles.strawTip,
          equippedStraw === 'candy' && styles.candyStrawTip,
          equippedStraw === 'gold' && styles.goldStrawTip,
          equippedStraw === 'neon' && styles.neonStrawTip,
        ]}
      />
    </Animated.View>
  );
};

interface StrawLayerItemProps {
  layer: BobaLayer;
}

const StrawLayerItem: React.FC<StrawLayerItemProps> = ({ layer }) => {
  if (layer.type === 'fluid') {
    return (
      <View
        style={[
          styles.fluidLayer,
          {
            backgroundColor: layer.color,
            shadowColor: layer.color,
          },
        ]}
      />
    );
  }

  // Boba pearl sitting inside the straw
  return (
    <View style={styles.pearlLayer}>
      <View style={[styles.bobaPearl, { backgroundColor: layer.color }]}>
        <View style={styles.pearlGloss} />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  strawContainer: {
    position: 'absolute',
    width: STRAW_WIDTH,
    height: STRAW_HEIGHT,
    zIndex: 100,
    alignItems: 'center',
  },
  strawBody: {
    width: STRAW_WIDTH,
    height: STRAW_HEIGHT - 6,
    borderTopLeftRadius: 6,
    borderTopRightRadius: 6,
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.4)',
    backgroundColor: 'rgba(255, 255, 255, 0.18)',
    position: 'relative',
    overflow: 'hidden',
  },
  strawGlow: {
    position: 'absolute',
    top: 0,
    left: 2,
    width: 3,
    height: '100%',
    backgroundColor: 'rgba(255, 255, 255, 0.4)',
    zIndex: 5,
  },
  stripeOverlay: {
    ...StyleSheet.absoluteFillObject,
    opacity: 0.05,
    backgroundColor: 'transparent',
    borderStyle: 'solid',
    // Renders a simple diagonal overlay texture
    borderRightWidth: 10,
    borderRightColor: '#FFF',
  },
  contentsContainer: {
    flex: 1,
    flexDirection: 'column', // Index 0 (bottom layer) is placed first (at top)
    justifyContent: 'flex-end', // Stacks contents toward the tip
    width: '100%',
    height: '100%',
    paddingBottom: 4,
  },
  fluidLayer: {
    width: '100%',
    height: LAYER_HEIGHT,
    borderWidth: 0.5,
    borderColor: 'rgba(0,0,0,0.1)',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.4,
    shadowRadius: 2,
  },
  pearlLayer: {
    width: '100%',
    height: LAYER_HEIGHT,
    justifyContent: 'center',
    alignItems: 'center',
  },
  bobaPearl: {
    width: THEME.dimensions.bobaSize - 1,
    height: THEME.dimensions.bobaSize - 1,
    borderRadius: (THEME.dimensions.bobaSize - 1) / 2,
    borderWidth: 1.5,
    borderColor: 'rgba(0,0,0,0.15)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 1,
    elevation: 1,
  },
  pearlGloss: {
    position: 'absolute',
    top: 2,
    left: 2,
    width: 3,
    height: 3,
    borderRadius: 1.5,
    backgroundColor: 'rgba(255, 255, 255, 0.75)',
  },
  strawTip: {
    width: STRAW_WIDTH,
    height: 8,
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.4)',
    borderTopWidth: 0,
    backgroundColor: 'rgba(255, 255, 255, 0.18)',
    borderBottomLeftRadius: 4,
    borderBottomRightRadius: 12, // Slanted tip look
    marginTop: -1,
  },
  candyStrawBody: {
    borderColor: '#FF8A80',
    backgroundColor: 'rgba(255, 138, 128, 0.15)',
  },
  candyStripeOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'transparent',
    opacity: 0.15,
    borderRightWidth: 12,
    borderRightColor: '#FFCDD2',
  },
  candyStrawTip: {
    borderColor: '#FF8A80',
    backgroundColor: 'rgba(255, 138, 128, 0.15)',
  },
  goldStrawBody: {
    borderColor: '#FFD700',
    backgroundColor: 'rgba(255, 215, 0, 0.22)',
  },
  goldStrawTip: {
    borderColor: '#FFD700',
    backgroundColor: 'rgba(255, 215, 0, 0.22)',
  },
  neonStrawBody: {
    borderColor: '#66FCF1',
    backgroundColor: 'rgba(102, 252, 241, 0.15)',
    shadowColor: '#66FCF1',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.7,
    shadowRadius: 6,
  },
  neonStrawTip: {
    borderColor: '#66FCF1',
    backgroundColor: 'rgba(102, 252, 241, 0.15)',
    shadowColor: '#66FCF1',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.7,
    shadowRadius: 6,
  },
});
export default StrawComponent;
