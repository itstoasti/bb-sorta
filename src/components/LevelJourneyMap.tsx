import React, { useRef, useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Dimensions,
  Modal,
  ImageBackground,
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  withDelay,
  withSpring,
  Easing,
} from 'react-native-reanimated';
import { THEME } from '../utils/theme';
import { audioController } from '../utils/audio';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

interface CustomAlertButton {
  text: string;
  onPress?: () => void;
  style?: 'default' | 'cancel' | 'destructive';
}

interface CustomAlertState {
  visible: boolean;
  title: string;
  message: string;
  icon?: string;
  iconColor?: string;
  stationImage?: any;
  buttons: CustomAlertButton[];
}

// Stable star generator to populate the night sky evenly
const STARS_COUNT = 60;
const CHAPTER_SPACING = 360;
const STARS_SEEDED = Array.from({ length: STARS_COUNT }, (_, i) => {
  const rand = (seed: number) => {
    const x = Math.sin(seed) * 10000;
    return x - Math.floor(x);
  };
  const top = rand(i * 12.3) * 20000; // distribute along max scroll height (supports infinite levels)
  const left = rand(i * 27.7) * (SCREEN_WIDTH - 30) + 15;
  const size = rand(i * 35.1) * 2.8 + 1.2;
  const isCross = rand(i * 49.2) > 0.8;
  const speed = 1000 + rand(i * 53.6) * 1600;
  return { id: i, top, left, size, isCross, speed };
});

// Twinkling Star component
const TwinklingStar: React.FC<{ top: number; left: number; size: number; isCross: boolean; speed: number }> = ({
  top,
  left,
  size,
  isCross,
  speed,
}) => {
  const opacity = useSharedValue(Math.random() * 0.4 + 0.3);

  useEffect(() => {
    opacity.value = withRepeat(
      withTiming(Math.random() * 0.5 + 0.5, { duration: speed, easing: Easing.inOut(Easing.ease) }),
      -1,
      true
    );
  }, [opacity, speed]);

  const animStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
  }));

  return (
    <Animated.View
      style={[
        styles.star,
        {
          top,
          left,
          width: size,
          height: size,
          borderRadius: isCross ? 0 : size / 2,
        },
        animStyle,
      ]}
    >
      {isCross && (
        <View style={StyleSheet.absoluteFill}>
          <View style={[styles.starCrossLine, { width: size, height: 1, top: size / 2 - 0.5 }]} />
          <View style={[styles.starCrossLine, { height: size, width: 1, left: size / 2 - 0.5 }]} />
        </View>
      )}
    </Animated.View>
  );
};

// Stable clouds generator to populate the sky evenly up to 20,000px
const CLOUDS_COUNT = 30;
const CLOUDS_SEEDED = Array.from({ length: CLOUDS_COUNT }, (_, i) => {
  const rand = (seed: number) => {
    const x = Math.sin(seed) * 10000;
    return x - Math.floor(x);
  };
  const top = rand(i * 18.7) * 20000; // distribute along max scroll height (supports infinite levels)
  const width = rand(i * 31.4) * 60 + 70; // 70px to 130px
  const height = width * 0.28; // proportional height
  const speed = 25000 + rand(i * 44.1) * 20000; // 25s to 45s
  const delay = rand(i * 59.3) * 5000;
  return { id: i, top, width, height, speed, delay };
});

// Drifting Cloud component
const FloatingCloud: React.FC<{ top: number; width: number; height: number; speed: number; delay: number }> = ({
  top,
  width,
  height,
  speed,
  delay,
}) => {
  const translateX = useSharedValue(-width - 40);

  useEffect(() => {
    translateX.value = withDelay(
      delay,
      withRepeat(
        withTiming(SCREEN_WIDTH + 40, { duration: speed, easing: Easing.linear }),
        -1,
        false
      )
    );
  }, [translateX, speed, delay, width]);

  const animStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: translateX.value }],
  }));

  return (
    <Animated.View
      style={[
        styles.cloud,
        {
          top,
          width,
          height,
          borderRadius: height / 2,
        },
        animStyle,
      ]}
    />
  );
};

// 3D Isometric Floating Island Platform
const FloatingIsland: React.FC<{
  children: React.ReactNode;
  islandColor?: string;
  borderColor?: string;
}> = ({ children, islandColor = '#2E7D32', borderColor = '#1B5E20' }) => {
  return (
    <View style={styles.islandContainer}>
      <View style={styles.islandContent}>{children}</View>
      <View style={[styles.islandBase, { backgroundColor: islandColor, borderColor }]} />
      <View style={styles.islandShadow} />
    </View>
  );
};

// Shopkeeper Barista Chibi PNG Sticker component
const ShopkeeperBarista: React.FC<{
  task: 'sweeping' | 'brewing' | 'shaking' | 'serving' | 'cooking' | 'tasting' | 'celebrating' | 'floating' | 'silly' | 'drinking' | 'wink' | 'sleeping' | 'reading' | 'waving';
}> = ({ task }) => {
  const getSource = () => {
    switch (task) {
      case 'sweeping':
        return require('../../assets/shopkeeper_sweeping.png');
      case 'brewing':
        return require('../../assets/shopkeeper_brewing.png');
      case 'shaking':
        return require('../../assets/shopkeeper_shaking.png');
      case 'serving':
        return require('../../assets/shopkeeper_serving.png');
      case 'cooking':
        return require('../../assets/shopkeeper_cooking.png');
      case 'tasting':
        return require('../../assets/shopkeeper_tasting.png');
      case 'celebrating':
        return require('../../assets/shopkeeper_celebrating.png');
      case 'floating':
        return require('../../assets/shopkeeper_floating.png');
      case 'silly':
        return require('../../assets/shopkeeper_silly.png');
      case 'drinking':
        return require('../../assets/shopkeeper_drinking.png');
      case 'wink':
        return require('../../assets/shopkeeper_wink.png');
      case 'sleeping':
        return require('../../assets/shopkeeper_sleeping.png');
      case 'reading':
        return require('../../assets/shopkeeper_reading.png');
      case 'waving':
        return require('../../assets/shopkeeper_waving.png');
    }
  };

  return (
    <View style={styles.shopkeeperFrame}>
      <Image source={getSource()} style={styles.shopkeeperSticker} />
    </View>
  );
};

// Sweeping Scene (Level 1)
const SweepingScene: React.FC = () => (
  <FloatingIsland islandColor="#4CAF50" borderColor="#2E7D32">
    <View style={{ alignItems: 'center' }}>
      <ShopkeeperBarista task="sweeping" />
      <Text style={styles.landmarkText}>Prep Time</Text>
    </View>
  </FloatingIsland>
);

// Brewing Scene (Level 5)
const BrewingScene: React.FC = () => (
  <FloatingIsland islandColor="#8D6E63" borderColor="#5D4037">
    <View style={{ alignItems: 'center' }}>
      <ShopkeeperBarista task="brewing" />
      <Text style={styles.landmarkText}>Brewing Tea</Text>
    </View>
  </FloatingIsland>
);

// Shaking Scene (Level 10)
const ShakingScene: React.FC = () => (
  <FloatingIsland islandColor="#00838F" borderColor="#006064">
    <View style={{ alignItems: 'center' }}>
      <ShopkeeperBarista task="shaking" />
      <Text style={styles.landmarkText}>Shaking Mix</Text>
    </View>
  </FloatingIsland>
);

// Serving Scene (Level 15)
const ServingScene: React.FC = () => (
  <FloatingIsland islandColor="#AD1457" borderColor="#880E4F">
    <View style={{ alignItems: 'center' }}>
      <ShopkeeperBarista task="serving" />
      <Text style={styles.landmarkText}>Serving Cup</Text>
    </View>
  </FloatingIsland>
);

// Cooking Scene (Level 20)
const CookingScene: React.FC = () => (
  <FloatingIsland islandColor="#37474F" borderColor="#212121">
    <View style={{ alignItems: 'center' }}>
      <ShopkeeperBarista task="cooking" />
      <Text style={styles.landmarkText}>Boiling Pearls</Text>
    </View>
  </FloatingIsland>
);

