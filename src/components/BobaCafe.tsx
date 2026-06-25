import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Dimensions, Image, TextInput, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  Easing,
} from 'react-native-reanimated';
import { THEME, STRAW_SKINS, CUP_STYLES, DECOR_ITEMS, ShopItem } from '../utils/theme';
import { audioController } from '../utils/audio';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

interface BobaCafeProps {
  coins: number;
  setCoins: React.Dispatch<React.SetStateAction<number>>;
  unlockedStraws: string[];
  setUnlockedStraws: React.Dispatch<React.SetStateAction<string[]>>;
  unlockedCups: string[];
  setUnlockedCups: React.Dispatch<React.SetStateAction<string[]>>;
  unlockedDecor: string[];
  setUnlockedDecor: React.Dispatch<React.SetStateAction<string[]>>;
  equippedDecor: string[];
  setEquippedDecor: React.Dispatch<React.SetStateAction<string[]>>;
  equippedStraw: string;
  setEquippedStraw: React.Dispatch<React.SetStateAction<string>>;
  equippedCup: string;
  setEquippedCup: React.Dispatch<React.SetStateAction<string>>;
  cafeName: string;
  setCafeName: React.Dispatch<React.SetStateAction<string>>;
  onBack: () => void;
  adsRemoved: boolean;
  onPurchaseRemoveAds: () => void;
  onShowRewardedAd: (callback: () => void) => void;
  onRestorePurchases: () => Promise<boolean>;
}

type TabType = 'straws' | 'cups' | 'decor' | 'premium'; // Add a premium tab!

