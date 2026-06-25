import React, { useEffect } from 'react';
import { View, StyleSheet, TouchableOpacity, Dimensions } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  Easing,
} from 'react-native-reanimated';
import { THEME, Flavor } from '../utils/theme';
import { Cup, BobaLayer, ActiveAction } from '../hooks/useGameState';

interface CupComponentProps {
  cup: Cup;
  isSelected: boolean;
  isTargetable: boolean;
  activeAction: ActiveAction | null;
  onPress: (id: string) => void;
  measureLayout: (id: string, x: number, y: number, width: number, height: number) => void;
  equippedCup?: string;
}

export const CupComponent: React.FC<CupComponentProps> = ({
  cup,
  isSelected,
  isTargetable,
  activeAction,
  onPress,
  measureLayout,
  equippedCup = 'classic',
}) => {
  const containerRef = React.useRef<View>(null);

  // Measure position on mount/layout change to tell the Straw where to float
  const handleLayout = () => {
    if (containerRef.current) {
      containerRef.current.measure((fx, fy, width, height, px, py) => {
        measureLayout(cup.id, px, py, width, height);
      });
    }
  };

  // Determine which layers are currently visible (hide top layers if they are currently being sucked into the straw)
  let visibleLayers = [...cup.layers];
  if (activeAction && activeAction.cupId === cup.id && activeAction.type === 'suck') {
    const suckCount = activeAction.targetLayers.length;
    visibleLayers = cup.layers.slice(0, cup.layers.length - suckCount);
  }

  // Animating selected glow
  const scale = useSharedValue(1);
  useEffect(() => {
    scale.value = withSpring(isSelected ? 1.05 : 1, { damping: 10 });
  }, [isSelected, scale]);

  const animatedContainerStyle = useAnimatedStyle(() => {
    return {
      transform: [
        { perspective: 400 },
        { rotateX: '-12deg' },
        { scale: scale.value }
      ],
    };
  });

  return (
    <TouchableOpacity
      activeOpacity={0.9}
      onPress={() => onPress(cup.id)}
      style={styles.touchArea}
    >
      <Animated.View
        style={[
          styles.bobaCupWrapper,
          animatedContainerStyle,
        ]}
      >
        {/* Cute Cat Ears upgrade */}
        {equippedCup === 'cat' && (
          <View style={styles.catEarsContainer} pointerEvents="none">
            <View style={[styles.catEar, styles.catEarLeft]} />
            <View style={[styles.catEar, styles.catEarRight]} />
          </View>
        )}

        {/* Cozy Bear Ears upgrade */}
        {equippedCup === 'bear' && (
          <View style={styles.bearEarsContainer} pointerEvents="none">
            <View style={[styles.bearEar, styles.bearEarLeft]} />
            <View style={[styles.bearEar, styles.bearEarRight]} />
          </View>
        )}

        {/* Transparent Dome Lid (Classic/Cat/Bear) or Flat Lid (Jar) */}
        {equippedCup === 'jar' ? (
          <View style={styles.jarLid} pointerEvents="none">
            <View style={styles.jarLidRim} />
          </View>
        ) : (
          <View style={styles.domeLid} pointerEvents="none">
            <View style={styles.strawHole} />
          </View>
        )}

        {/* Cup Container Body */}
        <View
          ref={containerRef}
          onLayout={handleLayout}
          style={[
            styles.cupContainer,
            equippedCup === 'jar' && styles.jarContainer,
            isSelected && styles.selectedCup,
            isTargetable && styles.targetableCup,
          ]}
        >
          {/* Jar Neck Cutouts for Mason Jar shape */}
          {equippedCup === 'jar' && (
            <>
              <View style={[styles.jarNeckInsert, { left: 0 }]} pointerEvents="none" />
              <View style={[styles.jarNeckInsert, { right: 0 }]} pointerEvents="none" />
            </>
          )}

          {/* Glass highlight glare */}
          <View style={styles.glassGlare} />

          {/* Cute mascot printed on the cup */}
          <View style={styles.mascotSticker} pointerEvents="none">
            <View style={styles.mascotEyes}>
              <View style={styles.mascotEye} />
              <View style={styles.mascotEye} />
            </View>
            <View style={styles.mascotMouth} />
          </View>

          {/* Cup layers rendered bottom-to-top */}
          <View style={styles.layersContainer}>
            {visibleLayers.map((layer, index) => {
              const isTop = index === visibleLayers.length - 1;
              const isBottom = index === 0;

              return (
                <CupLayerItem
                  key={layer.id}
                  layer={layer}
                  isTop={isTop}
                  isBottom={isBottom}
                />
              );
            })}
          </View>

          {/* Plastic Cup Rim */}
          <View style={styles.cupRim} />
        </View>
      </Animated.View>
    </TouchableOpacity>
  );
};