// Tasting Scene (Level 25)
const TastingScene: React.FC = () => (
  <FloatingIsland islandColor="#00796B" borderColor="#004D40">
    <View style={{ alignItems: 'center' }}>
      <ShopkeeperBarista task="tasting" />
      <Text style={styles.landmarkText}>Tasting Flavor</Text>
    </View>
  </FloatingIsland>
);

// Celebrating Scene (Level 30)
const CelebratingScene: React.FC = () => (
  <FloatingIsland islandColor="#F57F17" borderColor="#E65100">
    <View style={{ alignItems: 'center' }}>
      <ShopkeeperBarista task="celebrating" />
      <Text style={styles.landmarkText}>Master Barista</Text>
    </View>
  </FloatingIsland>
);

// Floating Scene (Level 35)
const FloatingScene: React.FC = () => (
  <FloatingIsland islandColor="#673AB7" borderColor="#512DA8">
    <View style={{ alignItems: 'center' }}>
      <ShopkeeperBarista task="floating" />
      <Text style={styles.landmarkText}>Pearl Floating</Text>
    </View>
  </FloatingIsland>
);

// Silly Scene (Level 40)
const SillyScene: React.FC = () => (
  <FloatingIsland islandColor="#FF5722" borderColor="#E64A19">
    <View style={{ alignItems: 'center' }}>
      <ShopkeeperBarista task="silly" />
      <Text style={styles.landmarkText}>Silly Break</Text>
    </View>
  </FloatingIsland>
);

// Drinking Scene (Level 45)
const DrinkingScene: React.FC = () => (
  <FloatingIsland islandColor="#B39DDB" borderColor="#673AB7">
    <View style={{ alignItems: 'center' }}>
      <ShopkeeperBarista task="drinking" />
      <Text style={styles.landmarkText}>Enjoying Boba</Text>
    </View>
  </FloatingIsland>
);

// Wink Scene (Level 50)
const WinkScene: React.FC = () => (
  <FloatingIsland islandColor="#F48FB1" borderColor="#C2185B">
    <View style={{ alignItems: 'center' }}>
      <ShopkeeperBarista task="wink" />
      <Text style={styles.landmarkText}>Silly Wink</Text>
    </View>
  </FloatingIsland>
);

// Sleeping Scene (Level 55)
const SleepingScene: React.FC = () => (
  <FloatingIsland islandColor="#90CAF9" borderColor="#1976D2">
    <View style={{ alignItems: 'center' }}>
      <ShopkeeperBarista task="sleeping" />
      <Text style={styles.landmarkText}>Tea Nap</Text>
    </View>
  </FloatingIsland>
);

// Reading Scene (Level 60)
const ReadingScene: React.FC = () => (
  <FloatingIsland islandColor="#A5D6A7" borderColor="#388E3C">
    <View style={{ alignItems: 'center' }}>
      <ShopkeeperBarista task="reading" />
      <Text style={styles.landmarkText}>Secret Recipe</Text>
    </View>
  </FloatingIsland>
);

// Waving Scene (Level 65)
const WavingScene: React.FC = () => (
  <FloatingIsland islandColor="#FFE082" borderColor="#FFA000">
    <View style={{ alignItems: 'center' }}>
      <ShopkeeperBarista task="waving" />
      <Text style={styles.landmarkText}>Hello Friend!</Text>
    </View>
  </FloatingIsland>
);

// Bouncing active level Boba Character
const ActiveBobaNode: React.FC<{
  levelNum: number;
  isTimeRace: boolean;
  onPress: () => void;
  themeColor?: string;
}> = ({
  levelNum,
  isTimeRace,
  onPress,
  themeColor = '#66FCF1',
}) => {
  const bobY = useSharedValue(0);
  const scale = useSharedValue(1);

  useEffect(() => {
    bobY.value = withRepeat(
      withTiming(-8, { duration: 600, easing: Easing.inOut(Easing.quad) }),
      -1,
      true
    );
  }, [bobY]);

  const animStyle = useAnimatedStyle(() => ({
    transform: [
      { translateY: bobY.value },
      { scale: scale.value }
    ],
  }));

  const handlePressIn = () => {
    scale.value = withSpring(0.92);
  };

  const handlePressOut = () => {
    scale.value = withSpring(1);
    onPress();
  };

  return (
    <Animated.View style={[styles.activeNodeContainer, animStyle]}>
      <TouchableOpacity
        activeOpacity={0.9}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        style={styles.activeNodeTouch}
      >
        {/* Straw */}
        <View style={styles.activeNodeStraw} />
        {/* Bear ears */}
        <View style={[styles.activeNodeEar, { left: 5, backgroundColor: themeColor }]} />
        <View style={[styles.activeNodeEar, { right: 5, backgroundColor: themeColor }]} />
        {/* Cup */}
        <View style={[styles.activeNodeCup, { borderColor: themeColor, shadowColor: themeColor }]}>
          {/* Lid */}
          <View style={styles.activeNodeLid} />
          {/* Liquid */}
          <View style={styles.activeNodeLiquid}>
            <View style={styles.activeNodeFace}>
              <View style={styles.activeNodeEyes}>
                <View style={styles.activeNodeEye} />
                <View style={styles.activeNodeEye} />
              </View>
              <View style={styles.activeNodeBlushRow}>
                <View style={styles.activeNodeBlush} />
                <View style={styles.activeNodeBlush} />
              </View>
              <View style={styles.activeNodeMouth} />
            </View>
            {/* Boba pearls */}
            <View style={[styles.activeNodePearl, { bottom: 2, left: 3 }]} />
            <View style={[styles.activeNodePearl, { bottom: 4, left: 8 }]} />
            <View style={[styles.activeNodePearl, { bottom: 1.5, right: 3 }]} />
          </View>
        </View>

        {/* Level text badge */}
        <View style={[styles.activeNodeLabel, { backgroundColor: themeColor, shadowColor: themeColor }]}>
          {isTimeRace ? (
            <Ionicons name="alarm" size={12} color="#0B0C10" />
          ) : (
            <Text style={styles.activeNodeLabelText}>{levelNum}</Text>
          )}
        </View>
      </TouchableOpacity>
    </Animated.View>
  );
};

