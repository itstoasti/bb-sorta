import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Modal } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  withRepeat,
  Easing,
} from 'react-native-reanimated';

// Floating Animated Combo Badge component
const ComboBadge: React.FC<{ comboCount: number }> = ({ comboCount }) => {
  const scale = useSharedValue(0.5);
  const opacity = useSharedValue(0);
  const rotate = useSharedValue(15);
  const glow = useSharedValue(1);

  useEffect(() => {
    // satisfying pop animation on mount and count update
    scale.value = 0.5;
    scale.value = withSpring(1, { damping: 10, stiffness: 120 });
    opacity.value = withTiming(1, { duration: 150 });
    rotate.value = 15;
    rotate.value = withSpring(0, { damping: 8, stiffness: 100 });
    
    // breathing pulse
    glow.value = withRepeat(
      withTiming(1.04, { duration: 600, easing: Easing.inOut(Easing.ease) }),
      -1,
      true
    );
  }, [comboCount]);

  const animatedStyle = useAnimatedStyle(() => {
    return {
      transform: [
        { scale: scale.value * glow.value },
        { rotate: `${rotate.value}deg` }
      ],
      opacity: opacity.value,
    };
  });

  return (
    <Animated.View style={[styles.comboBanner, animatedStyle]}>
      <Text style={styles.comboText}>🔥 {comboCount}x POUR COMBO! 🔥</Text>
    </Animated.View>
  );
};
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { THEME } from '../utils/theme';

interface GameUIProps {
  level: number;
  score: number;
  moves: number;
  historyLength: number;
  soundEnabled: boolean;
  onToggleSound: () => void;
  onUndo: () => void;
  onRestart: () => void;
  onBackToMenu: () => void;
  isWon: boolean;
  onNextLevel: () => void;
  coins: number;
  comboCount: number;
  lastPouredColor: string | null;
  isTimedRace: boolean;
  timeLeft: number;
  isFailed: boolean;
  onBuyExtraTime: () => void;
  earnedStars: number;
  coinsEarned: number;
  targetMoves: number;
  undoCharges?: number;
}

