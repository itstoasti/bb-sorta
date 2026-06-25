import React, { useState, useEffect, useCallback, useRef } from 'react';
import { StyleSheet, View, StatusBar, Text, TouchableOpacity, ActivityIndicator, Platform, Modal, Image } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';
import { MainMenu } from './src/components/MainMenu';
import { GameBoard } from './src/components/GameBoard';
import { BobaCafe } from './src/components/BobaCafe';
import { LevelJourneyMap } from './src/components/LevelJourneyMap';
import { audioController } from './src/utils/audio';
import { THEME } from './src/utils/theme';
import mobileAds, { TestIds, InterstitialAd, RewardedAd, AdEventType, RewardedAdEventType } from 'react-native-google-mobile-ads';
import { requestTrackingPermissionsAsync } from 'expo-tracking-transparency';
import Purchases, { PurchasesPackage, LOG_LEVEL } from 'react-native-purchases';

type ScreenState = 'menu' | 'journey' | 'playing' | 'cafe';

const DAILY_REWARDS = [50, 100, 150, 200, 250, 300, 500];

// RevenueCat Configuration Keys
const REVENUECAT_API_KEY_ANDROID = 'test_oFhmfvduHSQwiElYrbKuWbypXGR';
const REVENUECAT_API_KEY_IOS = 'test_oFhmfvduHSQwiElYrbKuWbypXGR';
const REVENUECAT_ENTITLEMENT_ID = 'remove_ads';