export const BobaCafe: React.FC<BobaCafeProps> = ({
  coins,
  setCoins,
  unlockedStraws,
  setUnlockedStraws,
  unlockedCups,
  setUnlockedCups,
  unlockedDecor,
  setUnlockedDecor,
  equippedDecor,
  setEquippedDecor,
  equippedStraw,
  setEquippedStraw,
  equippedCup,
  setEquippedCup,
  cafeName,
  setCafeName,
  onBack,
  adsRemoved,
  onPurchaseRemoveAds,
  onShowRewardedAd,
  onRestorePurchases,
}) => {
  const [activeTab, setActiveTab] = useState<TabType>('straws');
  const [isEditingName, setIsEditingName] = useState(false);
  const [tempName, setTempName] = useState(cafeName);

  // Premium Coin Ad Cooldown State
  const [adCoinCooldown, setAdCoinCooldown] = useState<number>(0);
  const cooldownTimerRef = useRef<NodeJS.Timeout | null>(null);

  const [isRestoring, setIsRestoring] = useState(false);

  const handleRestorePress = async () => {
    if (isRestoring) return;
    setIsRestoring(true);
    try {
      const success = await onRestorePurchases();
      if (success) {
        Alert.alert('Purchases Restored', 'Your premium status has been restored successfully!');
      } else {
        Alert.alert('No Purchases Found', 'We could not find any active premium purchases for your account.');
      }
    } catch (err) {
      Alert.alert('Restore Failed', 'An error occurred while trying to restore your purchases. Please check your network connection.');
    } finally {
      setIsRestoring(false);
    }
  };

  useEffect(() => {
    return () => {
      if (cooldownTimerRef.current) {
        clearInterval(cooldownTimerRef.current);
      }
    };
  }, []);

  const startCooldown = () => {
    setAdCoinCooldown(10);
    let secondsLeft = 10;
    if (cooldownTimerRef.current) clearInterval(cooldownTimerRef.current);
    cooldownTimerRef.current = setInterval(() => {
      secondsLeft -= 1;
      setAdCoinCooldown(secondsLeft);
      if (secondsLeft <= 0) {
        if (cooldownTimerRef.current) {
          clearInterval(cooldownTimerRef.current);
          cooldownTimerRef.current = null;
        }
      }
    }, 1000);
  };

  const handleAdForCoins = () => {
    if (adCoinCooldown > 0) return;

    if (adsRemoved) {
      audioController.play('win');
      setCoins(prev => prev + 50);
      startCooldown();
    } else {
      onShowRewardedAd(() => {
        setCoins(prev => prev + 50);
        startCooldown();
      });
    }
  };

  const renderPremiumTab = () => {
    return (
      <View style={{ gap: 16, width: '100%', marginTop: 8 }}>
        {/* Card 1: Remove Ads */}
        <View style={styles.shopCard}>
          <View style={styles.cardDetails}>
            <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 4 }}>
              <Ionicons name="sparkles" size={18} color="#66FCF1" style={{ marginRight: 6 }} />
              <Text style={styles.itemName}>Remove Ads Forever</Text>
            </View>
            <Text style={styles.itemDesc}>
              Permanently disable all automatic interstitial and banner ads. Get premium instant rewards on all free refills and coins claims!
            </Text>
          </View>

          <View style={styles.cardAction}>
            {adsRemoved ? (
              <View style={styles.equippedBadge}>
                <Ionicons name="checkmark-circle" size={14} color="#66FCF1" style={{ marginRight: 4 }} />
                <Text style={styles.equippedText}>Active</Text>
              </View>
            ) : (
              <TouchableOpacity
                style={styles.premiumBuyButton}
                activeOpacity={0.8}
                onPress={() => onPurchaseRemoveAds()}
              >
                <Text style={styles.premiumBuyButtonText}>$1.99</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>

        {/* Card 2: Free Coins via Ad */}
        <View style={styles.shopCard}>
          <View style={styles.cardDetails}>
            <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 4 }}>
              <Ionicons name="gift-outline" size={18} color="#FFD700" style={{ marginRight: 6 }} />
              <Text style={styles.itemName}>Free Coins Reward</Text>
            </View>
            <Text style={styles.itemDesc}>
              {adsRemoved 
                ? "Claim +50 free coins instantly with your Premium status! Cooldown: 10s." 
                : "Watch a short 5-second sponsor video to get +50 free coins. Cooldown: 10s."}
            </Text>
          </View>

          <View style={styles.cardAction}>
            {adCoinCooldown > 0 ? (
              <View style={styles.cooldownBadge}>
                <Text style={styles.cooldownText}>Wait {adCoinCooldown}s</Text>
              </View>
            ) : (
              <TouchableOpacity
                style={[
                  styles.rewardButton,
                  adsRemoved ? { backgroundColor: '#4CAF50' } : { backgroundColor: '#FF4081' }
                ]}
                activeOpacity={0.8}
                onPress={handleAdForCoins}
              >
                <Ionicons 
                  name={adsRemoved ? "flash" : "play-circle"} 
                  size={16} 
                  color="#FFF" 
                  style={{ marginRight: 4 }} 
                />
                <Text style={styles.rewardButtonText}>+50 Coins</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>

        {/* Card 3: Restore Purchases */}
        <View style={styles.shopCard}>
          <View style={styles.cardDetails}>
            <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 4 }}>
              <Ionicons name="refresh-circle" size={18} color="#FFD700" style={{ marginRight: 6 }} />
              <Text style={styles.itemName}>Restore Purchases</Text>
            </View>
            <Text style={styles.itemDesc}>
              Already purchased Remove Ads? Restore your purchase to reactivate premium status on this device.
            </Text>
          </View>

          <View style={styles.cardAction}>
            <TouchableOpacity
              style={styles.restoreButton}
              activeOpacity={0.8}
              onPress={handleRestorePress}
            >
              <Text style={styles.restoreButtonText}>
                {isRestoring ? 'Restoring...' : 'Restore'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    );
  };

  const handleStartEditName = () => {
    setTempName(cafeName);
    setIsEditingName(true);
    audioController.play('click');
  };

  const handleSaveName = () => {
    const trimmed = tempName.trim();
    if (trimmed.length > 0) {
      setCafeName(trimmed);
      setIsEditingName(false);
      audioController.play('win');
    } else {
      audioController.play('click');
    }
  };

  // Animation for the neon sign glowing
  const neonGlow = useSharedValue(0.4);
  useEffect(() => {
    neonGlow.value = withRepeat(
      withTiming(1, { duration: 1200, easing: Easing.inOut(Easing.quad) }),
      -1,
      true
    );
  }, [neonGlow]);

  const neonStyle = useAnimatedStyle(() => {
    return {
      opacity: neonGlow.value,
      shadowOpacity: neonGlow.value * 0.8,
    };
  });

  const handlePurchase = (item: ShopItem, category: TabType) => {
    if (coins < item.price) {
      audioController.play('click');
      return;
    }

    // Deduct coins and unlock
    setCoins(prev => prev - item.price);
    audioController.play('win'); // play celebratory win jingle for purchase

    if (category === 'straws') {
      setUnlockedStraws(prev => [...prev, item.id]);
      setEquippedStraw(item.id);
    } else if (category === 'cups') {
      setUnlockedCups(prev => [...prev, item.id]);
      setEquippedCup(item.id);
    } else if (category === 'decor') {
      setUnlockedDecor(prev => [...prev, item.id]);
      setEquippedDecor(prev => [...prev, item.id]); // Equip immediately on purchase
    }
  };

  const handleEquip = (itemId: string, category: TabType) => {
    audioController.play('click');
    if (category === 'straws') {
      setEquippedStraw(itemId);
    } else if (category === 'cups') {
      setEquippedCup(itemId);
    }
  };

  const handleToggleDecor = (itemId: string) => {
    audioController.play('click');
    setEquippedDecor(prev => {
      if (prev.includes(itemId)) {
        return prev.filter(id => id !== itemId); // Unequip
      } else {
        return [...prev, itemId]; // Equip
      }
    });
  };

  const renderItemCard = (item: ShopItem, category: TabType) => {
    const isUnlocked =
      category === 'straws'
        ? unlockedStraws.includes(item.id)
        : category === 'cups'
        ? unlockedCups.includes(item.id)
        : unlockedDecor.includes(item.id);

    const isEquipped =
      category === 'straws'
        ? equippedStraw === item.id
        : category === 'cups'
        ? equippedCup === item.id
        : equippedDecor.includes(item.id);

    return (
      <View key={item.id} style={styles.shopCard}>
        <View style={styles.cardDetails}>
          <Text style={styles.itemName}>{item.name}</Text>
          <Text style={styles.itemDesc}>{item.description}</Text>
        </View>

        <View style={styles.cardAction}>
          {isUnlocked ? (
            category === 'decor' ? (
              isEquipped ? (
                <TouchableOpacity
                  style={styles.unequipButton}
                  onPress={() => handleToggleDecor(item.id)}
                >
                  <Text style={styles.unequipButtonText}>Unequip</Text>
                </TouchableOpacity>
              ) : (
                <TouchableOpacity
                  style={styles.equipButton}
                  onPress={() => handleToggleDecor(item.id)}
                >
                  <Text style={styles.equipButtonText}>Equip</Text>
                </TouchableOpacity>
              )
            ) : isEquipped ? (
              item.id === 'classic' ? (
                <View style={styles.equippedBadge}>
                  <Text style={styles.equippedText}>Equipped</Text>
                </View>
              ) : (
                <TouchableOpacity
                  style={styles.unequipButton}
                  onPress={() => handleEquip('classic', category)}
                >
                  <Text style={styles.unequipButtonText}>Unequip</Text>
                </TouchableOpacity>
              )
            ) : (
              <TouchableOpacity
                style={styles.equipButton}
                onPress={() => handleEquip(item.id, category)}
              >
                <Text style={styles.equipButtonText}>Equip</Text>
              </TouchableOpacity>
            )
          ) : (
            <TouchableOpacity
              style={[styles.buyButton, coins < item.price && styles.buyButtonDisabled]}
              onPress={() => handlePurchase(item, category)}
              disabled={coins < item.price}
            >
              <Ionicons name="logo-usd" size={12} color="#000" style={styles.coinIcon} />
              <Text style={styles.buyButtonText}>{item.price}</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    );
  };

  const activeItems =
    activeTab === 'straws'
      ? STRAW_SKINS
      : activeTab === 'cups'
      ? CUP_STYLES
      : DECOR_ITEMS;

  return (
    <SafeAreaView style={styles.safeArea}>
      {/* Header bar */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={onBack}>
          <Ionicons name="chevron-back" size={24} color={THEME.colors.textSecondary} />
          <Text style={styles.backText}>Lobby</Text>
        </TouchableOpacity>

        <Text style={styles.headerTitle}>Boba Cafe</Text>

        <View style={styles.coinBadge}>
          <Ionicons name="logo-usd" size={16} color="#FFD700" style={{ marginRight: 4 }} />
          <Text style={styles.coinValue}>{coins}</Text>
        </View>
      </View>

      {/* Dynamic Storefront Preview Card */}
      <View style={styles.storefrontCard}>
        <View style={styles.storefrontBackground}>
          <Image 
            source={require('../../assets/boba_cafe_banner.png')} 
            style={styles.storefrontImage} 
            resizeMode="cover"
          />

          {/* Cafe Name painted directly on the wooden facade beam */}
          <Text style={styles.cafeNameSign} numberOfLines={1} pointerEvents="none">
            {cafeName || 'My Boba Cafe'}
          </Text>

          {/* Plant upgrade visual overlay (draping ivy plants from ceiling rafters) */}
          {equippedDecor.includes('plant') && (
            <>
              {/* Left hanging plant */}
              <View style={styles.hangingPlantContainer1} pointerEvents="none">
                <View style={styles.plantRope} />
                <View style={styles.premiumPlantPot}>
                  <View style={styles.plantPotRim} />
                </View>
                <View style={styles.vineLeft}>
                  <View style={[styles.premiumLeaf, { top: 4, transform: [{ rotate: '-45deg' }] }]} />
                  <View style={[styles.premiumLeaf, { top: 14, transform: [{ rotate: '30deg' }] }]} />
                  <View style={[styles.premiumLeaf, { top: 24, transform: [{ rotate: '-60deg' }] }]} />
                  <View style={[styles.premiumLeaf, { top: 34, transform: [{ rotate: '15deg' }] }]} />
                </View>
                <View style={styles.vineRight}>
                  <View style={[styles.premiumLeaf, { top: 6, transform: [{ rotate: '45deg' }] }]} />
                  <View style={[styles.premiumLeaf, { top: 16, transform: [{ rotate: '-30deg' }] }]} />
                  <View style={[styles.premiumLeaf, { top: 26, transform: [{ rotate: '60deg' }] }]} />
                  <View style={[styles.premiumLeaf, { top: 36, transform: [{ rotate: '-15deg' }] }]} />
                </View>
                <View style={styles.vineCenter}>
                  <View style={[styles.premiumLeaf, { top: 8, transform: [{ rotate: '10deg' }] }]} />
                  <View style={[styles.premiumLeaf, { top: 20, transform: [{ rotate: '-20deg' }] }]} />
                  <View style={[styles.premiumLeaf, { top: 32, transform: [{ rotate: '40deg' }] }]} />
                  <View style={[styles.premiumLeaf, { top: 44, transform: [{ rotate: '-10deg' }] }]} />
                </View>
              </View>

              {/* Right hanging plant */}
              <View style={styles.hangingPlantContainer2} pointerEvents="none">
                <View style={[styles.plantRope, { height: 18 }]} />
                <View style={[styles.premiumPlantPot, { width: 24, height: 14 }]}>
                  <View style={[styles.plantPotRim, { width: 28 }]} />
                </View>
                <View style={[styles.vineLeft, { top: 31, height: 35 }]}>
                  <View style={[styles.premiumLeaf, { top: 4, transform: [{ rotate: '-40deg' }] }]} />
                  <View style={[styles.premiumLeaf, { top: 13, transform: [{ rotate: '25deg' }] }]} />
                  <View style={[styles.premiumLeaf, { top: 22, transform: [{ rotate: '-50deg' }] }]} />
                </View>
                <View style={[styles.vineRight, { top: 31, height: 42 }]}>
                  <View style={[styles.premiumLeaf, { top: 5, transform: [{ rotate: '40deg' }] }]} />
                  <View style={[styles.premiumLeaf, { top: 14, transform: [{ rotate: '-25deg' }] }]} />
                  <View style={[styles.premiumLeaf, { top: 24, transform: [{ rotate: '50deg' }] }]} />
                </View>
                <View style={[styles.vineCenter, { top: 33, height: 50 }]}>
                  <View style={[styles.premiumLeaf, { top: 6, transform: [{ rotate: '15deg' }] }]} />
                  <View style={[styles.premiumLeaf, { top: 15, transform: [{ rotate: '-15deg' }] }]} />
                  <View style={[styles.premiumLeaf, { top: 24, transform: [{ rotate: '35deg' }] }]} />
                  <View style={[styles.premiumLeaf, { top: 33, transform: [{ rotate: '-5deg' }] }]} />
                </View>
              </View>
            </>
          )}

          {/* Poster upgrade visual overlay (wood framed cartoon boba poster on left pillar) */}
          {equippedDecor.includes('poster') && (
            <View style={styles.cafePoster} pointerEvents="none">
              <Text style={styles.posterTitle}>COZY</Text>
              <View style={styles.posterArt}>
                {/* Straw */}
                <View style={styles.posterCupStraw} />
                {/* Cup Body */}
                <View style={styles.posterCup}>
                  {/* Dome Lid */}
                  <View style={styles.posterCupLid} />
                  
                  {/* Boba pearls */}
                  <View style={[styles.posterBobaPearl, { bottom: 3, left: 3 }]} />
                  <View style={[styles.posterBobaPearl, { bottom: 6, left: 9 }]} />
                  <View style={[styles.posterBobaPearl, { bottom: 2, right: 3 }]} />
                  <View style={[styles.posterBobaPearl, { bottom: 9, left: 6 }]} />
                  <View style={[styles.posterBobaPearl, { bottom: 7.5, right: 7.5 }]} />

                  {/* Cute sleeping face */}
                  <View style={styles.posterFaceContainer}>
                    <View style={styles.posterEyes}>
                      {/* Left eye */}
                      <View style={styles.posterEye} />
                      {/* Right eye */}
                      <View style={styles.posterEye} />
                    </View>
                    {/* Blushing cheeks */}
                    <View style={styles.posterCheeksRow}>
                      <View style={styles.posterBlush} />
                      <View style={styles.posterBlush} />
                    </View>
                    {/* Cute mouth */}
                    <View style={styles.posterMouth} />
                  </View>
                </View>
              </View>
              <Text style={styles.posterFooter}>BOBA</Text>
            </View>
          )}

          {/* Neon sign upgrade visual overlay (pulsing neon boba cafe in left window pane) */}
          {equippedDecor.includes('neon_sign') && (
            <Animated.View style={[styles.neonSign, neonStyle]} pointerEvents="none">
              <View style={styles.neonInnerFrame}>
                <View style={styles.neonContentRow}>
                  {/* Neon Cup Icon */}
                  <View style={styles.neonCupIcon}>
                    <View style={styles.neonCupStraw} />
                    <View style={styles.neonCupBody}>
                      <View style={styles.neonCupLid} />
                      <View style={[styles.neonBoba, { bottom: 1.5, left: 1.5 }]} />
                      <View style={[styles.neonBoba, { bottom: 3, right: 1.5 }]} />
                    </View>
                  </View>
                  
                  {/* Neon Text */}
                  <View style={styles.neonTextBox}>
                    <Text style={styles.neonText}>BOBA</Text>
                    <Text style={styles.neonSubtext}>CAFE</Text>
                  </View>
                </View>
              </View>
            </Animated.View>
          )}
        </View>

        <View style={styles.cafeNameContainer}>
          {isEditingName ? (
            <View style={styles.editNameRow}>
              <TextInput
                style={styles.cafeNameInput}
                value={tempName}
                onChangeText={setTempName}
                maxLength={20}
                autoFocus
                placeholder="Cafe Name"
                placeholderTextColor="rgba(255,255,255,0.4)"
              />
              <TouchableOpacity style={styles.saveNameButton} onPress={handleSaveName}>
                <Ionicons name="checkmark-circle" size={20} color="#66FCF1" />
              </TouchableOpacity>
              <TouchableOpacity style={styles.cancelNameButton} onPress={() => setIsEditingName(false)}>
                <Ionicons name="close-circle" size={20} color="#FF8A80" />
              </TouchableOpacity>
            </View>
          ) : (
            <TouchableOpacity style={styles.nameDisplayRow} onPress={handleStartEditName}>
              <Text style={styles.storefrontLabel}>{cafeName || 'My Boba Cafe'}</Text>
              <Ionicons name="pencil" size={12} color={THEME.colors.textSecondary} style={styles.editIcon} />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Glassmorphic Tabs Selector */}
      <View style={styles.tabsContainer}>
        <TouchableOpacity
          style={[styles.tabButton, activeTab === 'straws' && styles.activeTabButton]}
          onPress={() => {
            audioController.play('click');
            setActiveTab('straws');
          }}
        >
          <Text style={[styles.tabText, activeTab === 'straws' && styles.activeTabText]}>Straws</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tabButton, activeTab === 'cups' && styles.activeTabButton]}
          onPress={() => {
            audioController.play('click');
            setActiveTab('cups');
          }}
        >
          <Text style={[styles.tabText, activeTab === 'cups' && styles.activeTabText]}>Cups</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tabButton, activeTab === 'decor' && styles.activeTabButton]}
          onPress={() => {
            audioController.play('click');
            setActiveTab('decor');
          }}
        >
          <Text style={[styles.tabText, activeTab === 'decor' && styles.activeTabText]}>Cafe Decor</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tabButton, activeTab === 'premium' && styles.activeTabButton]}
          onPress={() => {
            audioController.play('click');
            setActiveTab('premium');
          }}
        >
          <Text style={[styles.tabText, activeTab === 'premium' && styles.activeTabText]}>Premium</Text>
        </TouchableOpacity>
      </View>

      {/* Items Scrollable List */}
      <ScrollView contentContainerStyle={styles.scrollList} showsVerticalScrollIndicator={false}>
        {activeTab === 'premium' ? (
          renderPremiumTab()
        ) : (
          activeItems.map(item => renderItemCard(item, activeTab))
        )}
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: THEME.colors.background,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    height: 56,
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  backText: {
    color: THEME.colors.textSecondary,
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 2,
  },
  headerTitle: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: '900',
    letterSpacing: 1,
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
    fontSize: 15,
  },
  storefrontCard: {
    backgroundColor: THEME.colors.backgroundCard,
    margin: 16,
    padding: 12,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: THEME.colors.border,
    alignItems: 'center',
  },
  storefrontBackground: {
    width: '100%',
    aspectRatio: 1,
    backgroundColor: '#151b22',
    borderRadius: 16,
    position: 'relative',
    overflow: 'hidden',
    borderWidth: 1.5,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  storefrontImage: {
    width: '100%',
    height: '100%',
    borderRadius: 16,
  },
  hangingPlantContainer1: {
    position: 'absolute',
    top: '16%',
    right: '12%',
    width: 45,
    height: 90,
    alignItems: 'center',
    zIndex: 10,
  },
  hangingPlantContainer2: {
    position: 'absolute',
    top: '16%',
    right: '32%',
    width: 40,
    height: 75,
    alignItems: 'center',
    zIndex: 10,
  },
  plantRope: {
    width: 2,
    height: 25,
    backgroundColor: '#8d6e63',
  },
  premiumPlantPot: {
    width: 26,
    height: 16,
    backgroundColor: '#e64a19',
    borderBottomLeftRadius: 8,
    borderBottomRightRadius: 8,
    position: 'relative',
    borderWidth: 1,
    borderColor: '#b23c17',
  },
  plantPotRim: {
    position: 'absolute',
    top: -2,
    left: -2,
    width: 30,
    height: 3,
    backgroundColor: '#f4511e',
    borderRadius: 1.5,
    borderWidth: 0.8,
    borderColor: '#b23c17',
  },
  vineLeft: {
    position: 'absolute',
    top: 30,
    left: 8,
    width: 1.5,
    height: 45,
    backgroundColor: '#388e3c',
  },
  vineRight: {
    position: 'absolute',
    top: 30,
    right: 8,
    width: 1.5,
    height: 50,
    backgroundColor: '#388e3c',
  },
  vineCenter: {
    position: 'absolute',
    top: 32,
    left: 21,
    width: 1.5,
    height: 60,
    backgroundColor: '#2e7d32',
  },
  premiumLeaf: {
    position: 'absolute',
    left: -4,
    width: 10,
    height: 7,
    backgroundColor: '#81c784',
    borderRadius: 4,
    borderWidth: 0.8,
    borderColor: '#2e7d32',
  },
  cafePoster: {
    position: 'absolute',
    top: '38%',
    left: '18%',
    width: 42,
    height: 60,
    backgroundColor: '#fffbe6',
    borderRadius: 3,
    borderWidth: 2.2,
    borderColor: '#3e2723',
    padding: 2.2,
    justifyContent: 'space-between',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 3,
    elevation: 3,
    zIndex: 10,
  },
  posterTitle: {
    fontSize: 4.5,
    fontWeight: '900',
    color: '#3e2723',
    textAlign: 'center',
    letterSpacing: 0.3,
    marginBottom: 0.8,
    textTransform: 'uppercase',
  },
  posterArt: {
    flex: 1,
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  posterCupStraw: {
    position: 'absolute',
    top: 3,
    left: 19.5,
    width: 2.2,
    height: 9,
    backgroundColor: '#d84315',
    transform: [{ rotate: '15deg' }],
    zIndex: 2,
  },
  posterCup: {
    width: 18,
    height: 27,
    backgroundColor: '#ffb74d',
    borderBottomLeftRadius: 4.5,
    borderBottomRightRadius: 4.5,
    borderWidth: 1.2,
    borderColor: '#e65100',
    position: 'relative',
    overflow: 'hidden',
    justifyContent: 'flex-end',
    paddingBottom: 2.2,
  },
  posterCupLid: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 4.5,
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
    borderTopLeftRadius: 4.5,
    borderTopRightRadius: 4.5,
    borderWidth: 0.6,
    borderColor: 'rgba(0,0,0,0.1)',
  },
  posterBobaPearl: {
    width: 3,
    height: 3,
    borderRadius: 1.5,
    backgroundColor: '#3e2723',
    position: 'absolute',
  },
  posterFaceContainer: {
    position: 'absolute',
    top: 9,
    left: 0,
    right: 0,
    alignItems: 'center',
    justifyContent: 'center',
  },
  posterEyes: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: 12,
  },
  posterEye: {
    width: 3,
    height: 1.5,
    borderBottomWidth: 0.9,
    borderBottomColor: '#3e2723',
    borderBottomLeftRadius: 1.5,
    borderBottomRightRadius: 1.5,
  },
  posterCheeksRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: 15,
    marginTop: 1.2,
    position: 'absolute',
    top: 3,
  },
  posterBlush: {
    width: 2.2,
    height: 2.2,
    borderRadius: 1.1,
    backgroundColor: '#ff8a80',
    opacity: 0.8,
  },
  posterMouth: {
    width: 2.2,
    height: 1.5,
    borderBottomWidth: 0.9,
    borderBottomColor: '#3e2723',
    borderBottomLeftRadius: 1.2,
    borderBottomRightRadius: 1.2,
    marginTop: 0.6,
  },
  posterFooter: {
    fontSize: 3.8,
    fontWeight: '700',
    color: '#8d6e63',
    marginTop: 1.2,
  },
  neonSign: {
    position: 'absolute',
    top: '32%',
    left: '46%',
    width: 50,
    height: 25,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: '#ff007f',
    backgroundColor: 'rgba(255, 0, 127, 0.08)',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#ff007f',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.9,
    shadowRadius: 5,
    elevation: 5,
    zIndex: 15,
  },
  neonInnerFrame: {
    width: '92%',
    height: '88%',
    borderRadius: 3.5,
    borderWidth: 0.5,
    borderColor: '#00f0ff',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#00f0ff',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.9,
    shadowRadius: 3.5,
  },
  neonContentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 1.5,
  },
  neonCupIcon: {
    width: 8,
    height: 16,
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'flex-end',
  },
  neonCupStraw: {
    width: 1,
    height: 3.2,
    backgroundColor: '#00f0ff',
    shadowColor: '#00f0ff',
    shadowOpacity: 1,
    shadowRadius: 1.5,
    position: 'absolute',
    top: 0,
    left: 3.2,
    transform: [{ rotate: '15deg' }],
  },
  neonCupBody: {
    width: 7.5,
    height: 10,
    borderWidth: 0.6,
    borderColor: '#ff007f',
    borderBottomLeftRadius: 2.5,
    borderBottomRightRadius: 2.5,
    shadowColor: '#ff007f',
    shadowOpacity: 1,
    shadowRadius: 1.5,
    position: 'relative',
    justifyContent: 'flex-end',
    padding: 0.4,
  },
  neonCupLid: {
    position: 'absolute',
    top: -0.8,
    left: -0.6,
    width: 7.5,
    height: 1.2,
    backgroundColor: '#ff007f',
    borderTopLeftRadius: 0.8,
    borderTopRightRadius: 0.8,
  },
  neonBoba: {
    width: 1,
    height: 1,
    borderRadius: 0.5,
    backgroundColor: '#00f0ff',
    shadowColor: '#00f0ff',
    shadowOpacity: 1,
    shadowRadius: 0.8,
    position: 'absolute',
  },
  neonTextBox: {
    alignItems: 'flex-start',
  },
  neonText: {
    color: '#ff007f',
    fontSize: 6.8,
    fontWeight: '900',
    textShadowColor: '#ff007f',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 4.2,
    letterSpacing: 0.8,
  },
  neonSubtext: {
    color: '#00f0ff',
    fontSize: 4.2,
    fontWeight: '800',
    textShadowColor: '#00f0ff',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 2.5,
    letterSpacing: 0.25,
    marginTop: -1.6,
  },
  cafeNameSign: {
    position: 'absolute',
    top: '12.8%',
    left: '38%',
    width: '52%',
    textAlign: 'center',
    color: '#fffbe6',
    fontSize: 9,
    fontWeight: '900',
    letterSpacing: 1.2,
    textTransform: 'uppercase',
    textShadowColor: 'rgba(0, 0, 0, 0.55)',
    textShadowOffset: { width: 0.8, height: 0.8 },
    textShadowRadius: 0.8,
    zIndex: 20,
  },
  storefrontLabel: {
    color: THEME.colors.textPrimary,
    fontSize: 13,
    fontWeight: '700',
    textAlign: 'center',
  },
  cafeNameContainer: {
    marginTop: 10,
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
  },
  nameDisplayRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  editIcon: {
    opacity: 0.8,
  },
  editNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    width: '90%',
    gap: 8,
  },
  cafeNameInput: {
    flex: 1,
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
    paddingVertical: 4,
    paddingHorizontal: 6,
  },
  saveNameButton: {
    padding: 2,
  },
  cancelNameButton: {
    padding: 2,
  },
  tabsContainer: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    marginHorizontal: 16,
    borderRadius: 12,
    padding: 4,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  tabButton: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    borderRadius: 10,
  },
  activeTabButton: {
    backgroundColor: THEME.colors.accent,
  },
  tabText: {
    color: THEME.colors.textPrimary,
    fontWeight: '700',
    fontSize: 12,
  },
  activeTabText: {
    color: '#000',
  },
  scrollList: {
    paddingHorizontal: 16,
    paddingBottom: 24,
  },
  shopCard: {
    flexDirection: 'row',
    backgroundColor: THEME.colors.backgroundCard,
    padding: 16,
    borderRadius: 14,
    marginTop: 12,
    borderWidth: 1,
    borderColor: THEME.colors.border,
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  cardDetails: {
    flex: 1,
    marginRight: 12,
  },
  itemName: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '800',
    marginBottom: 4,
  },
  itemDesc: {
    color: THEME.colors.textPrimary,
    fontSize: 13,
    opacity: 0.8,
    lineHeight: 18,
  },
  cardAction: {
    justifyContent: 'center',
    alignItems: 'flex-end',
    width: 90,
  },
  unlockedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  unlockedText: {
    color: '#66FCF1',
    fontSize: 14,
    fontWeight: '700',
  },
  equippedBadge: {
    backgroundColor: 'rgba(102, 252, 241, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(102, 252, 241, 0.3)',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
  },
  equippedText: {
    color: '#66FCF1',
    fontWeight: '800',
    fontSize: 12,
  },
  equipButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 8,
    width: '100%',
    alignItems: 'center',
  },
  equipButtonText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 13,
  },
  unequipButton: {
    backgroundColor: 'rgba(255, 138, 128, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(255, 138, 128, 0.4)',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    width: '100%',
    alignItems: 'center',
  },
  unequipButtonText: {
    color: '#FF8A80',
    fontWeight: '800',
    fontSize: 13,
  },
  buyButton: {
    backgroundColor: '#FFD700',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    borderRadius: 8,
    width: '100%',
  },
  buyButtonDisabled: {
    backgroundColor: '#555',
    opacity: 0.6,
  },
  coinIcon: {
    marginRight: 3,
  },
  buyButtonText: {
    color: '#000000',
    fontWeight: '800',
    fontSize: 13,
  },
  premiumBuyButton: {
    backgroundColor: '#66FCF1',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
    width: '100%',
    shadowColor: '#66FCF1',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 3,
  },
  premiumBuyButtonText: {
    color: '#0B0C10',
    fontWeight: '800',
    fontSize: 14,
    letterSpacing: 0.5,
  },
  cooldownBadge: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 8,
    width: '100%',
    alignItems: 'center',
  },
  cooldownText: {
    color: '#888',
    fontWeight: '700',
    fontSize: 13,
  },
  rewardButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 8,
    width: '100%',
    shadowColor: '#FF4081',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 3,
  },
  rewardButtonText: {
    color: '#FFFFFF',
    fontWeight: '800',
    fontSize: 13,
  },
  restoreButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
    width: '100%',
  },
  restoreButtonText: {
    color: '#FFFFFF',
    fontWeight: '800',
    fontSize: 14,
    letterSpacing: 0.5,
  },
});