// Swirling Neon Space Portal indicating infinite progression at path end
const InfinitePortal: React.FC = () => {
  const rotation = useSharedValue(0);

  useEffect(() => {
    rotation.value = withRepeat(
      withTiming(360, { duration: 4000, easing: Easing.linear }),
      -1,
      false
    );
  }, [rotation]);

  const animStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${rotation.value}deg` }],
  }));

  return (
    <FloatingIsland islandColor="#120B24" borderColor="#23173D">
      <View style={{ alignItems: 'center', justifyContent: 'center', height: 75, marginTop: 5 }}>
        <Animated.View style={animStyle}>
          <Ionicons
            name="sync"
            size={32}
            color="#66FCF1"
            style={{
              textShadowColor: '#66FCF1',
              textShadowOffset: { width: 0, height: 0 },
              textShadowRadius: 8,
            }}
          />
        </Animated.View>
        <Text style={styles.landmarkText}>Infinite Path</Text>
      </View>
    </FloatingIsland>
  );
};

interface LevelJourneyMapProps {
  coins: number;
  unlockedLevel: number;
  levelStars: Record<number, number>;
  unlockedChapters: number;
  onUnlockNextChapter: () => boolean;
  onSelectLevel: (level: number) => void;
  onBack: () => void;
}

const CHAPTERS = [
  {
    id: 1,
    name: 'Matcha Meadows',
    startLevel: 1,
    endLevel: 20,
    themeColor: '#81C784', // Pastel green
    accentColor: '#2E7D32',
    stationName: 'Meadows Depot',
    vehicleName: 'Taro Express Train',
    vehicleIcon: 'subway-outline',
    description: 'A lush green valley filled with wild matcha tea leaves and sweet cream rivers.',
    unlockCost: 0,
  },
  {
    id: 2,
    name: 'Sakura Station',
    startLevel: 21,
    endLevel: 40,
    themeColor: '#F48FB1', // Sakura pink
    accentColor: '#C2185B',
    stationName: 'Sakura Aerodrome',
    vehicleName: 'Blossom Hot Balloon',
    vehicleIcon: 'balloon-outline',
    description: 'A dreamy pink town showered in falling cherry blossoms and sweet rose milk.',
    unlockCost: 300,
  },
  {
    id: 3,
    name: 'Coconut Coast',
    startLevel: 41,
    endLevel: 60,
    themeColor: '#4DD0E1', // Turquoise cyan
    accentColor: '#00838F',
    stationName: 'Coconut Harbor',
    vehicleName: 'Boba Cruise Ferry',
    vehicleIcon: 'boat-outline',
    description: 'A sun-drenched beach with crystal turquoise waters, coconut palms, and mango waves.',
    unlockCost: 400,
  },
  {
    id: 4,
    name: 'Taro Town',
    startLevel: 61,
    endLevel: 80,
    themeColor: '#B39DDB', // Taro purple
    accentColor: '#5E35B1',
    stationName: 'Taro Observatory',
    vehicleName: 'Mystic Warp Portal',
    vehicleIcon: 'planet-outline',
    description: 'A cozy starlit mountain village famous for purple taro root recipes and floating pearls.',
    unlockCost: 500,
  },
  {
    id: 5,
    name: 'Neon Nebula',
    startLevel: 81,
    endLevel: 100,
    themeColor: '#00E5FF', // Neon blue
    accentColor: '#006064',
    stationName: 'Nebula Space Port',
    vehicleName: 'Cosmic Starship',
    vehicleIcon: 'rocket-outline',
    description: 'A futuristic cybercity floating in deep space, glowing with neon blue boba fluids.',
    unlockCost: 600,
  }
];

export const LevelJourneyMap: React.FC<LevelJourneyMapProps> = ({
  coins,
  unlockedLevel,
  levelStars,
  unlockedChapters,
  onUnlockNextChapter,
  onSelectLevel,
  onBack,
}) => {
  const scrollViewRef = useRef<ScrollView>(null);
  const [customAlert, setCustomAlert] = useState<CustomAlertState | null>(null);
  const [townMapVisible, setTownMapVisible] = useState<boolean>(false);

  // Auto-scroll to active level on mount
  useEffect(() => {
    const timer = setTimeout(() => {
      const activeIndex = Math.max(0, unlockedLevel - 1);
      const activeSepCount = Math.floor(activeIndex / 20);
      const activeY = activeIndex * 130 + 35 + activeSepCount * CHAPTER_SPACING;
      const viewportHeight = Dimensions.get('window').height;
      const targetY = Math.max(0, activeY - viewportHeight / 2 + 100);
      scrollViewRef.current?.scrollTo({ y: targetY, animated: true });
    }, 500);
    return () => clearTimeout(timer);
  }, [unlockedLevel]);

  const getPositionForIndex = (index: number) => {
    // Alternates node positions left-to-right to create a winding snake path
    const pattern = [0.5, 0.28, 0.5, 0.72]; // Center, Left, Center, Right
    const posVal = pattern[index % 4];
    return SCREEN_WIDTH * posVal - 27; // Center offset adjusted by bubble size (diameter 54px / 2 = 27px)
  };

  const handleLevelPress = (levelNum: number) => {
    if (levelNum > unlockedLevel) {
      audioController.play('click');
      setCustomAlert({
        visible: true,
        title: 'Level Locked',
        message: 'Beat the preceding levels to unlock this puzzle!',
        icon: 'lock-closed',
        iconColor: '#FF8A80',
        buttons: [{ text: 'GOT IT', onPress: () => setCustomAlert(null) }],
      });
      return;
    }
    audioController.play('click');
    onSelectLevel(levelNum);
  };

  const handleBuyNextChapter = (chapterNum: number) => {
    const nextChap = CHAPTERS.find(c => c.id === chapterNum + 1);
    if (!nextChap) return;

    const cost = nextChap.unlockCost;
    if (coins < cost) {
      audioController.play('click');
      setCustomAlert({
        visible: true,
        title: 'Insufficient Coins',
        message: `Unlocking ${nextChap.name} costs ${cost} coins. Beat more levels to earn gold!`,
        icon: 'logo-usd',
        iconColor: '#FFD700',
        buttons: [{ text: 'OK', onPress: () => setCustomAlert(null) }],
      });
      return;
    }

    const stationImages = [
      require('../../assets/meadows_depot.png'), // Index 0 (Chapter 1)
      require('../../assets/sakura_aerodrome.png'), // Index 1 (Chapter 2)
      require('../../assets/coconut_harbor.png'), // Index 2 (Chapter 3)
      require('../../assets/taro_observatory.png'), // Index 3 (Chapter 4)
      require('../../assets/cosmic_terminal.png'), // Index 4 (Chapter 5)
    ];
    const nextChapImage = stationImages[chapterNum];

    setCustomAlert({
      visible: true,
      title: `Travel to ${nextChap.name}?`,
      message: `Would you like to unlock the travel route to ${nextChap.name} using the ${CHAPTERS[chapterNum - 1].vehicleName} for ${cost} coins?`,
      icon: nextChap.vehicleIcon as any,
      iconColor: nextChap.themeColor,
      stationImage: nextChapImage,
      buttons: [
        { text: 'CANCEL', onPress: () => setCustomAlert(null), style: 'cancel' },
        {
          text: 'TRAVEL',
          onPress: () => {
            setCustomAlert(null);
            const success = onUnlockNextChapter();
            if (success) {
              setTimeout(() => {
                setCustomAlert({
                  visible: true,
                  title: 'Town Unlocked!',
                  message: `Welcome to ${nextChap.name}! The travel route is active!`,
                  icon: 'checkmark-circle',
                  iconColor: '#66FCF1',
                  stationImage: nextChapImage,
                  buttons: [{ text: 'LET\'S GO', onPress: () => {
                    setCustomAlert(null);
                    // Scroll to the new chapter start!
                    const targetY = chapterNum * 20 * 130 + chapterNum * CHAPTER_SPACING - 20;
                    scrollViewRef.current?.scrollTo({ y: targetY, animated: true });
                  }}],
                });
              }, 400);
            }
          },
        },
      ],
    });
  };

  // Render thick 3D boba river connection line between level nodes
  const renderConnector = (index: number, nextIndex: number) => {
    const startX = getPositionForIndex(index) + 27;
    const endX = getPositionForIndex(nextIndex) + 27;
    
    // Generalized coordinates
    const startY = index * 130 + 62 + Math.floor(index / 20) * CHAPTER_SPACING;
    const endY = nextIndex * 130 + 62 + Math.floor(nextIndex / 20) * CHAPTER_SPACING;
    
    const dy = endY - startY;
    const dx = endX - startX;
    const dist = Math.sqrt(dx * dx + dy * dy);
    const angle = Math.atan2(dy, dx) * (180 / Math.PI);

    const isLocked = nextIndex + 1 > unlockedLevel;
    const crossesChapter = Math.floor(index / 20) !== Math.floor(nextIndex / 20);

    if (crossesChapter) {
      // Golden dashed travel line crossing between towns
      return (
        <View
          key={`link_${index}`}
          style={[
            styles.pathLinkOuter,
            {
              left: startX,
              top: startY - 6,
              width: dist,
              transform: [{ rotate: `${angle}deg` }],
              backgroundColor: 'transparent',
              borderColor: isLocked ? 'rgba(255, 215, 0, 0.15)' : '#FFD700',
              borderWidth: 2,
              borderStyle: 'dashed',
              height: 12,
              borderRadius: 6,
            },
          ]}
        />
      );
    }

    return (
      <View
        key={`link_${index}`}
        style={[
          styles.pathLinkOuter,
          {
            left: startX,
            top: startY - 10, // Center 20px high river on the 62px node center
            width: dist,
            transform: [{ rotate: `${angle}deg` }],
            backgroundColor: isLocked ? '#252932' : '#5D4037',
            borderColor: isLocked ? '#393E46' : '#3E2723',
          },
        ]}
      >
        <View
          style={[
            styles.pathLinkInner,
            {
              backgroundColor: isLocked ? '#3E4654' : '#8D6E63',
            },
          ]}
        >
          {!isLocked && (
            <View style={styles.pearlOverlayRow}>
              <View style={[styles.riverPearl, { left: '20%' }]} />
              <View style={[styles.riverPearl, { left: '50%' }]} />
              <View style={[styles.riverPearl, { left: '80%' }]} />
            </View>
          )}
        </View>
      </View>
    );
  };

  const renderStarsRowFloating = (starsCount: number) => {
    return (
      <View style={styles.floatingStarsRow}>
        <Ionicons name="star" size={10} color={starsCount >= 1 ? '#FFD700' : 'rgba(255,255,255,0.15)'} />
        <Ionicons name="star" size={12} color={starsCount >= 2 ? '#FFD700' : 'rgba(255,255,255,0.15)'} style={{ marginTop: -3, marginHorizontal: 1 }} />
        <Ionicons name="star" size={10} color={starsCount >= 3 ? '#FFD700' : 'rgba(255,255,255,0.15)'} />
      </View>
    );
  };

  const renderNode = (levelNum: number, index: number) => {
    const isLocked = levelNum > unlockedLevel;
    const isActive = levelNum === unlockedLevel;
    const stars = levelStars[levelNum] || 0;
    const isTimeRace = levelNum % 10 === 0;

    const leftPos = getPositionForIndex(index);
    const sepCount = Math.floor(index / 20);
    const nodeTop = index * 130 + 35 + sepCount * CHAPTER_SPACING;

    const chap = CHAPTERS[Math.min(CHAPTERS.length - 1, Math.floor(index / 20))];

    return (
      <View
        key={`level_node_${levelNum}`}
        style={[styles.nodeContainer, { left: leftPos, top: nodeTop }]}
      >
        {isActive ? (
          <ActiveBobaNode
            levelNum={levelNum}
            isTimeRace={isTimeRace}
            onPress={() => handleLevelPress(levelNum)}
            themeColor={chap.themeColor}
          />
        ) : (
          <View style={styles.nodeItemWrapper}>
            {/* Stars floating above cleared nodes */}
            {!isLocked && renderStarsRowFloating(stars)}

            <TouchableOpacity
              activeOpacity={0.8}
              style={[
                styles.bubbleCircle,
                isLocked 
                  ? styles.bubbleCircleLocked 
                  : {
                      borderColor: chap.themeColor,
                      backgroundColor: `${chap.themeColor}22`,
                      shadowColor: chap.themeColor,
                    },
                isTimeRace && !isLocked && styles.bubbleCircleTimeRace,
              ]}
              onPress={() => handleLevelPress(levelNum)}
            >
              {/* Gel glass highlight */}
              {!isLocked && <View style={styles.glassShine} />}

              {isLocked ? (
                <Ionicons name="lock-closed" size={18} color="rgba(255, 255, 255, 0.25)" />
              ) : isTimeRace ? (
                <Ionicons name="alarm" size={20} color="#FFF" style={{ textShadowColor: 'rgba(0,0,0,0.3)', textShadowOffset: { width: 0, height: 1 }, textShadowRadius: 2 }} />
              ) : (
                <Text style={styles.bubbleText}>{levelNum}</Text>
              )}
            </TouchableOpacity>

            <Text style={[styles.nodeSubLabel, isLocked && styles.nodeSubLabelLocked]}>
              Level {levelNum}
            </Text>
          </View>
        )}
      </View>
    );
  };

  const renderLandmarkForIndex = (index: number) => {
    if (index !== 0 && (index + 1) % 5 !== 0) return null;

    const isLeft = index % 2 === 1;
    const landmarkLeft = isLeft ? SCREEN_WIDTH * 0.05 : SCREEN_WIDTH * 0.64;
    const landmarkTop = index * 130 + 10 + Math.floor(index / 20) * CHAPTER_SPACING;

    const cycle = index === 0 ? 0 : Math.floor((index + 1) / 5) % 14;

    let sceneComponent = null;
    switch (cycle) {
      case 0: sceneComponent = <SweepingScene />; break;
      case 1: sceneComponent = <BrewingScene />; break;
      case 2: sceneComponent = <ShakingScene />; break;
      case 3: sceneComponent = <ServingScene />; break;
      case 4: sceneComponent = <CookingScene />; break;
      case 5: sceneComponent = <TastingScene />; break;
      case 6: sceneComponent = <CelebratingScene />; break;
      case 7: sceneComponent = <FloatingScene />; break;
      case 8: sceneComponent = <SillyScene />; break;
      case 9: sceneComponent = <DrinkingScene />; break;
      case 10: sceneComponent = <WinkScene />; break;
      case 11: sceneComponent = <SleepingScene />; break;
      case 12: sceneComponent = <ReadingScene />; break;
      case 13: sceneComponent = <WavingScene />; break;
    }

    return (
      <View key={`l_${index}`} style={[styles.landmarkWrapper, { left: landmarkLeft, top: landmarkTop }]} pointerEvents="none">
        {sceneComponent}
      </View>
    );
  };

// Custom Illustration for Sakura Aerodrome (Chapter 2)
const SakuraAerodromeIllustration: React.FC<{ themeColor: string; isUnlocked: boolean }> = ({ themeColor, isUnlocked }) => (
  <View style={styles.customIllustContainer}>
    {/* Soft Pink Sakura Sky Background */}
    <View style={[styles.customIllustBg, { backgroundColor: '#FFF0F5' }]} />
    
    {/* Floating clouds */}
    <View style={[styles.illustCloud, { top: 30, left: 20, width: 60, height: 25, borderRadius: 12 }]} />
    <View style={[styles.illustCloud, { top: 120, right: 15, width: 80, height: 30, borderRadius: 15 }]} />
    
    {/* Floating Sakura Petals */}
    <View style={[styles.sakuraPetal, { top: 20, right: 40, transform: [{ rotate: '15deg' }] }]} />
    <View style={[styles.sakuraPetal, { top: 70, left: 35, transform: [{ rotate: '-25deg' }] }]} />
    <View style={[styles.sakuraPetal, { top: 140, left: 60, transform: [{ rotate: '45deg' }] }]} />
    <View style={[styles.sakuraPetal, { top: 90, right: 50, transform: [{ rotate: '-10deg' }] }]} />

    {/* Center visual: Balloon icon in soft container */}
    <View style={[styles.illustIconCircle, { borderColor: isUnlocked ? 'rgba(102, 252, 241, 0.4)' : `${themeColor}40` }]}>
      <Ionicons name="balloon-outline" size={72} color={themeColor} />
    </View>
  </View>
);

// Custom Illustration for Coconut Harbor (Chapter 3)
const CoconutHarborIllustration: React.FC<{ themeColor: string; isUnlocked: boolean }> = ({ themeColor, isUnlocked }) => (
  <View style={styles.customIllustContainer}>
    {/* Light Cyan Sky/Sea Background */}
    <View style={[styles.customIllustBg, { backgroundColor: '#E0F7FA' }]} />
    
    {/* Wave lines at the bottom */}
    <View style={[styles.illustWave, { bottom: 15, left: 10, width: 180 }]} />
    <View style={[styles.illustWave, { bottom: 35, left: 30, width: 140 }]} />

    {/* Palm Fronds at the top corner */}
    <View style={[styles.palmFrond, { top: -10, left: -10, transform: [{ rotate: '30deg' }] }]} />
    <View style={[styles.palmFrond, { top: -20, left: 20, transform: [{ rotate: '10deg' }] }]} />

    {/* Center visual: Boat icon in soft container */}
    <View style={[styles.illustIconCircle, { borderColor: isUnlocked ? 'rgba(102, 252, 241, 0.4)' : `${themeColor}40` }]}>
      <Ionicons name="boat-outline" size={72} color={themeColor} />
    </View>
  </View>
);

// Custom Illustration for Taro Observatory (Chapter 4)
const TaroObservatoryIllustration: React.FC<{ themeColor: string; isUnlocked: boolean }> = ({ themeColor, isUnlocked }) => (
  <View style={styles.customIllustContainer}>
    {/* Deep Soft Lavender Sky Background */}
    <View style={[styles.customIllustBg, { backgroundColor: '#F3E5F5' }]} />
    
    {/* Waning Taro Planet at bottom right */}
    <View style={styles.illustPlanet} />

    {/* Twinkling Tiny Stars */}
    <View style={[styles.illustStar, { top: 25, left: 30 }]} />
    <View style={[styles.illustStar, { top: 40, right: 35 }]} />
    <View style={[styles.illustStar, { bottom: 60, left: 40 }]} />
    
    {/* Center visual: Space Planet icon in soft container */}
    <View style={[styles.illustIconCircle, { borderColor: isUnlocked ? 'rgba(102, 252, 241, 0.4)' : `${themeColor}40` }]}>
      <Ionicons name="planet-outline" size={72} color={themeColor} />
    </View>
  </View>
);

// Custom Illustration for Cosmic Terminal (End Game)
const CosmicTerminalIllustration: React.FC = () => (
  <View style={styles.customIllustContainer}>
    {/* Cosmic Dark Gold Background */}
    <View style={[styles.customIllustBg, { backgroundColor: '#1C152B' }]} />
    
    {/* Stars */}
    <View style={[styles.illustStar, { top: 25, left: 30, backgroundColor: '#FFD700' }]} />
    <View style={[styles.illustStar, { top: 40, right: 35, backgroundColor: '#FFD700' }]} />
    <View style={[styles.illustStar, { bottom: 60, left: 40, backgroundColor: '#FFD700' }]} />
    
    <View style={[styles.illustIconCircle, { borderColor: 'rgba(255, 215, 0, 0.4)' }]}>
      <Ionicons name="trophy" size={72} color="#FFD700" />
    </View>
  </View>
);

  const renderSeparatorCard = (chapterNum: number) => {
    const currentChap = CHAPTERS[chapterNum - 1];
    const nextChap = CHAPTERS[chapterNum];
    const isUnlocked = unlockedChapters > chapterNum;
    
    // Y position for this card
    const cardTop = chapterNum * 20 * 130 + 35 + (chapterNum - 1) * CHAPTER_SPACING;

    if (!nextChap) return null;

    return (
      <View key={`sep_card_${chapterNum}`} style={[
        styles.separatorCard, 
        { 
          top: cardTop,
          borderColor: isUnlocked ? 'rgba(102, 252, 241, 0.35)' : `${nextChap.themeColor}50`,
          shadowColor: isUnlocked ? 'rgba(102, 252, 241, 0.2)' : `${nextChap.themeColor}20`,
        }
      ]}>
        {/* Central Station Image / Illustration */}
        <View style={styles.stationHeroContainer}>
          {chapterNum === 1 ? (
            <Image 
              source={require('../../assets/meadows_depot.png')} 
              style={styles.stationHeroImage} 
            />
          ) : chapterNum === 2 ? (
            <Image 
              source={require('../../assets/sakura_aerodrome.png')} 
              style={[styles.stationHeroImage, !isUnlocked && { opacity: 0.55 }]} 
            />
          ) : chapterNum === 3 ? (
            <Image 
              source={require('../../assets/coconut_harbor.png')} 
              style={[styles.stationHeroImage, !isUnlocked && { opacity: 0.55 }]} 
            />
          ) : chapterNum === 4 ? (
            <Image 
              source={require('../../assets/taro_observatory.png')} 
              style={[styles.stationHeroImage, !isUnlocked && { opacity: 0.55 }]} 
            />
          ) : (
            <View style={[styles.stationHeroIconFrame, { borderColor: isUnlocked ? 'rgba(102, 252, 241, 0.25)' : `${nextChap.themeColor}30` }]}>
              <Ionicons 
                name={currentChap.vehicleIcon as any} 
                size={48} 
                color={isUnlocked ? '#66FCF1' : nextChap.themeColor} 
              />
            </View>
          )}
        </View>

        {/* Info Details & Actions (placed below the image) */}
        <View style={styles.stationDetailsContainer}>
          <Text style={styles.separatorTitle}>{currentChap.stationName}</Text>

          {!isUnlocked ? (
            <TouchableOpacity
              activeOpacity={0.8}
              style={[styles.unlockButton, { backgroundColor: nextChap.themeColor }, coins < nextChap.unlockCost && styles.unlockButtonDisabled]}
              onPress={() => handleBuyNextChapter(chapterNum)}
            >
              <Ionicons name="logo-usd" size={14} color="#0B0C10" style={{ marginRight: 4 }} />
              <Text style={styles.unlockButtonText}>Travel for {nextChap.unlockCost}</Text>
            </TouchableOpacity>
          ) : (
            <View style={styles.unlockedTag}>
              <Ionicons name="checkmark-circle" size={14} color="#66FCF1" style={{ marginRight: 4 }} />
              <Text style={styles.unlockedTagText}>TOWN ACCESS ACTIVE</Text>
            </View>
          )}
        </View>
      </View>
    );
  };

  const renderCosmicTerminalCard = () => {
    const cardTop = 5 * 20 * 130 + 35 + 4 * CHAPTER_SPACING;
    return (
      <View key="cosmic_terminal" style={[
        styles.separatorCard, 
        { 
          top: cardTop,
          borderColor: 'rgba(255, 215, 0, 0.35)',
          shadowColor: 'rgba(255, 215, 0, 0.2)',
        }
      ]}>
        {/* Central Trophy Illustration */}
        <View style={styles.stationHeroContainer}>
          <Image 
            source={require('../../assets/cosmic_terminal.png')} 
            style={styles.stationHeroImage} 
          />
        </View>

        {/* Details */}
        <View style={styles.stationDetailsContainer}>
          <Text style={styles.separatorTitle}>Cosmic Boba Terminal</Text>
          
          <View style={styles.unlockedTag}>
            <Ionicons name="star" size={14} color="#FFD700" style={{ marginRight: 4 }} />
            <Text style={[styles.unlockedTagText, { color: '#FFD700' }]}>BOBA GRANDMASTER</Text>
          </View>
        </View>
      </View>
    );
  };

  const TeleportationMapModal = () => {
    return (
      <Modal
        visible={townMapVisible}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setTownMapVisible(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContentCard}>
            <View style={styles.modalHeaderRow}>
              <Text style={styles.modalTitleText}>🗺️ Town Teleport Map</Text>
              <TouchableOpacity 
                style={styles.modalCloseButton} 
                onPress={() => {
                  audioController.play('click');
                  setTownMapVisible(false);
                }}
              >
                <Ionicons name="close" size={24} color="#FFF" />
              </TouchableOpacity>
            </View>

            <ScrollView 
              showsVerticalScrollIndicator={false}
              style={{ width: '100%', marginTop: 12 }}
            >
              {CHAPTERS.map((chap) => {
                const isUnlocked = unlockedChapters >= chap.id;
                const isActiveTown = unlockedLevel >= chap.startLevel && unlockedLevel <= chap.endLevel;
                const cost = chap.unlockCost;
                
                // Count stars in this town
                let earnedStars = 0;
                for (let lvl = chap.startLevel; lvl <= chap.endLevel; lvl++) {
                  earnedStars += levelStars[lvl] || 0;
                }
                const maxStars = 20 * 3; // 20 levels * 3 stars

                return (
                  <View 
                    key={`town_card_${chap.id}`}
                    style={[
                      styles.townCard,
                      { 
                        borderColor: isUnlocked ? chap.themeColor : 'rgba(255,255,255,0.06)',
                        backgroundColor: isUnlocked ? 'rgba(20, 17, 30, 0.9)' : 'rgba(10, 8, 15, 0.9)',
                      }
                    ]}
                  >
                    {/* Glow backdrop for unlocked cards */}
                    {isUnlocked && (
                      <View style={[styles.townCardGlow, { backgroundColor: chap.themeColor }]} />
                    )}

                    <View style={styles.townCardHeader}>
                      <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                        <Ionicons 
                          name={chap.vehicleIcon as any} 
                          size={20} 
                          color={isUnlocked ? chap.themeColor : '#555'} 
                          style={{ marginRight: 8 }}
                        />
                        <Text style={[
                          styles.townNameText,
                          { color: isUnlocked ? '#FFF' : '#666' }
                        ]}>
                          {chap.name}
                        </Text>
                      </View>
                      
                      {/* Badge status */}
                      {isActiveTown ? (
                        <View style={[styles.activeTownBadge, { backgroundColor: chap.themeColor }]}>
                          <Text style={styles.activeTownBadgeText}>📍 CURRENT</Text>
                        </View>
                      ) : isUnlocked ? (
                        <View style={styles.unlockedTownBadge}>
                          <Text style={styles.unlockedTownBadgeText}>✓ UNLOCKED</Text>
                        </View>
                      ) : (
                        <View style={styles.lockedTownBadge}>
                          <Ionicons name="lock-closed" size={10} color="#FF8A80" style={{ marginRight: 2 }} />
                          <Text style={styles.lockedTownBadgeText}>LOCKED</Text>
                        </View>
                      )}
                    </View>

                    <Text style={[
                      styles.townDescText,
                      { color: isUnlocked ? '#A9A9B0' : '#444' }
                    ]}>
                      {chap.description}
                    </Text>

                    <View style={styles.townCardFooter}>
                      <Text style={[
                        styles.townProgressText,
                        { color: isUnlocked ? 'rgba(255,255,255,0.4)' : '#333' }
                      ]}>
                        Levels {chap.startLevel} - {chap.endLevel} {isUnlocked && `• ⭐ ${earnedStars}/${maxStars}`}
                      </Text>

                      {isUnlocked ? (
                        <TouchableOpacity
                          activeOpacity={0.8}
                          style={[styles.teleportButton, { backgroundColor: chap.accentColor }]}
                          onPress={() => {
                            audioController.play('click');
                            setTownMapVisible(false);
                            // Scroll to town
                            const targetY = Math.max(0, (chap.id - 1) * 20 * 130 + (chap.id - 1) * CHAPTER_SPACING - 20);
                            scrollViewRef.current?.scrollTo({ y: targetY, animated: true });
                          }}
                        >
                          <Text style={styles.teleportButtonText}>Teleport</Text>
                        </TouchableOpacity>
                      ) : (
                        <TouchableOpacity
                          activeOpacity={0.8}
                          style={[
                            styles.townUnlockButton, 
                            { backgroundColor: chap.themeColor },
                            coins < cost && styles.townUnlockButtonDisabled
                          ]}
                          onPress={() => {
                            if (chap.id > unlockedChapters + 1) {
                              setCustomAlert({
                                visible: true,
                                title: 'Route Blocked',
                                message: `You must unlock ${CHAPTERS[unlockedChapters].name} first before traveling here!`,
                                icon: 'warning',
                                iconColor: '#FF8A80',
                                buttons: [{ text: 'OK', onPress: () => setCustomAlert(null) }],
                              });
                              return;
                            }
                            setTownMapVisible(false);
                            handleBuyNextChapter(unlockedChapters);
                          }}
                        >
                          <Ionicons name="logo-usd" size={12} color="#0B0C10" style={{ marginRight: 2 }} />
                          <Text style={styles.townUnlockButtonText}>Unlock for {cost}</Text>
                        </TouchableOpacity>
                      )}
                    </View>
                  </View>
                );
              })}
            </ScrollView>
          </View>
        </View>
      </Modal>
    );
  };

  const totalLevels = unlockedChapters * 20;
  const journeyLevels = Array.from({ length: totalLevels }, (_, i) => i + 1);

  return (
    <SafeAreaView style={styles.safeArea}>
      {/* Cozy stationary background matching Boba Cafe aesthetic */}
      <ImageBackground
        source={require('../../assets/journey_map_bg.png')}
        style={StyleSheet.absoluteFillObject}
        resizeMode="cover"
      >
        <View style={styles.backgroundImageOverlay} />
      </ImageBackground>

      {/* Notch-Proof Header Panel */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={onBack}>
          <Ionicons name="chevron-back" size={24} color={THEME.colors.textSecondary} />
          <Text style={styles.backText}>Lobby</Text>
        </TouchableOpacity>

        <Text style={styles.headerTitle}>Sweet Travels</Text>

        <View style={styles.rightHeaderControls}>
          <TouchableOpacity 
            style={styles.mapIconButton} 
            onPress={() => {
              audioController.play('click');
              setTownMapVisible(true);
            }}
          >
            <Ionicons name="compass-outline" size={22} color="#66FCF1" />
          </TouchableOpacity>

          <View style={styles.coinBadge}>
            <Ionicons name="logo-usd" size={16} color="#FFD700" style={{ marginRight: 4 }} />
            <Text style={styles.coinValue}>{coins}</Text>
          </View>
        </View>
      </View>

      {/* Main winding path ScrollView (with transparent background) */}
      <ScrollView
        ref={scrollViewRef}
        contentContainerStyle={[
          styles.scrollContent,
          { height: totalLevels * 130 + unlockedChapters * CHAPTER_SPACING + 150 },
        ]}
        style={{ backgroundColor: 'transparent' }}
        showsVerticalScrollIndicator={false}
      >
        {/* Twinkling stars */}
        {STARS_SEEDED.map(star => (
          <TwinklingStar
            key={`star_${star.id}`}
            top={star.top}
            left={star.left}
            size={star.size}
            isCross={star.isCross}
            speed={star.speed}
          />
        ))}

        {/* Floating drift clouds */}
        {CLOUDS_SEEDED.map((cloud) => (
          <FloatingCloud
            key={`cloud_${cloud.id}`}
            top={cloud.top}
            width={cloud.width}
            height={cloud.height}
            speed={cloud.speed}
            delay={cloud.delay}
          />
        ))}

        {/* Winding 3D syrup path connectors */}
        {journeyLevels.slice(0, -1).map((_, i) => renderConnector(i, i + 1))}

        {/* Custom Isometric Landmarks */}
        {Array.from({ length: totalLevels }).map((_, i) => renderLandmarkForIndex(i))}

        {/* Campaign Levels Nodes */}
        {journeyLevels.map((lvlNum, index) => renderNode(lvlNum, index))}

        {/* Separator Cards for chapter transitions */}
        {Array.from({ length: Math.min(4, unlockedChapters) }).map((_, i) => renderSeparatorCard(i + 1))}

        {/* Cosmic Terminal Card at the end of Level 100 */}
        {unlockedChapters === 5 && renderCosmicTerminalCard()}
      </ScrollView>

      {/* Teleportation Map Modal */}
      <TeleportationMapModal />

      {/* Custom Theme Alert Modal */}
      {customAlert && (
        <Modal visible={customAlert.visible} transparent={true} animationType="fade" onRequestClose={() => setCustomAlert(null)}>
          <View style={styles.alertOverlay}>
            <View style={[styles.alertCard, customAlert.stationImage && { borderColor: customAlert.iconColor || 'rgba(102, 252, 241, 0.4)' }]}>
              {customAlert.stationImage ? (
                <Image 
                  source={customAlert.stationImage} 
                  style={styles.alertHeroImage} 
                />
              ) : customAlert.icon ? (
                <View style={[styles.alertIconWrapper, { borderColor: customAlert.iconColor || '#66FCF1', shadowColor: customAlert.iconColor || '#66FCF1' }]}>
                  <Ionicons name={customAlert.icon as any} size={30} color={customAlert.iconColor || '#66FCF1'} />
                </View>
              ) : null}
              <Text style={styles.alertTitle}>{customAlert.title}</Text>
              <Text style={styles.alertMessage}>{customAlert.message}</Text>
              <View style={[styles.alertButtonsRow, customAlert.buttons.length > 1 && styles.alertButtonsRowMulti]}>
                {customAlert.buttons.map((btn, idx) => {
                  const isCancel = btn.style === 'cancel';
                  return (
                    <TouchableOpacity
                      key={idx}
                      style={[
                        styles.alertButton,
                        isCancel ? styles.alertButtonCancel : [styles.alertButtonConfirm, customAlert.iconColor ? { backgroundColor: customAlert.iconColor, shadowColor: customAlert.iconColor } : null],
                        customAlert.buttons.length > 1 && { flex: 1 }
                      ]}
                      onPress={btn.onPress}
                    >
                      <Text style={[styles.alertButtonText, isCancel ? styles.alertButtonTextCancel : { color: '#0B0C10' }]}>
                        {btn.text}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>
          </View>
        </Modal>
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#0D0714', // Deep space background
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    height: 56,
    borderBottomWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.04)',
    backgroundColor: '#0D0714',
    zIndex: 20,
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
    fontSize: 18,
    fontWeight: '900',
    letterSpacing: 1,
    textTransform: 'uppercase',
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
  scrollContent: {
    position: 'relative',
    paddingBottom: 150,
  },
  star: {
    position: 'absolute',
    backgroundColor: '#FFFFFF',
    zIndex: 0,
  },
  starCrossLine: {
    position: 'absolute',
    backgroundColor: 'rgba(255, 255, 255, 0.7)',
  },
  cloud: {
    position: 'absolute',
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
    borderColor: 'rgba(255, 255, 255, 0.02)',
    borderWidth: 1,
    zIndex: 1,
  },
  pathLinkOuter: {
    position: 'absolute',
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    transformOrigin: 'top left',
    zIndex: 2,
    justifyContent: 'center',
    alignItems: 'center',
  },
  pathLinkInner: {
    height: 10,
    width: '100%',
    borderRadius: 5,
    justifyContent: 'center',
    position: 'relative',
  },
  pearlOverlayRow: {
    ...StyleSheet.absoluteFillObject,
    flexDirection: 'row',
    alignItems: 'center',
  },
  riverPearl: {
    position: 'absolute',
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#1E110B',
  },
  nodeContainer: {
    position: 'absolute',
    width: 54,
    alignItems: 'center',
    zIndex: 10,
  },
  nodeItemWrapper: {
    width: 54,
    alignItems: 'center',
    position: 'relative',
  },
  floatingStarsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    position: 'absolute',
    top: -16,
    zIndex: 12,
  },
  bubbleCircle: {
    width: 54,
    height: 54,
    borderRadius: 27,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 6,
    borderWidth: 2.5,
    position: 'relative',
    overflow: 'hidden',
  },
  glassShine: {
    position: 'absolute',
    top: 3,
    left: 4,
    width: 14,
    height: 8,
    borderRadius: 5,
    backgroundColor: 'rgba(255, 255, 255, 0.35)',
    transform: [{ rotate: '-15deg' }],
  },
  bubbleCircleLocked: {
    backgroundColor: '#1C1D24',
    borderColor: '#323943',
  },
  bubbleCircleCleared: {
    backgroundColor: 'rgba(102, 252, 241, 0.22)',
    borderColor: '#66FCF1',
    shadowColor: '#66FCF1',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
  },
  bubbleCircleTimeRace: {
    borderColor: '#FF8A80',
    backgroundColor: 'rgba(255, 138, 128, 0.25)',
    shadowColor: '#FF8A80',
    shadowOpacity: 0.4,
    shadowRadius: 5,
  },
  bubbleText: {
    fontSize: 16,
    fontWeight: '900',
    color: '#FFFFFF',
    textShadowColor: 'rgba(0,0,0,0.5)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  nodeSubLabel: {
    color: 'rgba(255, 255, 255, 0.55)',
    fontSize: 10,
    fontWeight: 'bold',
    marginTop: 4,
    textAlign: 'center',
    backgroundColor: 'rgba(0,0,0,0.4)',
    paddingHorizontal: 5,
    paddingVertical: 1,
    borderRadius: 4,
  },
  nodeSubLabelLocked: {
    color: 'rgba(255, 255, 255, 0.22)',
  },
  landmarkWrapper: {
    position: 'absolute',
    width: 100,
    height: 120,
    zIndex: 5,
  },
  islandContainer: {
    alignItems: 'center',
    justifyContent: 'flex-end',
    width: 100,
    height: 120,
    position: 'relative',
  },
  islandContent: {
    alignItems: 'center',
    justifyContent: 'flex-end',
    marginBottom: 4,
    zIndex: 2,
  },
  islandBase: {
    width: 90,
    height: 10,
    borderRadius: 5,
    borderBottomWidth: 3,
    zIndex: 1,
  },
  islandShadow: {
    position: 'absolute',
    bottom: -4,
    width: 70,
    height: 5,
    borderRadius: 2.5,
    backgroundColor: 'rgba(0,0,0,0.35)',
    zIndex: 0,
  },
  shopkeeperFrame: {
    width: 85,
    height: 85,
    alignItems: 'center',
    justifyContent: 'center',
  },
  shopkeeperSticker: {
    width: 85,
    height: 85,
    resizeMode: 'contain',
  },
  activeNodeContainer: {
    width: 54,
    height: 75,
    alignItems: 'center',
    justifyContent: 'flex-end',
    zIndex: 15,
  },
  activeNodeTouch: {
    width: 50,
    height: 70,
    alignItems: 'center',
    justifyContent: 'flex-end',
    position: 'relative',
  },
  activeNodeStraw: {
    position: 'absolute',
    top: 5,
    width: 3,
    height: 12,
    backgroundColor: '#ff007f',
    transform: [{ rotate: '15deg' }],
    zIndex: 3,
  },
  activeNodeEar: {
    position: 'absolute',
    top: 11,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#66FCF1',
    borderWidth: 1.2,
    borderColor: '#0B0C10',
    zIndex: 1,
  },
  activeNodeCup: {
    width: 34,
    height: 44,
    backgroundColor: 'rgba(255, 255, 255, 0.12)',
    borderColor: '#66FCF1',
    borderWidth: 2,
    borderBottomLeftRadius: 9,
    borderBottomRightRadius: 9,
    overflow: 'hidden',
    zIndex: 2,
    justifyContent: 'flex-end',
    shadowColor: '#66FCF1',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 5,
  },
  activeNodeLid: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.7)',
    borderTopLeftRadius: 5,
    borderTopRightRadius: 5,
  },
  activeNodeLiquid: {
    width: '100%',
    height: '75%',
    backgroundColor: 'rgba(102, 252, 241, 0.4)',
    justifyContent: 'flex-end',
    position: 'relative',
  },
  activeNodeFace: {
    position: 'absolute',
    top: 4,
    left: 0,
    right: 0,
    alignItems: 'center',
  },
  activeNodeEyes: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: 14,
  },
  activeNodeEye: {
    width: 2.2,
    height: 2.2,
    borderRadius: 1.1,
    backgroundColor: '#0B0C10',
  },
  activeNodeBlushRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: 20,
    position: 'absolute',
    top: 2.2,
  },
  activeNodeBlush: {
    width: 2.2,
    height: 2.2,
    borderRadius: 1.1,
    backgroundColor: '#FF8A80',
    opacity: 0.8,
  },
  activeNodeMouth: {
    width: 3.5,
    height: 1.8,
    borderBottomWidth: 0.8,
    borderBottomColor: '#0B0C10',
    borderBottomLeftRadius: 1.8,
    borderBottomRightRadius: 1.8,
    marginTop: 1.8,
  },
  activeNodePearl: {
    width: 3,
    height: 3,
    borderRadius: 1.5,
    backgroundColor: '#0B0C10',
    position: 'absolute',
  },
  activeNodeLabel: {
    position: 'absolute',
    bottom: -6,
    backgroundColor: '#66FCF1',
    borderRadius: 9,
    paddingHorizontal: 7,
    paddingVertical: 2.5,
    borderWidth: 1.2,
    borderColor: '#0B0C10',
    shadowColor: '#66FCF1',
    shadowOpacity: 0.6,
    shadowRadius: 3,
  },
  activeNodeLabelText: {
    color: '#0B0C10',
    fontSize: 11,
    fontWeight: '900',
  },
  separatorCard: {
    position: 'absolute',
    left: '10%',
    width: '80%',
    height: 300,
    backgroundColor: 'rgba(20, 17, 30, 0.85)',
    borderWidth: 1,
    borderRadius: 28,
    padding: 16,
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'space-between',
    elevation: 8,
    zIndex: 10,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
  },
  cardGlowBorder: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: 20,
    opacity: 0.04,
  },
  stationHeroContainer: {
    width: 200,
    height: 200,
    justifyContent: 'center',
    alignItems: 'center',
  },
  stationHeroImage: {
    width: 200,
    height: 200,
    resizeMode: 'contain',
  },
  stationHeroIconFrame: {
    width: 140,
    height: 140,
    borderRadius: 70,
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.02)',
  },
  stationDetailsContainer: {
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  separatorTitle: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '900',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
    textAlign: 'center',
    marginBottom: 8,
  },
  separatorDesc: {
    color: '#A9A9B0',
    fontSize: 11,
    marginTop: 4,
    marginBottom: 8,
    lineHeight: 14,
  },
  unlockButton: {
    height: 36,
    paddingHorizontal: 16,
    borderRadius: 12,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 4,
  },
  unlockButtonDisabled: {
    backgroundColor: '#555',
  },
  unlockButtonText: {
    color: '#0B0C10',
    fontWeight: '900',
    fontSize: 11,
    letterSpacing: 0.5,
  },
  unlockedTag: {
    height: 32,
    paddingHorizontal: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'rgba(102, 252, 241, 0.25)',
    backgroundColor: 'rgba(102, 252, 241, 0.05)',
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  unlockedTagText: {
    color: '#66FCF1',
    fontWeight: '800',
    fontSize: 10,
    letterSpacing: 0.5,
  },
  customIllustContainer: {
    width: 200,
    height: 200,
    borderRadius: 24,
    overflow: 'hidden',
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  customIllustBg: {
    ...StyleSheet.absoluteFillObject,
  },
  illustCloud: {
    position: 'absolute',
    backgroundColor: 'rgba(255, 255, 255, 0.7)',
  },
  sakuraPetal: {
    position: 'absolute',
    width: 12,
    height: 16,
    borderRadius: 8,
    backgroundColor: '#FFB7C5',
    opacity: 0.85,
  },
  illustWave: {
    position: 'absolute',
    height: 6,
    borderRadius: 3,
    backgroundColor: 'rgba(0, 150, 136, 0.2)',
  },
  palmFrond: {
    position: 'absolute',
    width: 40,
    height: 12,
    borderRadius: 6,
    backgroundColor: 'rgba(76, 175, 80, 0.25)',
  },
  illustPlanet: {
    position: 'absolute',
    right: -30,
    bottom: -30,
    width: 90,
    height: 90,
    borderRadius: 45,
    backgroundColor: 'rgba(126, 87, 194, 0.2)',
  },
  illustStar: {
    position: 'absolute',
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#FFD54F',
    opacity: 0.8,
  },
  illustIconCircle: {
    width: 140,
    height: 140,
    borderRadius: 70,
    borderWidth: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    justifyContent: 'center',
    alignItems: 'center',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  alertOverlay: {
    flex: 1,
    backgroundColor: 'rgba(5, 3, 10, 0.82)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  alertCard: {
    width: '90%',
    maxWidth: 320,
    backgroundColor: 'rgba(24, 18, 38, 0.96)',
    borderRadius: 24,
    borderWidth: 1.5,
    borderColor: 'rgba(102, 252, 241, 0.25)',
    padding: 24,
    alignItems: 'center',
    shadowColor: '#66FCF1',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.35,
    shadowRadius: 20,
    elevation: 12,
  },
  alertIconWrapper: {
    width: 64,
    height: 64,
    borderRadius: 32,
    borderWidth: 2.5,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 10,
    elevation: 4,
  },
  alertHeroImage: {
    width: 140,
    height: 140,
    resizeMode: 'contain',
    marginBottom: 16,
  },
  alertTitle: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: '900',
    letterSpacing: 1.5,
    textAlign: 'center',
    marginBottom: 8,
    textTransform: 'uppercase',
    textShadowColor: 'rgba(255, 255, 255, 0.15)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
  alertMessage: {
    color: '#A9A9B0',
    fontSize: 13.5,
    lineHeight: 19,
    textAlign: 'center',
    marginBottom: 20,
  },
  alertButtonsRow: {
    flexDirection: 'row',
    width: '100%',
    gap: 12,
  },
  alertButtonsRowMulti: {
    justifyContent: 'space-between',
  },
  alertButton: {
    height: 46,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 16,
  },
  alertButtonConfirm: {
    backgroundColor: '#66FCF1',
    shadowColor: '#66FCF1',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 8,
    elevation: 4,
  },
  alertButtonCancel: {
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
    borderWidth: 1.5,
    borderColor: 'rgba(255, 255, 255, 0.12)',
  },
  alertButtonText: {
    color: '#0B0C10',
    fontSize: 13.5,
    fontWeight: '800',
    letterSpacing: 0.8,
    textTransform: 'uppercase',
  },
  alertButtonTextCancel: {
    color: '#A9A9B0',
  },
  landmarkText: {
    color: '#FFF',
    fontSize: 8.5,
    fontWeight: 'bold',
    marginTop: 6,
    backgroundColor: 'rgba(0,0,0,0.65)',
    paddingHorizontal: 4,
    paddingVertical: 1,
    borderRadius: 3,
    textAlign: 'center',
  },
  backgroundImageOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(13, 7, 20, 0.65)', // Cozy dark taro overlay for readability
  },
  rightHeaderControls: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  mapIconButton: {
    padding: 8,
    marginRight: 10,
    borderRadius: 20,
    backgroundColor: 'rgba(102, 252, 241, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(102, 252, 241, 0.3)',
  },
  modalContainer: {
    flex: 1,
    backgroundColor: 'rgba(5, 3, 10, 0.88)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContentCard: {
    width: '100%',
    maxHeight: '85%',
    backgroundColor: '#14111E',
    borderRadius: 24,
    borderWidth: 1.5,
    borderColor: 'rgba(102, 252, 241, 0.25)',
    padding: 20,
    alignItems: 'center',
    shadowColor: '#66FCF1',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.15,
    shadowRadius: 15,
    elevation: 10,
  },
  modalHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    width: '100%',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.08)',
    paddingBottom: 12,
  },
  modalTitleText: {
    fontSize: 18,
    fontWeight: '900',
    color: '#FFF',
    letterSpacing: 1.5,
    textTransform: 'uppercase',
  },
  modalCloseButton: {
    padding: 4,
  },
  townCard: {
    width: '100%',
    borderRadius: 16,
    borderWidth: 1.5,
    padding: 16,
    marginBottom: 16,
    position: 'relative',
    overflow: 'hidden',
  },
  townCardGlow: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    opacity: 0.025,
  },
  townCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  townNameText: {
    fontSize: 16,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  activeTownBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  activeTownBadgeText: {
    color: '#FFF',
    fontSize: 9,
    fontWeight: '900',
  },
  unlockedTownBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    backgroundColor: 'rgba(102, 252, 241, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(102, 252, 241, 0.25)',
  },
  unlockedTownBadgeText: {
    color: '#66FCF1',
    fontSize: 9,
    fontWeight: '800',
  },
  lockedTownBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    backgroundColor: 'rgba(255, 138, 128, 0.08)',
    borderWidth: 1,
    borderColor: 'rgba(255, 138, 128, 0.2)',
    flexDirection: 'row',
    alignItems: 'center',
  },
  lockedTownBadgeText: {
    color: '#FF8A80',
    fontSize: 9,
    fontWeight: '800',
  },
  townDescText: {
    fontSize: 12,
    lineHeight: 16,
    marginBottom: 12,
  },
  townCardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.04)',
    paddingTop: 10,
  },
  townProgressText: {
    fontSize: 11,
    fontWeight: '600',
  },
  teleportButton: {
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  teleportButtonText: {
    color: '#FFF',
    fontSize: 12,
    fontWeight: '800',
  },
  townUnlockButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  townUnlockButtonDisabled: {
    backgroundColor: '#333',
  },
  townUnlockButtonText: {
    color: '#0B0C10',
    fontSize: 11,
    fontWeight: '800',
  },
  stationIconFrame: {
    width: 60,
    height: 60,
    borderRadius: 30,
    borderWidth: 2,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.02)',
  },
});

export default LevelJourneyMap;
