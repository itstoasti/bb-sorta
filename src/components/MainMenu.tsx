import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Modal, ScrollView, Dimensions, ImageBackground, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  withDelay,
  Easing,
  withSpring,
} from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { THEME, FLAVORS } from '../utils/theme';
import { audioController } from '../utils/audio';

interface MainMenuProps {
  onStartGame: (startLevel: number) => void;
  onGoToCafe: () => void;
  onGoToJourney: () => void;
  unlockedLevel: number;
  coins: number;
  cafeName?: string;
  adsRemoved: boolean;
  onPurchaseRemoveAds: () => void;
}

const { width: SCREEN_WIDTH } = Dimensions.get('window');

export const MainMenu: React.FC<MainMenuProps> = ({
  onStartGame,
  onGoToCafe,
  onGoToJourney,
  unlockedLevel,
  coins,
  cafeName,
  adsRemoved,
  onPurchaseRemoveAds,
}) => {
  const [showTutorial, setShowTutorial] = useState(false);

  // Animating the Title logo bobbing
  const titleY = useSharedValue(0);
  useEffect(() => {
    titleY.value = withRepeat(
      withTiming(-12, { duration: 1500, easing: Easing.inOut(Easing.quad) }),
      -1,
      true
    );
  }, [titleY]);

  const animatedTitleStyle = useAnimatedStyle(() => {
    return {
      transform: [{ translateY: titleY.value }],
    };
  });

  // Breathing animation for the QUICK PLAY button
  const playScale = useSharedValue(1);
  useEffect(() => {
    playScale.value = withRepeat(
      withTiming(1.04, { duration: 1200, easing: Easing.inOut(Easing.quad) }),
      -1,
      true
    );
  }, [playScale]);

  const animatedPlayStyle = useAnimatedStyle(() => {
    return {
      transform: [{ scale: playScale.value }],
    };
  });

  return (
    <ImageBackground
      source={require('../../assets/boba_cafe_banner.png')}
      style={styles.backgroundImage}
      resizeMode="cover"
    >
      <SafeAreaView style={styles.container}>
        {/* Coin Display in Top Right Header Row (Notch-safe spacing) */}
        <View style={styles.headerRow}>
          {!adsRemoved ? (
            <TouchableOpacity 
              style={styles.noAdsBadge} 
              activeOpacity={0.8}
              onPress={onPurchaseRemoveAds}
            >
              <Ionicons name="sparkles" size={14} color="#66FCF1" style={{ marginRight: 4 }} />
              <Text style={styles.noAdsText}>NO ADS</Text>
            </TouchableOpacity>
          ) : (
            <View style={styles.premiumBadge}>
              <Ionicons name="ribbon" size={14} color="#FFD700" style={{ marginRight: 4 }} />
              <Text style={styles.premiumText}>PREMIUM</Text>
            </View>
          )}
          <View style={styles.coinBadge}>
            <Ionicons name="logo-usd" size={15} color="#FFD700" style={{ marginRight: 3 }} />
            <Text style={styles.coinValue}>{coins}</Text>
          </View>
        </View>

        {/* Floating Bobas Background Decor */}
        <FloatingMenuBobas />

        {/* Main Title Section */}
        <View style={styles.logoSection}>
          <View style={styles.logoCard}>
            <Animated.View style={[styles.titleWrapper, animatedTitleStyle]}>
              <Text style={[styles.titleText, { color: '#FFFFFF', textShadowColor: '#ff007f' }]}>BOBA</Text>
              <Text style={[styles.titleText, { color: THEME.colors.textSecondary, textShadowColor: '#66FCF1' }]}>SORT</Text>
            </Animated.View>
            <Text style={styles.subtitleText}>Fluid Straw Puzzle</Text>
          </View>
        </View>

        {/* Action Buttons */}
        <View style={styles.menuButtons}>
          {/* Quick Play Button (with breathing animation) */}
          <Animated.View style={animatedPlayStyle}>
            <TouchableOpacity
              style={styles.playButton}
              activeOpacity={0.8}
              onPress={() => {
                audioController.play('click');
                onStartGame(unlockedLevel);
              }}
            >
              <Text style={styles.playButtonText}>QUICK PLAY</Text>
              <Ionicons name="play" size={24} color="#0B0C10" style={{ marginLeft: 6 }} />
            </TouchableOpacity>
          </Animated.View>

          {/* Boba Cafe Shop Button (Glassmorphic Cyan Accent) */}
          <TouchableOpacity
            style={[styles.menuButton, styles.cafeButton]}
            activeOpacity={0.8}
            onPress={onGoToCafe}
          >
            <View style={styles.buttonContentInline}>
              <Ionicons name="cafe" size={20} color={THEME.colors.textSecondary} style={{ marginRight: 6 }} />
              <Text style={[styles.menuButtonText, { color: THEME.colors.textSecondary }]}>
                {cafeName || 'My Boba Cafe'}
              </Text>
            </View>
          </TouchableOpacity>

          {/* Level Select Button (Glassmorphic Gold Accent) */}
          <TouchableOpacity
            style={[styles.menuButton, styles.journeyButton]}
            activeOpacity={0.8}
            onPress={onGoToJourney}
          >
            <View style={styles.buttonContentInline}>
              <Ionicons name="map-outline" size={18} color="#FFD700" style={{ marginRight: 6 }} />
              <Text style={[styles.menuButtonText, { color: '#FFD700' }]}>Select Puzzle Level</Text>
            </View>
          </TouchableOpacity>

          {/* Tutorial Button */}
          <TouchableOpacity
            style={[styles.menuButton, styles.secondaryButton]}
            activeOpacity={0.8}
            onPress={() => {
              audioController.play('click');
              setShowTutorial(true);
            }}
          >
            <Text style={styles.secondaryButtonText}>How To Play</Text>
          </TouchableOpacity>
        </View>

        {/* Bottom Footer Decor */}
        <View style={styles.footer}>
          <Text style={styles.footerText}>ASMR Sorting Experience</Text>
        </View>

        {/* Tutorial Modal */}
        <Modal visible={showTutorial} transparent={true} animationType="slide">
          <View style={styles.modalOverlay}>
            <View style={styles.modalCard}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>How To Play</Text>
                <TouchableOpacity onPress={() => setShowTutorial(false)}>
                  <Ionicons name="close-circle" size={28} color={THEME.colors.textPrimary} />
                </TouchableOpacity>
              </View>

              <ScrollView style={styles.tutorialContent}>
                <TutorialStep
                  icon="touch-app"
                  title="1. Tap to Select"
                  desc="Tap any cup with liquid or pearls. The straw will hover and dip down to suck up layers."
                />

                <TutorialStep
                  icon="hourglass-empty"
                  title="2. The Straw Buffer"
                  desc="The straw holds up to 2 layers. It acts as a stack (LIFO): the last layer you suck up is the first one that comes out!"
                />

                <TutorialStep
                  icon="swap-vert"
                  title="3. Tap to Dispense"
                  desc="Tap another cup to pour. You can only pour if the cup has matching contents on top, or is empty."
                />

                <TutorialStep
                  icon="check-circle"
                  title="4. Sort & Win"
                  desc="Complete the level by sorting each cup so it contains only matching layers (or is completely empty)."
                />
              </ScrollView>

              <TouchableOpacity style={styles.closeButton} onPress={() => setShowTutorial(false)}>
                <Text style={styles.closeButtonText}>GOT IT</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>
      </SafeAreaView>
    </ImageBackground>
  );
};