const formatTime = (seconds: number): string => {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${s < 10 ? '0' : ''}${s}`;
};

const getChapterColor = (levelNum: number) => {
  if (levelNum <= 20) return '#81C784'; // Matcha Meadows: Green
  if (levelNum <= 40) return '#F48FB1'; // Sakura Station: Pink
  if (levelNum <= 60) return '#4DD0E1'; // Coconut Coast: Turquoise cyan
  if (levelNum <= 80) return '#B39DDB'; // Taro Town: Purple
  return '#00E5FF'; // Neon Nebula: Neon blue
};

export const GameUI: React.FC<GameUIProps> = ({
  level,
  score,
  moves,
  historyLength,
  soundEnabled,
  onToggleSound,
  onUndo,
  onRestart,
  onBackToMenu,
  isWon,
  onNextLevel,
  coins,
  comboCount,
  lastPouredColor,
  isTimedRace,
  timeLeft,
  isFailed,
  onBuyExtraTime,
  earnedStars,
  coinsEarned,
  targetMoves,
  undoCharges = 5,
}) => {
  const themeColor = getChapterColor(level);

  return (
    <SafeAreaView style={styles.safeArea}>
      {/* Top Header Section */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.iconButton} onPress={onBackToMenu}>
          <Ionicons name="chevron-back" size={24} color={themeColor} />
        </TouchableOpacity>

        <View style={styles.levelContainer}>
          <Text style={styles.levelLabel}>PUZZLE</Text>
          <Text style={[styles.levelValue, { color: themeColor }]}>{level}</Text>
        </View>

        <View style={styles.rightHeaderControls}>
          <View style={styles.coinBadge}>
            <Ionicons name="logo-usd" size={14} color="#FFD700" style={{ marginRight: 2 }} />
            <Text style={styles.coinValue}>{coins}</Text>
          </View>

          <TouchableOpacity style={[styles.iconButton, { marginLeft: 8 }]} onPress={onToggleSound}>
            <Ionicons
              name={soundEnabled ? 'volume-high' : 'volume-mute'}
              size={22}
              color={soundEnabled ? themeColor : THEME.colors.textPrimary}
            />
          </TouchableOpacity>
        </View>
      </View>

      {/* Stats Bar */}
      <View style={styles.statsBar}>
        <View style={styles.statBox}>
          <Text style={styles.statLabel}>SCORE</Text>
          <Text style={[styles.statValue, { color: themeColor }]}>{score}</Text>
        </View>

        {isTimedRace && (
          <View style={styles.statBox}>
            <Text style={[styles.statLabel, timeLeft <= 15 && styles.dangerLabel]}>⏱️ TIME</Text>
            <Text style={[styles.statValue, timeLeft <= 15 ? styles.dangerTimerText : { color: themeColor }]}>
              {formatTime(timeLeft)}
            </Text>
          </View>
        )}

        {!isTimedRace && (level >= 41 && level % 2 === 0 && level % 10 !== 0) && (
          <View style={styles.statBox}>
            <Text style={styles.challengeStatLabel}>⚠️ MODIFIER</Text>
            <Text style={styles.challengeStatValue}>1 Empty Cup</Text>
          </View>
        )}

        {!isTimedRace && (level >= 61 && level % 2 !== 0) && (
          <View style={styles.statBox}>
            <Text style={styles.challengeStatLabel}>⚠️ MODIFIER</Text>
            <Text style={styles.challengeStatValue}>Narrow Straw</Text>
          </View>
        )}

        <View style={styles.statBox}>
          <Text style={styles.statLabel}>{isTimedRace ? "MOVES / GOAL" : "MOVES"}</Text>
          <Text style={[styles.statValue, { color: themeColor }]}>
            {isTimedRace ? `${moves}/${targetMoves}` : moves}
          </Text>
        </View>
      </View>

      {/* Action Buttons Panel */}
      <View style={styles.actionsPanel}>
        {/* Undo Button */}
        <TouchableOpacity
          style={[
            styles.actionButton,
            historyLength === 0 && styles.disabledButton,
            historyLength > 0 && undoCharges === 0 && styles.refillableButton
          ]}
          onPress={onUndo}
          disabled={historyLength === 0}
        >
          <View style={styles.buttonContent}>
            <Ionicons
              name="arrow-undo"
              size={20}
              color={
                historyLength === 0 
                  ? '#444' 
                  : undoCharges === 0 
                    ? '#FFD700' 
                    : themeColor
              }
            />
            <Text 
              style={[
                styles.actionText,
                historyLength === 0 && styles.disabledText,
                historyLength > 0 && undoCharges === 0 && styles.refillableText
              ]}
            >
              {undoCharges === 0 ? 'Undo (Refill)' : `Undo (${undoCharges})`}
            </Text>
          </View>
        </TouchableOpacity>

        {/* Restart Button */}
        <TouchableOpacity style={styles.actionButton} onPress={onRestart}>
          <View style={styles.buttonContent}>
            <Ionicons name="refresh" size={20} color={themeColor} />
            <Text style={styles.actionText}>Restart</Text>
          </View>
        </TouchableOpacity>
      </View>

      {/* Floating Animated Combo Badge (Zero-height container below actions panel to prevent shifting and overlap) */}
      <View style={styles.comboContainer} pointerEvents="none">
        {comboCount > 1 && <ComboBadge comboCount={comboCount} />}
      </View>

      {/* Win Celebration Modal Overlay */}
      <Modal visible={isWon} transparent={true} animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.winCard}>
            {/* Curved Stars Display */}
            <View style={styles.starsContainer}>
              <Ionicons 
                name={earnedStars >= 1 ? "star" : "star-outline"} 
                size={38} 
                color={earnedStars >= 1 ? "#FFD700" : "rgba(255,255,255,0.15)"} 
                style={styles.starIcon} 
              />
              <Ionicons 
                name={earnedStars >= 2 ? "star" : "star-outline"} 
                size={50} 
                color={earnedStars >= 2 ? "#FFD700" : "rgba(255,255,255,0.15)"} 
                style={[styles.starIcon, { bottom: 6 }]} 
              />
              <Ionicons 
                name={earnedStars >= 3 ? "star" : "star-outline"} 
                size={38} 
                color={earnedStars >= 3 ? "#FFD700" : "rgba(255,255,255,0.15)"} 
                style={styles.starIcon} 
              />
            </View>

            <Text style={styles.winTitle}>Level Complete!</Text>
            <Text style={styles.winSubtitle}>
              {earnedStars === 3 ? "Perfect 3-Star Sort!" : earnedStars === 2 ? "Well Done!" : "Sorted!"}
            </Text>

            <View style={styles.modalStats}>
              <View style={styles.modalStatRow}>
                <Text style={styles.modalStatLabel}>Total Moves</Text>
                <Text style={styles.modalStatValue}>{moves}</Text>
              </View>

              <View style={styles.modalStatRow}>
                <Text style={styles.modalStatLabel}>Target Move Goal</Text>
                <Text style={styles.modalStatValue}>{targetMoves}</Text>
              </View>

              <View style={styles.modalStatRow}>
                <Text style={styles.modalStatLabel}>Score Earned</Text>
                <Text style={[styles.modalStatValue, { color: '#66FCF1' }]}>+{100 + Math.max(0, 50 - moves)}</Text>
              </View>

              <View style={styles.modalStatRow}>
                <Text style={styles.modalStatLabel}>Coins Earned</Text>
                <Text style={[styles.modalStatValue, { color: '#FFD700' }]}>+{coinsEarned}</Text>
              </View>
            </View>

            <TouchableOpacity style={styles.nextLevelButton} onPress={onNextLevel}>
              <Text style={styles.nextLevelButtonText}>NEXT LEVEL</Text>
              <Ionicons name="play-forward" size={20} color="#0B0C10" style={{ marginLeft: 6 }} />
            </TouchableOpacity>

            <TouchableOpacity style={styles.menuLinkButton} onPress={onBackToMenu}>
              <Text style={styles.menuLinkButtonText}>Back to Main Menu</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Time's Up / Failure Modal */}
      <Modal visible={isFailed} transparent={true} animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.winCard}>
            <View style={[styles.winHeaderCircle, { borderColor: '#FF8A80', backgroundColor: 'rgba(255, 138, 128, 0.1)' }]}>
              <Ionicons name="time" size={54} color="#FF8A80" />
            </View>

            <Text style={styles.winTitle}>Time's Up!</Text>
            <Text style={styles.winSubtitle}>You ran out of time on this race level.</Text>

            <TouchableOpacity 
              style={[styles.buyTimeButton, coins < 50 && styles.buyTimeButtonDisabled]} 
              onPress={onBuyExtraTime}
              disabled={coins < 50}
            >
              <View style={styles.buyTimeContent}>
                <Ionicons name="add-circle" size={20} color="#0B0C10" />
                <Text style={styles.buyTimeText}>Add +30 Seconds</Text>
              </View>
              <View style={styles.buyTimeCostBadge}>
                <Ionicons name="logo-usd" size={12} color="#000" style={{ marginRight: 2 }} />
                <Text style={styles.buyTimeCostText}>50</Text>
              </View>
            </TouchableOpacity>

            <TouchableOpacity style={styles.restartLevelButton} onPress={onRestart}>
              <Text style={styles.restartLevelButtonText}>RESTART LEVEL</Text>
              <Ionicons name="refresh" size={18} color="#66FCF1" style={{ marginLeft: 6 }} />
            </TouchableOpacity>

            <TouchableOpacity style={styles.menuLinkButton} onPress={onBackToMenu}>
              <Text style={styles.menuLinkButtonText}>Back to Main Menu</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    width: '100%',
    zIndex: 10,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    marginTop: 10,
    height: 50,
  },
  rightHeaderControls: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  coinBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 215, 0, 0.15)',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(255, 215, 0, 0.3)',
  },
  coinValue: {
    color: '#FFD700',
    fontWeight: '800',
    fontSize: 14,
  },
  comboContainer: {
    height: 0,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 100,
    overflow: 'visible',
  },
  comboBanner: {
    position: 'absolute',
    top: 12, // Floating 12px below the actions panel (completely clear of Undo/Restart buttons)
    alignSelf: 'center',
    backgroundColor: '#FF1493', // Vibrant Deep Pink
    borderColor: '#FFD700', // Neon Gold border
    borderWidth: 2.5,
    paddingHorizontal: 22,
    paddingVertical: 10,
    borderRadius: 22,
    zIndex: 100, // Display on top of cups/board
    shadowColor: '#FF1493',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.7,
    shadowRadius: 10,
    elevation: 8,
  },
  comboText: {
    color: '#FFFFFF',
    fontWeight: '900',
    fontSize: 16,
    letterSpacing: 1.5,
    textTransform: 'uppercase',
    textShadowColor: 'rgba(0,0,0,0.4)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 3,
  },
  iconButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: THEME.colors.glassBackground,
    borderWidth: 1,
    borderColor: THEME.colors.glassBorder,
    justifyContent: 'center',
    alignItems: 'center',
  },
  levelContainer: {
    alignItems: 'center',
  },
  levelLabel: {
    fontSize: 10,
    color: THEME.colors.textPrimary,
    letterSpacing: 2,
    fontWeight: '600',
  },
  levelValue: {
    fontSize: 22,
    color: '#FFFFFF',
    fontWeight: 'bold',
  },
  statsBar: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginHorizontal: 20,
    marginTop: 15,
    backgroundColor: THEME.colors.glassBackground,
    borderWidth: 1,
    borderColor: THEME.colors.glassBorder,
    borderRadius: 12,
    paddingVertical: 10,
  },
  statBox: {
    alignItems: 'center',
    flex: 1,
  },
  statLabel: {
    fontSize: 9,
    color: THEME.colors.textPrimary,
    letterSpacing: 1.5,
    fontWeight: '500',
  },
  statValue: {
    fontSize: 18,
    color: THEME.colors.textSecondary,
    fontWeight: 'bold',
    marginTop: 2,
  },
  challengeStatLabel: {
    fontSize: 9,
    color: '#FFA726',
    letterSpacing: 1.2,
    fontWeight: '800',
  },
  challengeStatValue: {
    fontSize: 13,
    color: '#FFFFFF',
    fontWeight: 'bold',
    marginTop: 4,
    textAlign: 'center',
  },
  actionsPanel: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    marginTop: 15,
    gap: 12,
  },
  actionButton: {
    flex: 1,
    height: 44,
    borderRadius: 12,
    backgroundColor: THEME.colors.glassBackground,
    borderWidth: 1,
    borderColor: THEME.colors.glassBorder,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
  },
  disabledButton: {
    opacity: 0.4,
    borderColor: 'rgba(255,255,255,0.05)',
  },
  buttonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  actionText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  disabledText: {
    color: '#555555',
  },
  refillableButton: {
    borderColor: 'rgba(255, 215, 0, 0.4)',
    backgroundColor: 'rgba(255, 215, 0, 0.03)',
  },
  refillableText: {
    color: '#FFD700',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.85)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  winCard: {
    width: '100%',
    maxWidth: 320,
    borderRadius: 24,
    backgroundColor: THEME.colors.backgroundCard,
    borderWidth: 2,
    borderColor: THEME.colors.glassBorder,
    padding: 24,
    alignItems: 'center',
    shadowColor: THEME.colors.textSecondary,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.3,
    shadowRadius: 15,
    elevation: 10,
  },
  winHeaderCircle: {
    width: 90,
    height: 90,
    borderRadius: 45,
    backgroundColor: 'rgba(255, 224, 130, 0.1)',
    borderWidth: 2,
    borderColor: '#FFE082',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  winTitle: {
    fontSize: 26,
    fontWeight: 'bold',
    color: '#FFFFFF',
    textAlign: 'center',
  },
  winSubtitle: {
    fontSize: 14,
    color: THEME.colors.textPrimary,
    textAlign: 'center',
    marginTop: 6,
    marginBottom: 20,
  },
  modalStats: {
    width: '100%',
    backgroundColor: 'rgba(255,255,255,0.03)',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)',
    padding: 16,
    marginBottom: 24,
    gap: 12,
  },
  modalStatRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  modalStatLabel: {
    fontSize: 14,
    color: THEME.colors.textPrimary,
  },
  modalStatValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  nextLevelButton: {
    width: '100%',
    height: 52,
    borderRadius: 14,
    backgroundColor: THEME.colors.textSecondary,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: THEME.colors.textSecondary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 6,
  },
  nextLevelButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#0B0C10',
    letterSpacing: 1.5,
  },
  menuLinkButton: {
    marginTop: 16,
    paddingVertical: 8,
  },
  menuLinkButtonText: {
    fontSize: 13,
    color: THEME.colors.textPrimary,
    textDecorationLine: 'underline',
  },
  starsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: 70,
    marginBottom: 12,
  },
  starIcon: {
    marginHorizontal: 6,
  },
  buyTimeButton: {
    width: '100%',
    height: 50,
    borderRadius: 14,
    backgroundColor: '#FFD700',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    marginTop: 10,
    shadowColor: '#FFD700',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 5,
  },
  buyTimeButtonDisabled: {
    backgroundColor: '#555',
    opacity: 0.6,
    shadowOpacity: 0,
  },
  buyTimeContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  buyTimeText: {
    fontSize: 15,
    fontWeight: 'bold',
    color: '#0B0C10',
  },
  buyTimeCostBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.1)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  buyTimeCostText: {
    fontSize: 13,
    fontWeight: 'bold',
    color: '#000000',
  },
  restartLevelButton: {
    width: '100%',
    height: 48,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: '#66FCF1',
    backgroundColor: 'transparent',
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 14,
  },
  restartLevelButtonText: {
    fontSize: 15,
    fontWeight: 'bold',
    color: '#66FCF1',
    letterSpacing: 1,
  },
  dangerTimerText: {
    color: '#FF8A80',
  },
  timerText: {
    color: '#66FCF1',
  },
  dangerLabel: {
    color: '#FF8A80',
    fontWeight: '700',
  },
});
export default GameUI;