export default function App() {
  const [screen, setScreen] = useState<ScreenState>('menu');
  const [startLevel, setStartLevel] = useState<number>(1);
  const [soundEnabled, setSoundEnabled] = useState<boolean>(true);

  // Shop & Customization States
  const [coins, setCoins] = useState<number>(100);
  const [unlockedStraws, setUnlockedStraws] = useState<string[]>(['classic']);
  const [unlockedCups, setUnlockedCups] = useState<string[]>(['classic']);
  const [unlockedDecor, setUnlockedDecor] = useState<string[]>([]);
  const [equippedDecor, setEquippedDecor] = useState<string[]>([]);
  const [equippedStraw, setEquippedStraw] = useState<string>('classic');
  const [equippedCup, setEquippedCup] = useState<string>('classic');
  const [cafeName, setCafeName] = useState<string>('My Boba Cafe');

  // Progression States
  const [unlockedLevel, setUnlockedLevel] = useState<number>(1);
  const [levelStars, setLevelStars] = useState<Record<number, number>>({});
  const [unlockedChapters, setUnlockedChapters] = useState<number>(1);
  const [isLoaded, setIsLoaded] = useState<boolean>(false);

  // Daily Reward States
  const [lastRewardClaimDate, setLastRewardClaimDate] = useState<string>('');
  const [loginStreak, setLoginStreak] = useState<number>(0);
  const [showDailyRewardModal, setShowDailyRewardModal] = useState<boolean>(false);
  const [claimableStreak, setClaimableStreak] = useState<number>(1);

  // Monetization States
  const [adsRemoved, setAdsRemoved] = useState<boolean>(false);
  const [showAd, setShowAd] = useState<boolean>(false);
  const [adCountdown, setAdCountdown] = useState<number>(5);
  const [adText, setAdText] = useState<string>('');
  const [adType, setAdType] = useState<'interstitial' | 'rewarded'>('interstitial');
  const [adRewardCallback, setAdRewardCallback] = useState<(() => void) | null>(null);

  const [showCheckoutSheet, setShowCheckoutSheet] = useState<boolean>(false);
  const [checkoutItemName, setCheckoutItemName] = useState<string>('Remove Ads Forever');
  const [checkoutPrice, setCheckoutPrice] = useState<string>('$1.99');
  const [checkoutCallback, setCheckoutCallback] = useState<(() => void) | null>(null);
  const [rcPackage, setRcPackage] = useState<PurchasesPackage | null>(null);

  const adTimerRef = useRef<NodeJS.Timeout | null>(null);

  const interstitialAdRef = useRef<InterstitialAd | null>(null);
  const rewardedAdRef = useRef<RewardedAd | null>(null);

  const INTERSTITIAL_UNIT_ID = __DEV__ 
    ? TestIds.INTERSTITIAL 
    : (Platform.OS === 'ios' ? 'ca-app-pub-3940256099942544/4411468910' : 'ca-app-pub-5918407268001346/1001939092');

  const REWARDED_UNIT_ID = __DEV__ 
    ? TestIds.REWARDED 
    : (Platform.OS === 'ios' ? 'ca-app-pub-3940256099942544/1712485313' : 'ca-app-pub-5918407268001346/7375775754');

  const preloadInterstitial = useCallback(() => {
    if (adsRemoved || Platform.OS === 'web') return;

    try {
      const interstitial = InterstitialAd.createForAdRequest(INTERSTITIAL_UNIT_ID, {
        requestNonPersonalizedAdsOnly: true,
      });

      const loadSub = interstitial.addAdEventListener(AdEventType.LOADED, () => {
        interstitialAdRef.current = interstitial;
        console.log('Native interstitial ad loaded.');
      });

      const closeSub = interstitial.addAdEventListener(AdEventType.CLOSED, () => {
        interstitialAdRef.current = null;
        loadSub();
        closeSub();
        preloadInterstitial();
      });

      const errorSub = interstitial.addAdEventListener(AdEventType.ERROR, (error: any) => {
        console.warn('Native interstitial ad failed to load:', error);
        interstitialAdRef.current = null;
        loadSub();
        closeSub();
        errorSub();
      });

      interstitial.load();
    } catch (err) {
      console.warn('Error preloading interstitial ad:', err);
    }
  }, [adsRemoved]);

  const preloadRewarded = useCallback(() => {
    if (Platform.OS === 'web') return;

    try {
      const rewarded = RewardedAd.createForAdRequest(REWARDED_UNIT_ID, {
        requestNonPersonalizedAdsOnly: true,
      });

      const loadSub = rewarded.addAdEventListener(AdEventType.LOADED, () => {
        rewardedAdRef.current = rewarded;
        console.log('Native rewarded ad loaded.');
      });

      const closeSub = rewarded.addAdEventListener(AdEventType.CLOSED, () => {
        rewardedAdRef.current = null;
        loadSub();
        closeSub();
        preloadRewarded();
      });

      const errorSub = rewarded.addAdEventListener(AdEventType.ERROR, (error: any) => {
        console.warn('Native rewarded ad failed to load:', error);
        rewardedAdRef.current = null;
        loadSub();
        closeSub();
        errorSub();
      });

      rewarded.load();
    } catch (err) {
      console.warn('Error preloading rewarded ad:', err);
    }
  }, []);

  // Initialize Google Mobile Ads, RevenueCat, and request ATT permissions
  useEffect(() => {
    if (Platform.OS === 'web') return;

    const initSDKs = async () => {
      // 1. App Tracking Transparency on iOS
      try {
        if (Platform.OS === 'ios') {
          const { status } = await requestTrackingPermissionsAsync();
          console.log(`iOS ATT Tracking permission status: ${status}`);
        }
      } catch (err) {
        console.warn('Failed requesting tracking permissions:', err);
      }

      // 2. Initialize AdMob
      try {
        await mobileAds().initialize();
        console.log('Google Mobile Ads SDK initialized.');
        preloadInterstitial();
        preloadRewarded();
      } catch (err) {
        console.warn('Failed initializing Google Mobile Ads SDK:', err);
      }

      // 3. Initialize RevenueCat & Fetch Products
      try {
        Purchases.setLogLevel(LOG_LEVEL.VERBOSE);

        if (Platform.OS === 'ios') {
          Purchases.configure({ apiKey: REVENUECAT_API_KEY_IOS });
        } else if (Platform.OS === 'android') {
          Purchases.configure({ apiKey: REVENUECAT_API_KEY_ANDROID });
        }
        console.log('RevenueCat SDK configured.');

        // Check active entitlements
        const customerInfo = await Purchases.getCustomerInfo();
        if (customerInfo.entitlements.active[REVENUECAT_ENTITLEMENT_ID] !== undefined) {
          setAdsRemoved(true);
          console.log('Premium user detected via RevenueCat (Ads Removed).');
        } else {
          console.log('User is not premium.');
        }

        // Fetch current offerings for Remove Ads item
        const offerings = await Purchases.getOfferings();
        if (offerings.current !== null && offerings.current.availablePackages.length > 0) {
          // Find the package for removing ads (or default first package)
          const pkg = offerings.current.availablePackages.find(
            p => p.packageType === 'LIFETIME' || p.product.identifier.includes('remove_ads')
          ) || offerings.current.availablePackages[0];
          
          setRcPackage(pkg);
          // Dynamic localized price (e.g. "$1.99" or "€1.99")
          if (pkg.product.priceString) {
            setCheckoutPrice(pkg.product.priceString);
          }
          console.log(`RevenueCat package found: ${pkg.product.identifier} priced at ${pkg.product.priceString}`);
        }
      } catch (err) {
        console.warn('Failed initializing RevenueCat:', err);
      }
    };

    initSDKs();
  }, [preloadInterstitial, preloadRewarded]);

  // Load saved state on mount
  useEffect(() => {
    const loadState = async () => {
      try {
        const savedString = await AsyncStorage.getItem('boba_sort_save_data');
        let loadedLastClaimDate = '';
        let loadedStreak = 0;
        if (savedString) {
          const data = JSON.parse(savedString);
          if (data.coins !== undefined) setCoins(data.coins);
          if (data.unlockedStraws !== undefined) setUnlockedStraws(data.unlockedStraws);
          if (data.unlockedCups !== undefined) setUnlockedCups(data.unlockedCups);
          if (data.unlockedDecor !== undefined) {
            setUnlockedDecor(data.unlockedDecor);
            if (data.equippedDecor !== undefined) {
              setEquippedDecor(data.equippedDecor);
            } else {
              setEquippedDecor(data.unlockedDecor); // Default migration
            }
          }
          if (data.equippedStraw !== undefined) setEquippedStraw(data.equippedStraw);
          if (data.equippedCup !== undefined) setEquippedCup(data.equippedCup);
          if (data.unlockedLevel !== undefined) setUnlockedLevel(data.unlockedLevel);
          if (data.levelStars !== undefined) setLevelStars(data.levelStars);
          if (data.unlockedChapters !== undefined) {
            setUnlockedChapters(data.unlockedChapters);
          } else if (data.expansionUnlocked !== undefined) {
            setUnlockedChapters(data.expansionUnlocked ? 2 : 1);
          }
          if (data.cafeName !== undefined) setCafeName(data.cafeName);
          if (data.adsRemoved !== undefined) setAdsRemoved(data.adsRemoved);
          if (data.lastRewardClaimDate !== undefined) {
            loadedLastClaimDate = data.lastRewardClaimDate;
            setLastRewardClaimDate(data.lastRewardClaimDate);
          }
          if (data.loginStreak !== undefined) {
            loadedStreak = data.loginStreak;
            setLoginStreak(data.loginStreak);
          }
        }

        // Daily Login Reward Check
        const now = new Date();
        const year = now.getFullYear();
        const month = String(now.getMonth() + 1).padStart(2, '0');
        const day = String(now.getDate()).padStart(2, '0');
        const todayStr = `${year}-${month}-${day}`;

        if (loadedLastClaimDate !== todayStr) {
          let newStreak = 1;
          if (loadedLastClaimDate) {
            const lastClaim = new Date(loadedLastClaimDate + 'T12:00:00');
            const today = new Date(todayStr + 'T12:00:00');
            const diffTime = today.getTime() - lastClaim.getTime();
            const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24));

            if (diffDays === 1) {
              newStreak = (loadedStreak % 7) + 1;
            } else {
              newStreak = 1;
            }
          } else {
            newStreak = 1;
          }
          setClaimableStreak(newStreak);
          setShowDailyRewardModal(true);
        }
      } catch (err) {
        console.warn('Failed to load game progress:', err);
      } finally {
        setIsLoaded(true);
      }
    };
    loadState();
  }, []);

  // Save state whenever states change
  useEffect(() => {
    if (!isLoaded) return;
    const saveState = async () => {
      try {
        const saveData = {
          coins,
          unlockedStraws,
          unlockedCups,
          unlockedDecor,
          equippedDecor,
          equippedStraw,
          equippedCup,
          unlockedLevel,
          levelStars,
          unlockedChapters,
          expansionUnlocked: unlockedChapters >= 2,
          cafeName,
          adsRemoved,
          lastRewardClaimDate,
          loginStreak,
        };
        await AsyncStorage.setItem('boba_sort_save_data', JSON.stringify(saveData));
      } catch (err) {
        console.warn('Failed to save game progress:', err);
      }
    };
    saveState();
  }, [
    isLoaded,
    coins,
    unlockedStraws,
    unlockedCups,
    unlockedDecor,
    equippedDecor,
    equippedStraw,
    equippedCup,
    unlockedLevel,
    levelStars,
    unlockedChapters,
    cafeName,
    adsRemoved,
    lastRewardClaimDate,
    loginStreak,
  ]);

  // Preload sounds on mount
  useEffect(() => {
    const initAudio = async () => {
      try {
        await audioController.preloadAll();
      } catch (err) {
        console.warn('Audio preloading failed:', err);
      }
    };
    initAudio();

    return () => {
      audioController.unloadAll();
    };
  }, []);

  // Update audio enabled state
  useEffect(() => {
    audioController.setEnabled(soundEnabled);
  }, [soundEnabled]);

  const handleStartGame = useCallback((level: number) => {
    setStartLevel(level);
    setScreen('playing');
  }, []);

  const handleFinishLevel = useCallback((levelNum: number, stars: number) => {
    setLevelStars(prev => ({
      ...prev,
      [levelNum]: Math.max(prev[levelNum] || 0, stars)
    }));

    if (levelNum === unlockedLevel) {
      const maxAllowedLevel = unlockedChapters * 20;
      if (unlockedLevel < maxAllowedLevel) {
        setUnlockedLevel(prev => prev + 1);
      }
    }
  }, [unlockedLevel, unlockedChapters]);

  const handleUnlockNextChapter = useCallback(() => {
    const cost = 300 + (unlockedChapters - 1) * 100;
    if (coins < cost) return false;
    
    setCoins(prev => prev - cost);
    setUnlockedChapters(prev => prev + 1);
    
    if (unlockedLevel === unlockedChapters * 20) {
      setUnlockedLevel(prev => prev + 1);
    }
    
    audioController.play('win');
    return true;
  }, [coins, unlockedChapters, unlockedLevel]);

  const handleAwardCoins = useCallback((amount: number) => {
    setCoins(c => c + amount);
  }, []);

  const handleBackToJourney = () => {
    audioController.play('click');
    setScreen('journey');
  };

  const handleToggleSound = () => {
    setSoundEnabled(prev => !prev);
    if (!soundEnabled) {
      setTimeout(() => {
        audioController.play('click');
      }, 50);
    }
  };

  // Ad text list
  const MOCK_ADS = [
    'Matcha Meadows Spa: Chill like a green tea leaf!',
    'Cute Cat Cup: Upgrade your straw, upgrade your life!',
    'ASMR Boba Stirring: Sound on for the ultimate pop!',
    'Brown Sugar Express: The sweetest train in Boba Valley!',
    'Taro Planetarium: Sort under the neon stars!',
    'Boba Cafe Grand Opening: Rename your shop today!',
  ];

  // Helper to display simulated fallback ads (for web, simulators, or if loading fails)
  const showFallbackAd = useCallback((type: 'interstitial' | 'rewarded', callback: () => void) => {
    setAdType(type);
    setAdText(MOCK_ADS[Math.floor(Math.random() * MOCK_ADS.length)]);
    setAdCountdown(5);
    setAdRewardCallback(() => callback);
    setShowAd(true);
    audioController.play('click');

    let secondsLeft = 5;
    if (adTimerRef.current) clearInterval(adTimerRef.current);

    adTimerRef.current = setInterval(() => {
      secondsLeft -= 1;
      setAdCountdown(secondsLeft);

      if (secondsLeft > 0) {
        audioController.play('click');
      } else {
        if (adTimerRef.current) {
          clearInterval(adTimerRef.current);
          adTimerRef.current = null;
        }
        audioController.play('win');
        setShowAd(false);
        callback();
      }
    }, 1000);
  }, []);

  const handleShowRewardedAd = useCallback((callback: () => void) => {
    if (adsRemoved) {
      callback();
      return;
    }

    const ad = rewardedAdRef.current;
    if (ad && ad.loaded) {
      let rewardEarned = false;

      const rewardSub = ad.addAdEventListener(RewardedAdEventType.EARNED_REWARD, (reward: any) => {
        rewardEarned = true;
        console.log('User earned reward:', reward);
      });

      const closeSub = ad.addAdEventListener(AdEventType.CLOSED, () => {
        rewardSub();
        closeSub();
        if (rewardEarned) {
          audioController.play('win');
          callback();
        } else {
          console.log('User closed rewarded ad early.');
        }
      });

      ad.show();
    } else {
      console.log('Native rewarded ad not loaded; falling back to simulated ad.');
      showFallbackAd('rewarded', callback);
    }
  }, [adsRemoved, showFallbackAd]);

  const handleShowInterstitialAd = useCallback((callback: () => void) => {
    if (adsRemoved) {
      callback();
      return;
    }

    const ad = interstitialAdRef.current;
    if (ad && ad.loaded) {
      const closeSub = ad.addAdEventListener(AdEventType.CLOSED, () => {
        closeSub();
        audioController.play('win');
        callback();
      });

      ad.show();
    } else {
      console.log('Native interstitial ad not loaded; falling back to simulated ad.');
      showFallbackAd('interstitial', callback);
    }
  }, [adsRemoved, showFallbackAd]);

  const handlePurchaseRemoveAds = useCallback(async (callback?: () => void) => {
    if (adsRemoved) return;

    // Check if we have a real RevenueCat package loaded
    if (rcPackage) {
      try {
        console.log('Initiating real purchase via RevenueCat for package:', rcPackage.product.identifier);
        audioController.play('click');
        const { customerInfo } = await Purchases.purchasePackage(rcPackage);
        
        if (customerInfo.entitlements.active[REVENUECAT_ENTITLEMENT_ID] !== undefined) {
          setAdsRemoved(true);
          audioController.play('win');
          console.log('Purchase successful, remove_ads entitlement unlocked!');
          if (callback) callback();
        }
      } catch (err: any) {
        if (!err.userCancelled) {
          console.warn('RevenueCat Purchase Error:', err);
        } else {
          console.log('User cancelled purchase.');
        }
      }
    } else {
      // Fallback to simulated checkout modal for testing/web/unconfigured state
      console.log('No RevenueCat package found. Falling back to simulated checkout.');
      setCheckoutItemName('Remove Ads Forever');
      setCheckoutPrice('$1.99');
      setCheckoutCallback(() => () => {
        setAdsRemoved(true);
        if (callback) callback();
      });
      setShowCheckoutSheet(true);
      audioController.play('click');
    }
  }, [adsRemoved, rcPackage]);

  const handleRestorePurchases = useCallback(async () => {
    audioController.play('click');

    if (Platform.OS !== 'web') {
      try {
        console.log('Initiating entitlement restore via RevenueCat...');
        const customerInfo = await Purchases.restorePurchases();
        if (customerInfo.entitlements.active[REVENUECAT_ENTITLEMENT_ID] !== undefined) {
          setAdsRemoved(true);
          audioController.play('win');
          console.log('Restore successful! Entitlement remove_ads unlocked.');
          return true;
        } else {
          console.log('Restore completed but user has no active remove_ads entitlement.');
          return false;
        }
      } catch (err) {
        console.warn('Failed restoring purchases via RevenueCat:', err);
        return false;
      }
    } else {
      // Web fallback: simulated restore
      console.log('Simulated Sandbox Restore triggered (web).');
      audioController.play('win');
      setAdsRemoved(true);
      return true;
    }
  }, []);

  const handleConfirmCheckout = () => {
    audioController.play('win');
    setShowCheckoutSheet(false);
    if (checkoutCallback) {
      checkoutCallback();
    }
  };

  const handleClaimDailyReward = () => {
    const rewardCoins = DAILY_REWARDS[claimableStreak - 1];
    setCoins(prev => prev + rewardCoins);

    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    const todayStr = `${year}-${month}-${day}`;

    setLastRewardClaimDate(todayStr);
    setLoginStreak(claimableStreak);
    setShowDailyRewardModal(false);
    audioController.play('win');
  };

  useEffect(() => {
    return () => {
      if (adTimerRef.current) clearInterval(adTimerRef.current);
    };
  }, []);

  const handleGoToCafe = () => {
    audioController.play('click');
    setScreen('cafe');
  };

  const handleGoToMenu = () => {
    audioController.play('click');
    setScreen('menu');
  };

  const handleGoToJourney = () => {
    audioController.play('click');
    setScreen('journey');
  };

  if (!isLoaded) {
    return <View style={{ flex: 1, backgroundColor: THEME.colors.background }} />;
  }

  return (
    <SafeAreaProvider>
      <GestureHandlerRootView style={styles.container}>
        <StatusBar barStyle="light-content" backgroundColor={THEME.colors.background} />
        
        {screen === 'menu' ? (
          <MainMenu 
            onStartGame={handleStartGame} 
            onGoToCafe={handleGoToCafe}
            onGoToJourney={handleGoToJourney}
            unlockedLevel={unlockedLevel}
            coins={coins}
            cafeName={cafeName}
            adsRemoved={adsRemoved}
            onPurchaseRemoveAds={handlePurchaseRemoveAds}
          />
        ) : screen === 'journey' ? (
          <LevelJourneyMap
            coins={coins}
            unlockedLevel={unlockedLevel}
            levelStars={levelStars}
            unlockedChapters={unlockedChapters}
            onUnlockNextChapter={handleUnlockNextChapter}
            onSelectLevel={handleStartGame}
            onBack={handleGoToMenu}
          />
        ) : screen === 'playing' ? (
          <GameBoard
            startLevel={startLevel}
            onBackToMenu={handleBackToJourney}
            soundEnabled={soundEnabled}
            onToggleSound={handleToggleSound}
            equippedCup={equippedCup}
            equippedStraw={equippedStraw}
            onAwardCoins={handleAwardCoins}
            coins={coins}
            onFinishLevel={handleFinishLevel}
            adsRemoved={adsRemoved}
            onShowRewardedAd={handleShowRewardedAd}
            onShowInterstitialAd={handleShowInterstitialAd}
            onPurchaseRemoveAds={handlePurchaseRemoveAds}
            unlockedChapters={unlockedChapters}
            onUnlockNextChapter={handleUnlockNextChapter}
          />
        ) : (
          <BobaCafe
            coins={coins}
            setCoins={setCoins}
            unlockedStraws={unlockedStraws}
            setUnlockedStraws={setUnlockedStraws}
            unlockedCups={unlockedCups}
            setUnlockedCups={setUnlockedCups}
            unlockedDecor={unlockedDecor}
            setUnlockedDecor={setUnlockedDecor}
            equippedDecor={equippedDecor}
            setEquippedDecor={setEquippedDecor}
            equippedStraw={equippedStraw}
            setEquippedStraw={setEquippedStraw}
            equippedCup={equippedCup}
            setEquippedCup={setEquippedCup}
            cafeName={cafeName}
            setCafeName={setCafeName}
            onBack={handleGoToMenu}
            adsRemoved={adsRemoved}
            onPurchaseRemoveAds={handlePurchaseRemoveAds}
            onShowRewardedAd={handleShowRewardedAd}
            onRestorePurchases={handleRestorePurchases}
          />
        )}

        {/* Simulated Fullscreen Ad Overlay */}
        <Modal visible={showAd} transparent={true} animationType="fade">
          <View style={styles.adOverlayContainer}>
            <View style={styles.adCard}>
              <Text style={styles.adBadgeText}>MOCK SPONSOR BREAK</Text>
              
              <View style={styles.adTimerCircle}>
                <Text style={styles.adTimerText}>{adCountdown}</Text>
              </View>

              <Text style={styles.adTitle}>{adType === 'rewarded' ? 'Rewarded Ad' : 'Sponsor Ad'}</Text>
              <Text style={styles.adSubtitle}>{adText}</Text>
              
              <View style={styles.adProgressContainer}>
                <View style={[styles.adProgressBarFill, { width: `${(5 - adCountdown) * 20}%` }]} />
              </View>
              
              <Text style={styles.adDisclaimer}>
                Simulated Ad Countdown. Ads support Boba Sort development!
              </Text>
            </View>
          </View>
        </Modal>

        {/* Simulated Bottom Checkout Sheet (App Store / Play Store mock) */}
        <Modal visible={showCheckoutSheet} transparent={true} animationType="slide" onRequestClose={() => setShowCheckoutSheet(false)}>
          <View style={styles.checkoutOverlay}>
            <TouchableOpacity 
              style={StyleSheet.absoluteFill} 
              activeOpacity={1} 
              onPress={() => setShowCheckoutSheet(false)} 
            />
            <View style={styles.checkoutSheet}>
              {/* Top Accent Handle */}
              <View style={styles.checkoutHandle} />

              <View style={styles.checkoutHeader}>
                <Image 
                  source={require('./assets/icon.png')} 
                  style={styles.checkoutAppIconImage} 
                />
                <View style={{ flex: 1, marginLeft: 14 }}>
                  <Text style={styles.checkoutAppName}>Boba Sort</Text>
                  <Text style={styles.checkoutAppDeveloper}>deanfieldz</Text>
                </View>
                <TouchableOpacity style={styles.checkoutCloseBtn} onPress={() => setShowCheckoutSheet(false)}>
                  <Ionicons name="close" size={20} color="#888" />
                </TouchableOpacity>
              </View>

              {/* Gemini-Generated Premium No Ads Artwork */}
              <Image 
                source={require('./assets/no_ads_banner.png')} 
                style={styles.checkoutBannerImage} 
              />

              <View style={styles.checkoutCard}>
                <View style={styles.checkoutDetailRow}>
                  <Text style={styles.checkoutLabel}>Unlock Item</Text>
                  <Text style={styles.checkoutValue}>{checkoutItemName}</Text>
                </View>

                <View style={styles.checkoutDivider} />

                <View style={styles.checkoutDetailRow}>
                  <Text style={styles.checkoutLabel}>Total Price</Text>
                  <Text style={styles.checkoutValuePrice}>{checkoutPrice}</Text>
                </View>
              </View>

              <View style={styles.checkoutSecurityPrompt}>
                <Ionicons name="shield-checkmark" size={16} color="#B39DDB" style={{ marginRight: 6 }} />
                <Text style={styles.checkoutSecurityText}>Simulated Sandbox Checkout</Text>
              </View>

              <TouchableOpacity 
                style={styles.checkoutConfirmButton} 
                activeOpacity={0.8}
                onPress={handleConfirmCheckout}
              >
                <Ionicons name="sparkles" size={18} color="#0B0C10" style={{ marginRight: 8 }} />
                <Text style={styles.checkoutConfirmText}>Confirm & Unlock 🧋</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>

        {/* Daily Login Reward Modal */}
        <Modal visible={showDailyRewardModal} transparent={true} animationType="fade">
          <View style={styles.dailyRewardOverlay}>
            {/* Floating tapioca pearl decorations */}
            <View style={[styles.floatingPearl, { top: '12%', left: '8%' }]}>
              <Text style={{ fontSize: 22 }}>🧋</Text>
            </View>
            <View style={[styles.floatingPearl, { top: '8%', right: '10%' }]}>
              <Text style={{ fontSize: 18 }}>✨</Text>
            </View>
            <View style={[styles.floatingPearl, { bottom: '14%', left: '12%' }]}>
              <Text style={{ fontSize: 16 }}>🫧</Text>
            </View>
            <View style={[styles.floatingPearl, { bottom: '10%', right: '8%' }]}>
              <Text style={{ fontSize: 20 }}>🧋</Text>
            </View>

            <View style={styles.dailyRewardCard}>
              {/* Premium Header Image */}
              <Image 
                source={require('./assets/daily_gift_header.png')} 
                style={styles.dailyRewardHeaderImage} 
              />

              {/* Title & Streak Info */}
              <View style={styles.dailyRewardHeaderContent}>
                <Text style={styles.dailyRewardTitle}>Daily Boba Drop!</Text>
                <Text style={styles.dailyRewardSubtitle}>
                  Keep your streak alive for bigger rewards!
                </Text>
                <View style={styles.dailyRewardStreakBadge}>
                  <Ionicons name="flame" size={14} color="#FF6B6B" style={{ marginRight: 4 }} />
                  <Text style={styles.dailyRewardStreakText}>
                    {claimableStreak === 1 ? 'New streak!' : `${claimableStreak}-day streak 🔥`}
                  </Text>
                </View>
              </View>

              {/* Boba-flavored day grid */}
              <View style={styles.dailyRewardGrid}>
                {[1, 2, 3, 4, 5, 6, 7].map((dayNum) => {
                  const isClaimed = dayNum < claimableStreak;
                  const isActive = dayNum === claimableStreak;
                  const isDay7 = dayNum === 7;

                  // Each day gets a unique boba flavor color
                  const dayColors = [
                    '#B39DDB', // Day 1: Taro purple
                    '#A5D6A7', // Day 2: Matcha green
                    '#8D6E63', // Day 3: Brown Sugar
                    '#FF8A80', // Day 4: Strawberry pink
                    '#80DEEA', // Day 5: Blue Curacao
                    '#FFE082', // Day 6: Mango gold
                    '#FF4081', // Day 7: Special neon pink
                  ];
                  const flavorColor = dayColors[dayNum - 1];

                  return (
                    <View
                      key={dayNum}
                      style={[
                        styles.dailyRewardDayBox,
                        { borderColor: isActive ? flavorColor : isClaimed ? 'rgba(76, 175, 80, 0.3)' : 'rgba(255, 255, 255, 0.06)' },
                        isActive && {
                          backgroundColor: `${flavorColor}18`,
                          shadowColor: flavorColor,
                          shadowOffset: { width: 0, height: 0 },
                          shadowOpacity: 0.5,
                          shadowRadius: 10,
                          elevation: 5,
                        },
                        isClaimed && styles.dailyRewardDayBoxClaimed,
                        isDay7 && { width: '47%', aspectRatio: 1.6 },
                      ]}
                    >
                      {/* Custom Rendered Boba Cup */}
                      <View style={{
                        width: isDay7 ? 38 : 30,
                        height: isDay7 ? 46 : 38,
                        justifyContent: 'flex-end',
                        alignItems: 'center',
                        marginBottom: 4,
                        position: 'relative'
                      }}>
                        {/* Straw */}
                        <View style={{
                          width: isDay7 ? 5 : 3.5,
                          height: isDay7 ? 14 : 12,
                          backgroundColor: isDay7 ? '#FFE082' : '#FFD700',
                          borderRadius: 2,
                          transform: [{ rotate: '15deg' }],
                          position: 'absolute',
                          top: 0,
                          right: isDay7 ? 11 : 9,
                          zIndex: 2,
                        }} />
                        
                        {/* Lid */}
                        <View style={{
                          width: isDay7 ? 32 : 24,
                          height: 3.5,
                          backgroundColor: '#FFFFFF',
                          borderRadius: 2,
                          position: 'absolute',
                          top: isDay7 ? 10 : 8,
                          zIndex: 3,
                        }} />

                        {/* Cup Body */}
                        <View style={{
                          width: isDay7 ? 26 : 20,
                          height: isDay7 ? 30 : 24,
                          borderWidth: 1.2,
                          borderColor: isClaimed ? 'rgba(76, 175, 80, 0.5)' : 'rgba(255, 255, 255, 0.7)',
                          borderBottomLeftRadius: 6,
                          borderBottomRightRadius: 6,
                          borderTopLeftRadius: 1.5,
                          borderTopRightRadius: 1.5,
                          backgroundColor: 'rgba(255, 255, 255, 0.05)',
                          overflow: 'hidden',
                          position: 'relative',
                        }}>
                          {/* Liquid (Flavor Colored) */}
                          <View style={{
                            position: 'absolute',
                            bottom: 0,
                            left: 0,
                            right: 0,
                            height: '75%',
                            backgroundColor: flavorColor,
                          }} />

                          {/* Tapioca Pearls inside the cup */}
                          <View style={{ position: 'absolute', bottom: 1, left: 2, width: 3, height: 3, borderRadius: 1.5, backgroundColor: '#000000', opacity: 0.8 }} />
                          <View style={{ position: 'absolute', bottom: 1, left: 6, width: 3, height: 3, borderRadius: 1.5, backgroundColor: '#000000', opacity: 0.8 }} />
                          <View style={{ position: 'absolute', bottom: 1, left: 10, width: 3, height: 3, borderRadius: 1.5, backgroundColor: '#000000', opacity: 0.8 }} />
                          {isDay7 && (
                            <View style={{ position: 'absolute', bottom: 1, left: 14, width: 3, height: 3, borderRadius: 1.5, backgroundColor: '#000000', opacity: 0.8 }} />
                          )}
                          <View style={{ position: 'absolute', bottom: 3.5, left: 4, width: 3, height: 3, borderRadius: 1.5, backgroundColor: '#000000', opacity: 0.8 }} />
                          <View style={{ position: 'absolute', bottom: 3.5, left: 8, width: 3, height: 3, borderRadius: 1.5, backgroundColor: '#000000', opacity: 0.8 }} />
                        </View>

                        {/* Claimed Checkmark Badge Overlay */}
                        {isClaimed && (
                          <View style={{
                            position: 'absolute',
                            top: 0,
                            left: 0,
                            right: 0,
                            bottom: 0,
                            justifyContent: 'center',
                            alignItems: 'center',
                            zIndex: 10,
                          }}>
                            <Ionicons name="checkmark-circle" size={isDay7 ? 20 : 16} color="#4CAF50" />
                          </View>
                        )}
                      </View>

                      {/* Day label */}
                      <Text style={[
                        styles.dailyRewardDayLabel,
                        isActive && { color: flavorColor, fontWeight: '800' },
                        isClaimed && { color: '#4CAF50' },
                      ]}>
                        {isDay7 ? '🌟 Day 7' : `Day ${dayNum}`}
                      </Text>

                      {/* Coin value */}
                      <View style={[
                        styles.dailyRewardCoinPill,
                        isActive && { backgroundColor: `${flavorColor}30`, borderColor: `${flavorColor}60` },
                        isClaimed && { backgroundColor: 'rgba(76, 175, 80, 0.15)', borderColor: 'rgba(76, 175, 80, 0.3)' },
                      ]}>
                        <Ionicons name="logo-usd" size={10} color={isActive ? flavorColor : isClaimed ? '#4CAF50' : '#FFD700'} style={{ marginRight: 2 }} />
                        <Text style={[
                          styles.dailyRewardDayValue,
                          isActive && { color: flavorColor },
                          isClaimed && { color: '#4CAF50' },
                        ]}>
                          {DAILY_REWARDS[dayNum - 1]}
                        </Text>
                      </View>
                    </View>
                  );
                })}
              </View>

              {/* Claim button */}
              <TouchableOpacity
                style={styles.dailyRewardClaimButton}
                activeOpacity={0.8}
                onPress={handleClaimDailyReward}
              >
                <Ionicons name="cafe" size={18} color="#0B0C10" style={{ marginRight: 6 }} />
                <Text style={styles.dailyRewardClaimButtonText}>
                  CLAIM +{DAILY_REWARDS[claimableStreak - 1]} COINS
                </Text>
              </TouchableOpacity>

              {/* Bottom flavor text */}
              <Text style={styles.dailyRewardFooter}>
                Day 7 mystery box = 500 coins! 🧋✨
              </Text>
            </View>
          </View>
        </Modal>
      </GestureHandlerRootView>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: THEME.colors.background,
  },
  // Ad Overlay styles
  adOverlayContainer: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(5, 3, 10, 0.95)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10000,
    padding: 24,
  },
  adCard: {
    width: '90%',
    maxWidth: 400,
    backgroundColor: 'rgba(24, 18, 38, 0.98)',
    borderWidth: 1.5,
    borderColor: 'rgba(255, 64, 129, 0.3)',
    borderRadius: 24,
    padding: 30,
    alignItems: 'center',
    shadowColor: '#FF4081',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 10,
  },
  adBadgeText: {
    fontSize: 11,
    color: '#FF4081',
    fontWeight: '800',
    letterSpacing: 2,
    marginBottom: 20,
    textTransform: 'uppercase',
  },
  adTimerCircle: {
    width: 70,
    height: 70,
    borderRadius: 35,
    borderWidth: 3,
    borderColor: '#FF4081',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
    backgroundColor: 'rgba(255, 64, 129, 0.1)',
  },
  adTimerText: {
    fontSize: 28,
    fontWeight: '900',
    color: '#FFFFFF',
  },
  adTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 10,
    textAlign: 'center',
  },
  adSubtitle: {
    fontSize: 15,
    color: THEME.colors.textPrimary,
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 22,
    fontStyle: 'italic',
  },
  adProgressContainer: {
    width: '100%',
    height: 6,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 3,
    overflow: 'hidden',
    marginBottom: 20,
  },
  adProgressBarFill: {
    height: '100%',
    backgroundColor: '#FF4081',
    borderRadius: 3,
  },
  adDisclaimer: {
    fontSize: 11,
    color: 'rgba(255, 255, 255, 0.3)',
    textAlign: 'center',
  },

  // Checkout Sheet styles
  // Checkout Sheet styles
  checkoutOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(5, 3, 10, 0.85)',
    justifyContent: 'flex-end',
    zIndex: 20000,
  },
  checkoutSheet: {
    backgroundColor: '#161622',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    padding: 24,
    borderTopWidth: 2,
    borderTopColor: 'rgba(179, 157, 219, 0.25)',
    shadowColor: '#B39DDB',
    shadowOffset: { width: 0, height: -8 },
    shadowOpacity: 0.25,
    shadowRadius: 20,
    elevation: 20,
    paddingBottom: Platform.OS === 'ios' ? 44 : 24,
  },
  checkoutHandle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    alignSelf: 'center',
    marginBottom: 16,
  },
  checkoutHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  checkoutAppIconImage: {
    width: 52,
    height: 52,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: 'rgba(179, 157, 219, 0.4)',
  },
  checkoutBannerImage: {
    width: '100%',
    height: 150,
    borderRadius: 18,
    marginBottom: 18,
    borderWidth: 1.5,
    borderColor: 'rgba(179, 157, 219, 0.2)',
    resizeMode: 'cover',
  },
  checkoutAppName: {
    fontSize: 18,
    fontWeight: '900',
    color: '#FFFFFF',
    letterSpacing: 0.5,
  },
  checkoutAppDeveloper: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.4)',
    fontWeight: '500',
    marginTop: 2,
  },
  checkoutCloseBtn: {
    padding: 4,
    borderRadius: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
  },
  checkoutCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    borderRadius: 20,
    padding: 16,
    borderWidth: 1.5,
    borderColor: 'rgba(179, 157, 219, 0.15)',
    marginBottom: 16,
  },
  checkoutDivider: {
    height: 1,
    backgroundColor: 'rgba(179, 157, 219, 0.12)',
    marginVertical: 12,
  },
  checkoutDetailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  checkoutLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: 'rgba(255, 255, 255, 0.4)',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  checkoutValue: {
    fontSize: 15,
    fontWeight: '700',
    color: '#FFF',
  },
  checkoutValuePrice: {
    fontSize: 20,
    fontWeight: '900',
    color: '#B39DDB',
    textShadowColor: 'rgba(179, 157, 219, 0.4)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 4,
  },
  checkoutSecurityPrompt: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(179, 157, 219, 0.06)',
    borderWidth: 1,
    borderColor: 'rgba(179, 157, 219, 0.18)',
    paddingVertical: 10,
    borderRadius: 14,
    marginBottom: 20,
  },
  checkoutSecurityText: {
    fontSize: 12,
    color: '#B39DDB',
    fontWeight: '600',
  },
  checkoutConfirmButton: {
    flexDirection: 'row',
    height: 52,
    backgroundColor: '#B39DDB',
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#B39DDB',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 10,
    elevation: 6,
  },
  checkoutConfirmText: {
    fontSize: 16,
    fontWeight: '900',
    color: '#0B0C10',
    letterSpacing: 0.5,
  },
  // Daily Reward Styles
  dailyRewardOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(5, 3, 10, 0.92)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 15000,
    padding: 16,
  },
  floatingPearl: {
    position: 'absolute',
    opacity: 0.5,
  },
  dailyRewardCard: {
    width: '95%',
    maxWidth: 400,
    backgroundColor: '#161622',
    borderWidth: 2,
    borderColor: 'rgba(179, 157, 219, 0.35)',
    borderRadius: 28,
    padding: 0,
    alignItems: 'center',
    overflow: 'hidden',
    shadowColor: '#B39DDB',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.35,
    shadowRadius: 24,
    elevation: 12,
  },
  dailyRewardHeaderImage: {
    width: '100%',
    height: 180,
    borderTopLeftRadius: 26,
    borderTopRightRadius: 26,
    resizeMode: 'cover',
  },
  dailyRewardHeaderContent: {
    width: '100%',
    paddingTop: 16,
    paddingBottom: 8,
    paddingHorizontal: 20,
    alignItems: 'center',
  },
  dailyRewardTitle: {
    fontSize: 24,
    fontWeight: '900',
    color: '#FFFFFF',
    marginBottom: 6,
    textAlign: 'center',
    letterSpacing: 0.5,
    textShadowColor: 'rgba(179, 157, 219, 0.5)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 8,
  },
  dailyRewardSubtitle: {
    fontSize: 13,
    color: 'rgba(255, 255, 255, 0.55)',
    textAlign: 'center',
    marginBottom: 12,
    lineHeight: 18,
  },
  dailyRewardStreakBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 107, 107, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(255, 107, 107, 0.3)',
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 5,
  },
  dailyRewardStreakText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#FF8A80',
  },
  dailyRewardGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    width: '100%',
    paddingHorizontal: 16,
    paddingTop: 18,
    paddingBottom: 8,
    gap: 8,
  },
  dailyRewardDayBox: {
    width: '22%',
    aspectRatio: 0.75,
    borderRadius: 18,
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    borderWidth: 1.5,
    borderColor: 'rgba(255, 255, 255, 0.06)',
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
    paddingVertical: 6,
  },
  dailyRewardDayBoxClaimed: {
    backgroundColor: 'rgba(76, 175, 80, 0.05)',
    opacity: 0.55,
  },
  dailyRewardDayLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: 'rgba(255, 255, 255, 0.4)',
    marginBottom: 3,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  dailyRewardCoinPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 215, 0, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(255, 215, 0, 0.2)',
    borderRadius: 10,
    paddingHorizontal: 7,
    paddingVertical: 2,
    marginTop: 4,
  },
  dailyRewardDayValue: {
    fontSize: 11,
    fontWeight: '800',
    color: '#FFD700',
  },
  dailyRewardClaimButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    width: '85%',
    height: 52,
    backgroundColor: '#B39DDB',
    borderRadius: 18,
    marginTop: 10,
    marginBottom: 6,
    shadowColor: '#B39DDB',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.45,
    shadowRadius: 12,
    elevation: 6,
  },
  dailyRewardClaimButtonText: {
    fontSize: 15,
    fontWeight: '900',
    color: '#0B0C10',
    letterSpacing: 1,
  },
  dailyRewardFooter: {
    fontSize: 11,
    color: 'rgba(255, 255, 255, 0.35)',
    textAlign: 'center',
    marginTop: 4,
    marginBottom: 18,
    fontStyle: 'italic',
  },
});