interface CupLayerItemProps {
  layer: BobaLayer;
  isTop: boolean;
  isBottom: boolean;
}

const CupLayerItem: React.FC<CupLayerItemProps> = ({ layer, isTop, isBottom }) => {
  // Mounting animation for adding layers
  const heightVal = useSharedValue(0);
  const opacityVal = useSharedValue(0);
  const translateYVal = useSharedValue(0);

  useEffect(() => {
    heightVal.value = withTiming(THEME.dimensions.cupHeight / THEME.dimensions.maxCupCapacity, {
      duration: 250,
      easing: Easing.out(Easing.quad),
    });
    opacityVal.value = withTiming(1, { duration: 250 });
    
    // springy landing bounce: starts higher up (-15px) and drops down with spring physics
    translateYVal.value = -15;
    translateYVal.value = withSpring(0, { damping: 8, stiffness: 110 });
  }, [heightVal, opacityVal, translateYVal]);

  const animatedStyle = useAnimatedStyle(() => {
    return {
      height: heightVal.value,
      opacity: opacityVal.value,
      transform: [{ translateY: translateYVal.value }],
    };
  });

  if (layer.type === 'fluid') {
    return (
      <Animated.View
        style={[
          styles.fluidLayer,
          animatedStyle,
          {
            backgroundColor: layer.color,
            borderBottomLeftRadius: isBottom ? THEME.dimensions.cupBorderRadius - 2 : 0,
            borderBottomRightRadius: isBottom ? THEME.dimensions.cupBorderRadius - 2 : 0,
            borderTopLeftRadius: isTop ? 12 : 0,
            borderTopRightRadius: isTop ? 12 : 0,
          },
        ]}
      >
        {/* Liquid highlight overlay */}
        <View style={styles.liquidHighlight} />
      </Animated.View>
    );
  }

  // Boba pearl layout: 3 pearls sitting within the layer block
  return (
    <Animated.View style={[styles.pearlLayerContainer, animatedStyle]}>
      {/* Background soft liquid tint for the pearls to sit in */}
      <View
        style={[
          styles.pearlLayerBg,
          {
            backgroundColor: `${layer.color}1E`, // 12% opacity tint
            borderBottomLeftRadius: isBottom ? THEME.dimensions.cupBorderRadius - 2 : 0,
            borderBottomRightRadius: isBottom ? THEME.dimensions.cupBorderRadius - 2 : 0,
            borderTopLeftRadius: isTop ? 8 : 0,
            borderTopRightRadius: isTop ? 8 : 0,
          },
        ]}
      />

      {/* Pearl 1: Bottom Left */}
      <View style={[styles.bobaPearl, { left: 10, bottom: 4, backgroundColor: layer.color }]}>
        <View style={styles.pearlGloss} />
      </View>

      {/* Pearl 2: Bottom Right */}
      <View style={[styles.bobaPearl, { right: 10, bottom: 4, backgroundColor: layer.color }]}>
        <View style={styles.pearlGloss} />
      </View>

      {/* Pearl 3: Top Middle */}
      <View style={[styles.bobaPearl, { left: 24, bottom: 20, backgroundColor: layer.color }]}>
        <View style={styles.pearlGloss} />
      </View>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  touchArea: {
    padding: 8,
  },
  bobaCupWrapper: {
    width: THEME.dimensions.cupWidth,
    height: THEME.dimensions.cupHeight + 15,
    justifyContent: 'flex-end',
    position: 'relative',
    overflow: 'visible',
  },
  domeLid: {
    position: 'absolute',
    top: 0,
    left: 4,
    right: 4,
    height: 22,
    borderTopLeftRadius: 22,
    borderTopRightRadius: 22,
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.28)',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    alignItems: 'center',
    zIndex: 1,
  },
  strawHole: {
    width: 14,
    height: 6,
    borderRadius: 3,
    backgroundColor: 'rgba(255, 255, 255, 0.4)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
    marginTop: 2,
  },
  cupContainer: {
    width: THEME.dimensions.cupWidth,
    height: THEME.dimensions.cupHeight,
    borderBottomLeftRadius: THEME.dimensions.cupBorderRadius + 4,
    borderBottomRightRadius: THEME.dimensions.cupBorderRadius + 4,
    borderTopLeftRadius: 4,
    borderTopRightRadius: 4,
    borderWidth: 2.5,
    borderColor: THEME.colors.glassBorder,
    backgroundColor: THEME.colors.glassBackground,
    overflow: 'hidden',
    position: 'relative',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.22,
    shadowRadius: 6,
    elevation: 5,
  },
  selectedCup: {
    borderColor: THEME.colors.textSecondary,
    shadowColor: THEME.colors.textSecondary,
    shadowOpacity: 0.6,
    shadowRadius: 10,
    borderWidth: 2.5,
  },
  targetableCup: {
    borderColor: THEME.colors.accent,
    borderStyle: 'dashed',
    opacity: 0.9,
  },
  glassGlare: {
    position: 'absolute',
    top: 0,
    left: 4,
    width: 6,
    height: '100%',
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    borderTopLeftRadius: 6,
    borderBottomLeftRadius: 6,
    zIndex: 10,
  },
  mascotSticker: {
    position: 'absolute',
    top: '42%',
    alignSelf: 'center',
    width: 32,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
    opacity: 0.35,
    zIndex: 15,
  },
  mascotEyes: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: 20,
    marginBottom: 1,
  },
  mascotEye: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#FFFFFF',
  },
  mascotMouth: {
    width: 6,
    height: 3.5,
    borderBottomWidth: 1.5,
    borderBottomColor: '#FFFFFF',
    borderLeftWidth: 1,
    borderLeftColor: 'transparent',
    borderRightWidth: 1,
    borderRightColor: 'transparent',
    borderBottomLeftRadius: 3,
    borderBottomRightRadius: 3,
  },
  cupRim: {
    position: 'absolute',
    top: 0,
    left: -2,
    right: -2,
    height: 10,
    borderRadius: 5,
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.35)',
    backgroundColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 1,
    zIndex: 11,
  },
  layersContainer: {
    flex: 1,
    flexDirection: 'column-reverse',
    justifyContent: 'flex-start',
    width: '100%',
    height: '100%',
  },
  fluidLayer: {
    width: '100%',
    position: 'relative',
  },
  liquidHighlight: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
  },
  pearlLayerContainer: {
    width: '100%',
    position: 'relative',
  },
  pearlLayerBg: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  bobaPearl: {
    position: 'absolute',
    width: THEME.dimensions.bobaSize,
    height: THEME.dimensions.bobaSize,
    borderRadius: THEME.dimensions.bobaSize / 2,
    borderWidth: 1.5,
    borderColor: 'rgba(0,0,0,0.15)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.3,
    shadowRadius: 1,
    elevation: 1,
  },
  pearlGloss: {
    position: 'absolute',
    top: 2,
    left: 2,
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: 'rgba(255, 255, 255, 0.75)',
  },
  catEarsContainer: {
    position: 'absolute',
    top: 5,
    left: 8,
    right: 8,
    height: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    zIndex: -1,
  },
  catEar: {
    width: 0,
    height: 0,
    borderStyle: 'solid',
    borderLeftWidth: 8,
    borderRightWidth: 8,
    borderBottomWidth: 12,
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
    borderBottomColor: 'rgba(255, 255, 255, 0.4)',
  },
  catEarLeft: {
    transform: [{ rotate: '-15deg' }],
  },
  catEarRight: {
    transform: [{ rotate: '15deg' }],
  },
  bearEarsContainer: {
    position: 'absolute',
    top: 6,
    left: 6,
    right: 6,
    height: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    zIndex: -1,
  },
  bearEar: {
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: 'rgba(255, 255, 255, 0.35)',
    borderWidth: 1.5,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  bearEarLeft: {
    marginLeft: -2,
  },
  bearEarRight: {
    marginRight: -2,
  },
  jarContainer: {
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
    borderTopLeftRadius: 10,
    borderTopRightRadius: 10,
  },
  jarLid: {
    position: 'absolute',
    top: 4,
    alignSelf: 'center',
    width: THEME.dimensions.cupWidth - 8,
    height: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.5)',
    borderRadius: 3,
    borderWidth: 1.5,
    borderColor: 'rgba(255, 255, 255, 0.3)',
    zIndex: 11,
  },
  jarLidRim: {
    position: 'absolute',
    bottom: -3,
    left: 2,
    right: 2,
    height: 4,
    backgroundColor: '#FFFFFF',
    borderRadius: 1,
  },
  jarNeckInsert: {
    position: 'absolute',
    top: 10,
    width: 8,
    height: 20,
    backgroundColor: THEME.colors.background,
    zIndex: 14,
  },
});
export default CupComponent;
