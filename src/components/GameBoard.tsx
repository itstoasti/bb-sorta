import React, { useState, useCallback, useEffect, useRef } from 'react';
import { View, StyleSheet, Dimensions, Modal, TouchableOpacity, Text, ActivityIndicator, ImageBackground, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { THEME } from '../utils/theme';
import { CupComponent } from './CupComponent';
import { StrawComponent } from './StrawComponent';
import { ParticleEffect } from './ParticleEffect';
import { GameUI } from './GameUI';
import { useGameState, Cup } from '../hooks/useGameState';
import { audioController } from '../utils/audio';

interface GameBoardProps {
  startLevel: number;
  onBackToMenu: () => void;
  soundEnabled: boolean;
  onToggleSound: () => void;
  equippedCup?: string;
  equippedStraw?: string;
  onAwardCoins: (amount: number) => void;
  coins: number;
  onFinishLevel: (levelNum: number, stars: number) => void;
  adsRemoved: boolean;
  onShowRewardedAd: (callback: () => void) => void;
  onShowInterstitialAd: (callback: () => void) => void;
  onPurchaseRemoveAds: (callback?: () => void) => void;
  unlockedChapters: number;
  onUnlockNextChapter: () => boolean;
}

interface CupLayout {
  x: number;
  y: number;
  width: number;
  height: number;
}

const { width: SCREEN_WIDTH } = Dimensions.get('window');

const getChapterData = (levelNum: number) => {
  if (levelNum <= 20) {
    return {
      name: 'Matcha Meadows',
      image: require('../../assets/matcha_meadows_bg.png'),
      overlayColor: 'rgba(8, 16, 10, 0.70)', // Soft matcha green tint
    };
  } else if (levelNum <= 40) {
    return {
      name: 'Sakura Station',
      image: require('../../assets/sakura_station_bg.png'),
      overlayColor: 'rgba(20, 10, 15, 0.70)', // Soft sakura pink tint
    };
  } else if (levelNum <= 60) {
    return {
      name: 'Coconut Coast',
      image: require('../../assets/coconut_coast_bg.png'),
      overlayColor: 'rgba(8, 18, 20, 0.70)', // Soft turquoise cyan tint
    };
  } else if (levelNum <= 80) {
    return {
      name: 'Taro Town',
      image: require('../../assets/taro_town_bg.png'),
      overlayColor: 'rgba(14, 10, 20, 0.70)', // Soft taro purple tint
    };
  } else {
    return {
      name: 'Neon Nebula',
      image: require('../../assets/neon_nebula_bg.png'),
      overlayColor: 'rgba(5, 12, 20, 0.70)', // Cyber neon blue tint
    };
  }
};

const NEXT_CHAPTERS_DATA: Record<number, { name: string; vehicle: string; cost: number; image: any; themeColor: string }> = {
  1: { name: 'Sakura Station', vehicle: 'Blossom Hot Balloon', cost: 300, image: require('../../assets/sakura_aerodrome.png'), themeColor: '#F48FB1' },
  2: { name: 'Coconut Coast', vehicle: 'Boba Cruise Ferry', cost: 400, image: require('../../assets/coconut_harbor.png'), themeColor: '#4DD0E1' },
  3: { name: 'Taro Town', vehicle: 'Mystic Warp Portal', cost: 500, image: require('../../assets/taro_observatory.png'), themeColor: '#B39DDB' },
  4: { name: 'Neon Nebula', vehicle: 'Cosmic Starship', cost: 600, image: require('../../assets/cosmic_terminal.png'), themeColor: '#00E5FF' },
};

export const GameBoard: React.FC<GameBoardProps> = ({
  startLevel,
  onBackToMenu,
  soundEnabled,
  onToggleSound,
  equippedCup,
  equippedStraw,
  onAwardCoins,
  coins,
  onFinishLevel,
  adsRemoved,
  onShowRewardedAd,
  onShowInterstitialAd,
  onPurchaseRemoveAds,
  unlockedChapters,
  onUnlockNextChapter,
}) => {
  const {
    level,
    cups,
    straw,
    score,
    moves,
    isWon,
    historyLength,
    activeAction,
    handleCupTap,
    commitAction,
    undo,
    restart,
    nextLevel,
    comboCount,
    lastPouredColor,
    isTimedRace,
    timeLeft,
    isFailed,
    buyExtraTime,
    earnedStars,
    coinsEarned,
    targetMoves,
    undoCharges,
    addUndoCharges,
  } = useGameState(startLevel, onAwardCoins, coins);

  // Sync level completion and star rating to progression states
  const [hasFinished, setHasFinished] = useState(false);

  // Undo Limit & Ad Overlay state
  const [showRefillModal, setShowRefillModal] = useState<boolean>(false);
  const [showChapterUnlockModal, setShowChapterUnlockModal] = useState<boolean>(false);

  const handleUndoTap = useCallback(() => {
    if (undoCharges > 0) {
      undo();
    } else {
      audioController.play('click');
      setShowRefillModal(true);
    }
  }, [undoCharges, undo]);



  const handleWatchAd = () => {
    setShowRefillModal(false);
    onShowRewardedAd(() => {
      addUndoCharges(5);
    });
  };

  const handleNextLevel = () => {
    const nextLevelNum = level + 1;
    const nextChapterRequired = Math.floor((nextLevelNum - 1) / 20) + 1;
    
    if (nextChapterRequired > unlockedChapters && nextLevelNum <= 100) {
      audioController.play('click');
      setShowChapterUnlockModal(true);
      return;
    }

    if (!adsRemoved && level % 3 === 0) {
      onShowInterstitialAd(() => {
        nextLevel();
      });
    } else {
      nextLevel();
    }
  };

  useEffect(() => {
    if (isWon && !hasFinished) {
      onFinishLevel(level, earnedStars);
      setHasFinished(true);
    }
  }, [isWon, level, earnedStars, onFinishLevel, hasFinished]);

  // Reset finish state if the level changes
  useEffect(() => {
    setHasFinished(false);
  }, [level]);

  // Screen coordinates of each cup, populated when they lay out
  const [cupLayouts, setCupLayouts] = useState<Record<string, CupLayout>>({});

  // Particle effect trigger states
  const [particleTrigger, setParticleTrigger] = useState(0);
  const [particleColor, setParticleColor] = useState('#FFFFFF');
  const [particleX, setParticleX] = useState(0);
  const [particleY, setParticleY] = useState(0);

  // Records the screen coordinates of a cup
  const handleMeasureLayout = useCallback((id: string, x: number, y: number, width: number, height: number) => {
    setCupLayouts(prev => ({
      ...prev,
      [id]: { x, y, width, height },
    }));
  }, []);

  // Intercept the tap to determine if it is selected/dispensed
  const handlePressCup = useCallback((cupId: string) => {
    handleCupTap(cupId);
  }, [handleCupTap]);

  // Wrapped commit action to trigger particle effects simultaneously
  const handleCommitAction = useCallback(() => {
    if (activeAction) {
      const { type, cupId, targetLayers } = activeAction;
      const layout = cupLayouts[cupId];

      if (layout && type === 'dispense' && targetLayers.length > 0) {
        // Spawn juice particles right at the top rim of the destination cup
        setParticleColor(targetLayers[0].color);
        setParticleX(layout.x + layout.width / 2);
        setParticleY(layout.y + 15); // near top of cup
        setParticleTrigger(prev => prev + 1);
      }
    }
    
    commitAction();
  }, [activeAction, commitAction, cupLayouts]);

  // Determine which cup is selected (source cup where we sucked from)
  // Since our state has the straw loaded, if the straw has layers, we can highlight the active source cup.
  // Or if selectedCupId is stored: wait, we can determine selectedCupId. If the straw has layers, the last active cup is selected,
  // but to keep it simple, we don't strictly need a selected border if the straw itself floats directly over it!
  // Let's highlight the cup the straw is hovering over when empty.
  const isCupSelected = (cupId: string): boolean => {
    if (activeAction) {
      return activeAction.cupId === cupId && activeAction.type === 'suck';
    }
    // When straw is empty, clicking selects a cup. But since selection immediately sucks,
    // the straw is only "empty" when floating/idle. If straw has layers, it floats above the last active cup.
    return false;
  };

  // Determine if a cup is a valid target to receive layers from the straw
  const isCupTargetable = (cup: Cup): boolean => {
    if (straw.currentLayers.length === 0 || activeAction) return false;

    const tipLayer = straw.currentLayers[straw.currentLayers.length - 1];
    const isCupEmpty = cup.layers.length === 0;
    const topCupLayer = cup.layers[cup.layers.length - 1];
    const isMatchingLayer = !isCupEmpty && topCupLayer.flavor === tipLayer.flavor && topCupLayer.type === tipLayer.type;
    const hasSpace = cup.layers.length < cup.maxCapacity;

    return hasSpace && (isCupEmpty || isMatchingLayer);
  };

  // Split cups into rows for display if there are many cups
  const renderCupsGrid = () => {
    const isTwoRows = cups.length > 4;

    if (!isTwoRows) {
      return (
        <View style={styles.singleRow}>
          {cups.map(cup => (
            <CupComponent
              key={cup.id}
              cup={cup}
              isSelected={isCupSelected(cup.id)}
              isTargetable={isCupTargetable(cup)}
              activeAction={activeAction}
              onPress={handlePressCup}
              measureLayout={handleMeasureLayout}
              equippedCup={equippedCup}
            />
          ))}
        </View>
      );
    }

    // Split cups evenly
    const midPoint = Math.ceil(cups.length / 2);
    const firstRow = cups.slice(0, midPoint);
    const secondRow = cups.slice(midPoint);

    return (
      <View style={styles.doubleRowContainer}>
        <View style={styles.row}>
          {firstRow.map(cup => (
            <CupComponent
              key={cup.id}
              cup={cup}
              isSelected={isCupSelected(cup.id)}
              isTargetable={isCupTargetable(cup)}
              activeAction={activeAction}
              onPress={handlePressCup}
              measureLayout={handleMeasureLayout}
              equippedCup={equippedCup}
            />
          ))}
        </View>
        <View style={[styles.row, { marginTop: 24 }]}>
          {secondRow.map(cup => (
            <CupComponent
              key={cup.id}
              cup={cup}
              isSelected={isCupSelected(cup.id)}
              isTargetable={isCupTargetable(cup)}
              activeAction={activeAction}
              onPress={handlePressCup}
              measureLayout={handleMeasureLayout}
              equippedCup={equippedCup}
            />
          ))}
        </View>
      </View>
    );
  };

  const chapter = getChapterData(level);
  const nextChapterIndex = Math.floor(level / 20) + 1;
  const nextChap = NEXT_CHAPTERS_DATA[nextChapterIndex - 1];

  return (
    <ImageBackground
      source={chapter.image}
      style={styles.container}
      resizeMode="cover"
    >
      <View style={[StyleSheet.absoluteFill, { backgroundColor: chapter.overlayColor }]} />
      {/* Game HUD Header */}
      <GameUI
        level={level}
        score={score}
        moves={moves}
        historyLength={historyLength}
        soundEnabled={soundEnabled}
        onToggleSound={onToggleSound}
        onUndo={handleUndoTap}
        onRestart={restart}
        onBackToMenu={onBackToMenu}
        isWon={isWon}
        onNextLevel={handleNextLevel}
        coins={coins}
        comboCount={comboCount}
        lastPouredColor={lastPouredColor}
        isTimedRace={isTimedRace}
        timeLeft={timeLeft}
        isFailed={isFailed}
        onBuyExtraTime={buyExtraTime}
        earnedStars={earnedStars}
        coinsEarned={coinsEarned}
        targetMoves={targetMoves}
        undoCharges={undoCharges}
      />

      {/* Main Board containing the cups */}
      <View style={styles.boardArea}>
        {renderCupsGrid()}
      </View>

      {/* Floating Straw Overlay */}
      <StrawComponent
        straw={straw}
        selectedCupId={null} // Controlled purely by active action or hovering
        activeAction={activeAction}
        cupLayouts={cupLayouts}
        commitAction={handleCommitAction}
        equippedStraw={equippedStraw}
      />

      {/* Particle Overlay */}
      <ParticleEffect
        trigger={particleTrigger}
        color={particleColor}
        x={particleX}
        y={particleY}
      />

      {/* Out of Undos Refill Modal */}
      <Modal
        visible={showRefillModal}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowRefillModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.refillCard}>
            <View style={styles.modalAlertIconWrapper}>
              <Ionicons name="arrow-undo-circle" size={40} color="#FFD700" />
            </View>
            <Text style={styles.refillTitle}>Out of Undos!</Text>
            <Text style={styles.refillMessage}>
              You've used all your free undos for this level. Refill to keep sorting!
            </Text>

            {/* Watch Ad Option / Claim Premium Reward */}
            <TouchableOpacity
              activeOpacity={0.8}
              style={[
                styles.refillOptionButton,
                adsRemoved 
                  ? { borderColor: '#4CAF50', backgroundColor: 'rgba(76, 175, 80, 0.05)' }
                  : { borderColor: '#FF4081', backgroundColor: 'rgba(255, 64, 129, 0.05)' }
              ]}
              onPress={handleWatchAd}
            >
              <Ionicons 
                name={adsRemoved ? "flash-outline" : "play-circle-outline"} 
                size={20} 
                color={adsRemoved ? "#4CAF50" : "#FF4081"} 
                style={{ marginRight: 8 }} 
              />
              <Text style={[styles.refillOptionText, { color: adsRemoved ? "#4CAF50" : "#FF4081" }]}>
                {adsRemoved ? "Claim Free (+5 Premium)" : "Watch Ad (+5 Free)"}
              </Text>
            </TouchableOpacity>

            {/* Remove Ads Option */}
            {!adsRemoved && (
              <TouchableOpacity
                activeOpacity={0.8}
                style={[
                  styles.refillOptionButton,
                  { borderColor: '#66FCF1', backgroundColor: 'rgba(102, 252, 241, 0.05)', marginTop: 12 }
                ]}
                onPress={() => {
                  setShowRefillModal(false);
                  onPurchaseRemoveAds(() => {
                    addUndoCharges(5);
                  });
                }}
              >
                <Ionicons name="sparkles" size={18} color="#66FCF1" style={{ marginRight: 8 }} />
                <Text style={[styles.refillOptionText, { color: '#66FCF1' }]}>
                  Remove Ads Forever ($1.99)
                </Text>
              </TouchableOpacity>
            )}

            {/* Close Button */}
            <TouchableOpacity
              activeOpacity={0.8}
              style={styles.refillCloseButton}
              onPress={() => setShowRefillModal(false)}
            >
              <Text style={styles.refillCloseButtonText}>Maybe Later</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Chapter Unlock Modal */}
      {nextChap && (
        <Modal visible={showChapterUnlockModal} transparent={true} animationType="fade">
          <View style={styles.unlockOverlay}>
            <View style={styles.unlockCard}>
              <Text style={[styles.unlockTitle, { color: nextChap.themeColor, textShadowColor: `${nextChap.themeColor}50` }]}>
                {nextChap.name} Unlocked! 🎉
              </Text>
              
              <Text style={styles.unlockSubtitle}>
                Congratulations! You've cleared the chapter!
              </Text>

              {/* Custom transparent PNG station asset */}
              <Image 
                source={nextChap.image} 
                style={styles.unlockImage} 
              />

              <Text style={styles.unlockMessage}>
                Ready to travel to the next town? Unlock the {nextChap.vehicle} route to continue your boba adventure!
              </Text>

              {/* Unlock Action Button */}
              <TouchableOpacity
                activeOpacity={0.8}
                style={[
                  styles.unlockConfirmBtn, 
                  { backgroundColor: nextChap.themeColor },
                  coins < nextChap.cost && styles.unlockConfirmBtnDisabled
                ]}
                disabled={coins < nextChap.cost}
                onPress={() => {
                  const success = onUnlockNextChapter();
                  if (success) {
                    setShowChapterUnlockModal(false);
                    nextLevel();
                  }
                }}
              >
                <Ionicons name="sparkles" size={18} color="#0B0C10" style={{ marginRight: 6 }} />
                <Text style={styles.unlockConfirmText}>
                  Unlock Route for {nextChap.cost} Coins
                </Text>
              </TouchableOpacity>

              {coins < nextChap.cost && (
                <Text style={styles.unlockWarningText}>
                  ⚠️ You need {nextChap.cost - coins} more coins to travel! Replay cleared levels to earn more gold.
                </Text>
              )}

              {/* Go to Map Button */}
              <TouchableOpacity
                activeOpacity={0.8}
                style={styles.unlockCancelBtn}
                onPress={() => {
                  setShowChapterUnlockModal(false);
                  onBackToMenu(); // Redirect back to journey map
                }}
              >
                <Text style={styles.unlockCancelText}>Back to Journey Map</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>
      )}
    </ImageBackground>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: THEME.colors.background,
    width: '100%',
  },
  boardArea: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingBottom: 60,
  },
  singleRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    flexWrap: 'wrap',
    width: '100%',
    gap: 12,
  },
  doubleRowContainer: {
    width: '100%',
    alignItems: 'center',
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    width: '100%',
    gap: 16,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.85)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  refillCard: {
    width: '90%',
    maxWidth: 320,
    backgroundColor: '#151122',
    borderRadius: 24,
    borderWidth: 1.5,
    borderColor: 'rgba(255, 215, 0, 0.25)',
    padding: 24,
    alignItems: 'center',
    shadowColor: '#FFD700',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.1,
    shadowRadius: 15,
    elevation: 10,
  },
  modalAlertIconWrapper: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: 'rgba(255, 215, 0, 0.08)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  refillTitle: {
    color: '#FFF',
    fontSize: 20,
    fontWeight: '900',
    letterSpacing: 0.5,
    textAlign: 'center',
    marginBottom: 8,
  },
  refillMessage: {
    color: '#A9A9B0',
    fontSize: 13,
    lineHeight: 18,
    textAlign: 'center',
    marginBottom: 20,
  },
  refillOptionButton: {
    width: '100%',
    height: 48,
    borderRadius: 14,
    borderWidth: 1.5,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  refillOptionButtonDisabled: {
    borderColor: '#444',
    backgroundColor: 'rgba(255, 255, 255, 0.01)',
  },
  refillOptionText: {
    fontWeight: '900',
    fontSize: 14,
    letterSpacing: 0.5,
  },
  refillCloseButton: {
    marginTop: 18,
    paddingVertical: 8,
  },
  refillCloseButtonText: {
    color: '#666',
    fontSize: 13,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  // Chapter Unlock Modal Styles
  unlockOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(5, 3, 10, 0.90)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 20000,
    padding: 16,
  },
  unlockCard: {
    width: '90%',
    maxWidth: 380,
    backgroundColor: '#161622',
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 28,
    padding: 24,
    alignItems: 'center',
  },
  unlockTitle: {
    fontSize: 22,
    fontWeight: '900',
    textAlign: 'center',
    marginBottom: 6,
    letterSpacing: 0.5,
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 8,
  },
  unlockSubtitle: {
    fontSize: 11,
    color: 'rgba(255, 255, 255, 0.4)',
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 16,
    textAlign: 'center',
  },
  unlockImage: {
    width: 160,
    height: 160,
    resizeMode: 'contain',
    marginVertical: 16,
  },
  unlockMessage: {
    fontSize: 13,
    color: 'rgba(255, 255, 255, 0.7)',
    textAlign: 'center',
    lineHeight: 18,
    marginBottom: 20,
    paddingHorizontal: 8,
  },
  unlockConfirmBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
    height: 50,
    borderRadius: 16,
    shadowColor: 'rgba(0,0,0,0.5)',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 5,
  },
  unlockConfirmBtnDisabled: {
    opacity: 0.45,
  },
  unlockConfirmText: {
    fontSize: 15,
    fontWeight: '900',
    color: '#0B0C10',
  },
  unlockWarningText: {
    fontSize: 11,
    color: '#FF8A80',
    fontWeight: '700',
    marginTop: 10,
    textAlign: 'center',
    paddingHorizontal: 4,
  },
  unlockCancelBtn: {
    marginTop: 12,
    paddingVertical: 8,
  },
  unlockCancelText: {
    fontSize: 13,
    color: 'rgba(255, 255, 255, 0.4)',
    fontWeight: '700',
  },
});
export default GameBoard;