// Tutorial Step Component
interface TutorialStepProps {
  icon: string;
  title: string;
  desc: string;
}

const TutorialStep: React.FC<TutorialStepProps> = ({ icon, title, desc }) => {
  return (
    <View style={styles.stepRow}>
      <View style={styles.stepIconBox}>
        <Ionicons name="bulb-outline" size={24} color={THEME.colors.textSecondary} />
      </View>
      <View style={styles.stepTexts}>
        <Text style={styles.stepTitle}>{title}</Text>
        <Text style={styles.stepDesc}>{desc}</Text>
      </View>
    </View>
  );
};

// Bouncing Menu Bobas background effect
const FloatingMenuBobas: React.FC = () => {
  const flavors = Object.values(FLAVORS);
  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="box-none">
      {flavors.slice(0, 6).map((flavor, index) => {
        if (flavor.id === 'mango') return null;
        return <FloatingBobaItem key={flavor.id} flavor={flavor} index={index} />;
      })}
    </View>
  );
};

interface FloatingBobaItemProps {
  flavor: typeof FLAVORS[string];
  index: number;
}

const FloatingBobaItem: React.FC<FloatingBobaItemProps> = ({ flavor, index }) => {
  const bobaY = useSharedValue(0);
  const scale = useSharedValue(1);

  // Position randomly across screen width
  const leftPos = 40 + index * ((SCREEN_WIDTH - 80) / 5);
  // Stack layers vertically
  const topPos = 180 + (index % 3) * 120;

  useEffect(() => {
    bobaY.value = withDelay(
      index * 200,
      withRepeat(
        withTiming(-25, { duration: 1800 + index * 150, easing: Easing.inOut(Easing.sin) }),
        -1,
        true
      )
    );
  }, [bobaY, index]);

  const handleTap = () => {
    audioController.play('click');
    scale.value = 1.4;
    scale.value = withSpring(1, { damping: 5 });
  };

  const animatedStyle = useAnimatedStyle(() => {
    return {
      transform: [{ translateY: bobaY.value }, { scale: scale.value }],
    };
  });

  return (
    <TouchableOpacity
      activeOpacity={0.8}
      onPress={handleTap}
      style={[
        styles.floatingBoba,
        {
          left: leftPos,
          top: topPos,
          backgroundColor: flavor.color,
          shadowColor: flavor.color,
        },
      ]}
    >
      <Animated.View style={[StyleSheet.absoluteFill, animatedStyle]}>
        <View style={styles.glossHighlight} />
      </Animated.View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  backgroundImage: {
    flex: 1,
    width: '100%',
    height: '100%',
    backgroundColor: THEME.colors.background,
  },
  container: {
    flex: 1,
    backgroundColor: 'rgba(18, 12, 26, 0.88)', // Dark, taro-tinted ambient overlay
    justifyContent: 'space-between',
    alignItems: 'center',
    width: '100%',
  },
  headerRow: {
    width: '100%',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: Platform.OS === 'ios' ? 10 : 36, // Generous spacing to clear notification bar/notches
    zIndex: 10,
  },
  noAdsBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(102, 252, 241, 0.15)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 14,
    borderWidth: 1.2,
    borderColor: 'rgba(102, 252, 241, 0.4)',
    shadowColor: '#66FCF1',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 3,
  },
  noAdsText: {
    color: '#66FCF1',
    fontWeight: '800',
    fontSize: 12,
    letterSpacing: 0.5,
  },
  premiumBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 215, 0, 0.15)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 14,
    borderWidth: 1.2,
    borderColor: 'rgba(255, 215, 0, 0.4)',
    shadowColor: '#FFD700',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 3,
  },
  premiumText: {
    color: '#FFD700',
    fontWeight: '800',
    fontSize: 12,
    letterSpacing: 0.5,
  },
  coinBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 215, 0, 0.18)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 14,
    borderWidth: 1.2,
    borderColor: 'rgba(255, 215, 0, 0.35)',
  },
  coinValue: {
    color: '#FFD700',
    fontWeight: '800',
    fontSize: 14,
  },
  cafeButton: {
    borderColor: 'rgba(102, 252, 241, 0.35)',
    borderWidth: 1.5,
    backgroundColor: 'rgba(102, 252, 241, 0.05)',
    shadowColor: '#66FCF1',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 3,
  },
  journeyButton: {
    borderColor: 'rgba(255, 215, 0, 0.25)',
    borderWidth: 1.5,
    backgroundColor: 'rgba(255, 215, 0, 0.03)',
    shadowColor: '#FFD700',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 3,
  },
  buttonContentInline: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoSection: {
    alignItems: 'center',
    marginTop: 25,
    paddingHorizontal: 24,
    width: '100%',
  },
  logoCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.02)',
    borderRadius: 24,
    borderWidth: 1.2,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    paddingHorizontal: 30,
    paddingVertical: 22,
    alignItems: 'center',
    width: '90%',
    shadowColor: '#66FCF1',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.25,
    shadowRadius: 25,
    elevation: 10,
  },
  titleWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  titleText: {
    fontSize: 48,
    fontWeight: '900',
    letterSpacing: 4,
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 20,
  },
  subtitleText: {
    fontSize: 16,
    color: THEME.colors.textPrimary,
    letterSpacing: 3,
    marginTop: 8,
    textTransform: 'uppercase',
    fontWeight: '700',
  },
  menuButtons: {
    width: '100%',
    paddingHorizontal: 36,
    gap: 16,
    marginBottom: 50,
    zIndex: 10,
  },
  playButton: {
    height: 56,
    borderRadius: 16,
    backgroundColor: THEME.colors.textSecondary,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: THEME.colors.textSecondary,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 8,
    width: '100%',
  },
  playButtonText: {
    fontSize: 18,
    fontWeight: '900',
    color: '#0B0C10',
    letterSpacing: 2,
  },
  menuButton: {
    height: 52,
    borderRadius: 15,
    backgroundColor: THEME.colors.glassBackground,
    borderWidth: 1.5,
    borderColor: THEME.colors.glassBorder,
    justifyContent: 'center',
    alignItems: 'center',
  },
  menuButtonText: {
    fontSize: 15,
    fontWeight: '800',
    letterSpacing: 1,
  },
  secondaryButton: {
    borderColor: 'transparent',
    backgroundColor: 'transparent',
  },
  secondaryButtonText: {
    fontSize: 14,
    color: THEME.colors.textPrimary,
    textDecorationLine: 'underline',
    fontWeight: '600',
  },
  footer: {
    marginBottom: 12,
  },
  footerText: {
    fontSize: 11,
    color: 'rgba(255, 255, 255, 0.25)',
    letterSpacing: 2,
    textTransform: 'uppercase',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.85)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  modalCard: {
    width: '100%',
    maxHeight: '80%',
    borderRadius: 24,
    backgroundColor: THEME.colors.backgroundCard,
    borderWidth: 1.5,
    borderColor: THEME.colors.glassBorder,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.5,
    shadowRadius: 20,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FFFFFF',
    letterSpacing: 1,
  },
  tutorialContent: {
    marginBottom: 20,
  },
  stepRow: {
    flexDirection: 'row',
    marginBottom: 20,
    gap: 14,
  },
  stepIconBox: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: 'rgba(102, 252, 241, 0.08)',
    borderWidth: 1,
    borderColor: 'rgba(102, 252, 241, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  stepTexts: {
    flex: 1,
  },
  stepTitle: {
    fontSize: 15,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 3,
  },
  stepDesc: {
    fontSize: 13,
    color: THEME.colors.textPrimary,
    lineHeight: 18,
  },
  closeButton: {
    height: 48,
    borderRadius: 12,
    backgroundColor: THEME.colors.textSecondary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeButtonText: {
    fontSize: 15,
    fontWeight: 'bold',
    color: '#0B0C10',
    letterSpacing: 1,
  },
  floatingBoba: {
    position: 'absolute',
    width: 32,
    height: 32,
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: 'rgba(0,0,0,0.1)',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.6,
    shadowRadius: 6,
    elevation: 4,
  },
  glossHighlight: {
    position: 'absolute',
    top: 3,
    left: 3,
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: 'rgba(255, 255, 255, 0.85)',
  },
});

export default MainMenu;
