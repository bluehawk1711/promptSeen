import { useState, useRef, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
  Image,
  StatusBar,
  Linking,
  Platform,
} from 'react-native';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, {
  FadeIn,
  FadeInDown,
  interpolate,
  interpolateColor,
  useAnimatedScrollHandler,
  useAnimatedStyle,
  useSharedValue,
  runOnJS,
  type SharedValue,
} from 'react-native-reanimated';
import { ArrowRight, Star, Heart } from 'lucide-react-native';

import { useOnboardingStore } from '@/store/onboarding';
import { PRIMARY, withPrimaryOpacity } from '@/theme/colors';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');
const AnimatedFlatList = Animated.createAnimatedComponent(Animated.ScrollView);

// ─── Slide Data ─────────────────────────────────────────────────────────────

interface ImageCard {
  uri: string;
  rotation: number;
  scale: number;
  /** Parallax speed multiplier — 0 = fixed, 1 = scroll speed, >1 = faster */
  parallaxSpeed: number;
  top: number;
  left: number;
  width: number;
  height: number;
}

interface Slide {
  id: string;
  title: string;
  highlightWord: string;
  description: string;
  buttonText: string;
  images: ImageCard[];
  /** Background glow color for this slide */
  glowColor: string;
}

const SLIDES: Slide[] = [
  {
    id: 'discover',
    title: 'Find Powerful ',
    highlightWord: 'AI Prompts',
    description:
      'Discover thousands of trending AI photo prompts for cinematic portraits, anime art, Instagram photos, and creative edits.',
    buttonText: 'Next Step',
    glowColor: withPrimaryOpacity(0.12),
    images: [
      { uri: 'https://picsum.photos/seed/ai1/400/500', rotation: -8, scale: 0.82, parallaxSpeed: 0.4, top: 50, left: 10, width: 155, height: 195 },
      { uri: 'https://picsum.photos/seed/ai2/400/500', rotation: 6, scale: 0.88, parallaxSpeed: 0.7, top: 25, left: 135, width: 148, height: 188 },
      { uri: 'https://picsum.photos/seed/ai3/400/500', rotation: -3, scale: 0.92, parallaxSpeed: 0.3, top: 175, left: 30, width: 152, height: 192 },
      { uri: 'https://picsum.photos/seed/ai4/400/500', rotation: 8, scale: 0.86, parallaxSpeed: 0.6, top: 155, left: 165, width: 142, height: 182 },
    ],
  },
  {
    id: 'generate',
    title: 'Generate ',
    highlightWord: 'Trending',
    description:
      'Create viral AI photos easily using powerful prompts. Just copy the prompt and generate stunning images instantly.',
    buttonText: 'Next Step',
    glowColor: 'rgba(255,100,50,0.10)',
    images: [
      { uri: 'https://picsum.photos/seed/trend1/500/600', rotation: 0, scale: 1, parallaxSpeed: 0.2, top: 50, left: 35, width: 290, height: 350 },
    ],
  },
  {
    id: 'rate',
    title: 'Enjoying ',
    highlightWord: 'Prompt View?',
    description:
      'Rate us please and support us! Your feedback helps other creators discover the app and helps us keep building great features.',
    buttonText: 'Get Started',
    glowColor: withPrimaryOpacity(0.15),
    images: [],
  },
];

// ─── Parallax Image Card ────────────────────────────────────────────────────

function ParallaxCard({
  image,
  scrollX,
  slideIndex,
  cardIndex,
}: {
  image: ImageCard;
  scrollX: SharedValue<number>;
  slideIndex: number;
  cardIndex: number;
}) {
  const animatedStyle = useAnimatedStyle(() => {
    // How far this slide is from the center of the viewport
    const inputRange = [
      (slideIndex - 1) * SCREEN_WIDTH,
      slideIndex * SCREEN_WIDTH,
      (slideIndex + 1) * SCREEN_WIDTH,
    ];

    // Parallax: translate X based on scroll position and speed multiplier
    const translateX = interpolate(
      scrollX.value,
      inputRange,
      [-SCREEN_WIDTH * image.parallaxSpeed, 0, SCREEN_WIDTH * image.parallaxSpeed],
      'clamp'
    );

    // Slight Y parallax for depth
    const translateY = interpolate(
      scrollX.value,
      inputRange,
      [20 * image.parallaxSpeed, 0, -20 * image.parallaxSpeed],
      'clamp'
    );

    // Scale down slightly when off-screen
    const scale = interpolate(
      scrollX.value,
      inputRange,
      [0.85, image.scale, 0.85],
      'clamp'
    );

    // Fade when leaving viewport
    const opacity = interpolate(
      scrollX.value,
      inputRange,
      [0.3, 1, 0.3],
      'clamp'
    );

    // Rotation animation — slight tilt change on scroll
    const rotate = interpolate(
      scrollX.value,
      inputRange,
      [image.rotation - 3, image.rotation, image.rotation + 3],
      'clamp'
    );

    return {
      transform: [
        { translateX },
        { translateY },
        { scale },
        { rotate: `${rotate}deg` },
      ],
      opacity,
    };
  });

  return (
    <Animated.View
      style={[
        styles.floatingCard,
        {
          top: image.top,
          left: image.left,
          width: image.width,
          height: image.height,
        },
        animatedStyle,
      ]}
    >
      <Image source={{ uri: image.uri }} style={styles.floatingImage} resizeMode="cover" />
      <View style={styles.cardShine} />
      {/* Subtle border glow */}
      <View style={styles.cardBorder} />
    </Animated.View>
  );
}

// ─── Ambient Glow (scrolls slower than content) ─────────────────────────────

function AmbientGlow({
  scrollX,
  slideIndex,
  color,
}: {
  scrollX: SharedValue<number>;
  slideIndex: number;
  color: string;
}) {
  const animatedStyle = useAnimatedStyle(() => {
    const inputRange = [
      (slideIndex - 1) * SCREEN_WIDTH,
      slideIndex * SCREEN_WIDTH,
      (slideIndex + 1) * SCREEN_WIDTH,
    ];

    const translateX = interpolate(
      scrollX.value,
      inputRange,
      [-SCREEN_WIDTH * 0.15, 0, SCREEN_WIDTH * 0.15],
      'clamp'
    );

    const opacity = interpolate(
      scrollX.value,
      inputRange,
      [0.3, 1, 0.3],
      'clamp'
    );

    return {
      transform: [{ translateX }],
      opacity,
    };
  });

  return (
    <>
      <Animated.View style={[styles.topGlow, { backgroundColor: color }, animatedStyle]} />
      <Animated.View style={[styles.sideGlow, animatedStyle]} />
    </>
  );
}

// ─── Slide Content ──────────────────────────────────────────────────────────

function SlideContent({
  slide,
  slideIndex,
  scrollX,
}: {
  slide: Slide;
  slideIndex: number;
  scrollX: SharedValue<number>;
}) {
  // Text parallax — moves slightly slower than the images
  const textAnimatedStyle = useAnimatedStyle(() => {
    const inputRange = [
      (slideIndex - 1) * SCREEN_WIDTH,
      slideIndex * SCREEN_WIDTH,
      (slideIndex + 1) * SCREEN_WIDTH,
    ];

    const translateX = interpolate(
      scrollX.value,
      inputRange,
      [-SCREEN_WIDTH * 0.25, 0, SCREEN_WIDTH * 0.25],
      'clamp'
    );

    const opacity = interpolate(
      scrollX.value,
      inputRange,
      [0, 1, 0],
      'clamp'
    );

    return {
      transform: [{ translateX }],
      opacity,
    };
  });

  if (slide.id === 'rate') {
    return <RateSlide scrollX={scrollX} slideIndex={slideIndex} />;
  }

  return (
    <View style={styles.slideContainer}>
      {/* Image collage area with parallax */}
      <View style={styles.imageArea}>
        {slide.images.map((img, i) => (
          <ParallaxCard
            key={i}
            image={img}
            scrollX={scrollX}
            slideIndex={slideIndex}
            cardIndex={i}
          />
        ))}

        {/* Ambient glows with parallax */}
        <AmbientGlow scrollX={scrollX} slideIndex={slideIndex} color={slide.glowColor} />
      </View>

      {/* Text content with parallax */}
      <Animated.View style={[styles.textArea, textAnimatedStyle]}>
        <Text style={styles.slideTitle}>
          {slide.title}
          <Text style={styles.highlight}>{slide.highlightWord}</Text>
        </Text>

        <Text style={styles.slideDescription}>
          {slide.description}
        </Text>
      </Animated.View>
    </View>
  );
}

// ─── Rate Slide ─────────────────────────────────────────────────────────────

function RateSlide({
  scrollX,
  slideIndex,
}: {
  scrollX: SharedValue<number>;
  slideIndex: number;
}) {
  const contentAnimatedStyle = useAnimatedStyle(() => {
    const inputRange = [
      (slideIndex - 1) * SCREEN_WIDTH,
      slideIndex * SCREEN_WIDTH,
      (slideIndex + 1) * SCREEN_WIDTH,
    ];

    const translateY = interpolate(
      scrollX.value,
      inputRange,
      [60, 0, 60],
      'clamp'
    );

    const opacity = interpolate(
      scrollX.value,
      inputRange,
      [0, 1, 0],
      'clamp'
    );

    const scale = interpolate(
      scrollX.value,
      inputRange,
      [0.9, 1, 0.9],
      'clamp'
    );

    return {
      transform: [{ translateY }, { scale }],
      opacity,
    };
  });

  const textAnimatedStyle = useAnimatedStyle(() => {
    const inputRange = [
      (slideIndex - 1) * SCREEN_WIDTH,
      slideIndex * SCREEN_WIDTH,
      (slideIndex + 1) * SCREEN_WIDTH,
    ];

    const translateX = interpolate(
      scrollX.value,
      inputRange,
      [-SCREEN_WIDTH * 0.25, 0, SCREEN_WIDTH * 0.25],
      'clamp'
    );

    const opacity = interpolate(
      scrollX.value,
      inputRange,
      [0, 1, 0],
      'clamp'
    );

    return {
      transform: [{ translateX }],
      opacity,
    };
  });

  return (
    <View style={styles.slideContainer}>
      <View style={styles.imageArea}>
        <Animated.View style={[styles.heartContainer, contentAnimatedStyle]}>
          <View style={styles.heartGlow} />
          <View style={styles.heartCircle}>
            <Heart size={48} color={PRIMARY} fill={PRIMARY} />
          </View>
        </Animated.View>

        <Animated.View style={[styles.starsRow, contentAnimatedStyle]}>
          {[1, 2, 3, 4, 5].map((i) => (
            <Star key={i} size={28} color={PRIMARY} fill={PRIMARY} />
          ))}
        </Animated.View>

        <Animated.View style={contentAnimatedStyle}>
          <TouchableOpacity
            style={styles.rateButton}
            activeOpacity={0.8}
            onPress={() => {
              const url = Platform.OS === 'ios'
                ? 'itms-apps://itunes.apple.com/app/id6745154692?action=write-review'
                : 'market://details?id=com.promptgallery.app';
              Linking.openURL(url).catch(() => {});
            }}
          >
            <Star size={16} color="#fff" fill="#fff" />
            <Text style={styles.rateButtonText}>Rate Us Now</Text>
          </TouchableOpacity>
        </Animated.View>

        <View style={styles.heartAmbientGlow} />
      </View>

      <Animated.View style={[styles.textArea, textAnimatedStyle]}>
        <Text style={styles.slideTitle}>
          {SLIDES[2].title}
          <Text style={styles.highlight}>{SLIDES[2].highlightWord}</Text>
        </Text>

        <Text style={styles.slideDescription}>
          {SLIDES[2].description}
        </Text>
      </Animated.View>
    </View>
  );
}

// ─── Main Onboarding ────────────────────────────────────────────────────────

export default function OnboardingScreen() {
  const insets = useSafeAreaInsets();
  const { completeOnboarding } = useOnboardingStore();

  const scrollX = useSharedValue(0);
  const [currentIndex, setCurrentIndex] = useState(0);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const flatListRef = useRef<any>(null);

  const isLastSlide = currentIndex === SLIDES.length - 1;

  const handleIndexChanged = useCallback((index: number) => {
    setCurrentIndex(index);
  }, []);

  const handleScroll = useAnimatedScrollHandler({
    onScroll: (event) => {
      scrollX.value = event.contentOffset.x;

      // Calculate current index on the JS thread
      const index = Math.round(event.contentOffset.x / SCREEN_WIDTH);
      runOnJS(handleIndexChanged)(index);
    },
  });

  const handleNext = () => {
    if (isLastSlide) {
      completeOnboarding();
      router.replace('/(tabs)');
    } else {
      flatListRef.current?.scrollTo({
        x: (currentIndex + 1) * SCREEN_WIDTH,
        animated: true,
      });
    }
  };

  const handleSkip = () => {
    completeOnboarding();
    router.replace('/(tabs)');
  };

  // Animated pagination dots
  const dotInactiveColor = withPrimaryOpacity(0.25);
  const Dot = ({ index }: { index: number }) => {
    const animatedStyle = useAnimatedStyle(() => {
      const inputRange = [
        (index - 1) * SCREEN_WIDTH,
        index * SCREEN_WIDTH,
        (index + 1) * SCREEN_WIDTH,
      ];

      const width = interpolate(
        scrollX.value,
        inputRange,
        [8, 28, 8],
        'clamp'
      );

      const backgroundColor = interpolateColor(
        scrollX.value,
        inputRange,
        [dotInactiveColor, PRIMARY, dotInactiveColor]
      );

      return { width, backgroundColor };
    });

    return <Animated.View style={[styles.dot, animatedStyle]} />;
  };

  // Button label animation
  const buttonAnimatedStyle = useAnimatedStyle(() => {
    const opacity = interpolate(
      scrollX.value,
      [
        (SLIDES.length - 2) * SCREEN_WIDTH,
        (SLIDES.length - 1) * SCREEN_WIDTH,
      ],
      [1, 1],
      'clamp'
    );
    return { opacity };
  });

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />

      {/* Skip button */}
      <TouchableOpacity
        style={[styles.skipBtn, { top: insets.top + 12 }]}
        onPress={handleSkip}
        activeOpacity={0.7}
      >
        <Text style={styles.skipText}>Skip</Text>
      </TouchableOpacity>

      {/* Parallax FlatList */}
      <AnimatedFlatList
        ref={flatListRef}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onScroll={handleScroll}
        scrollEventThrottle={16}
        contentContainerStyle={{ flexGrow: 1 }}
      >
        {SLIDES.map((slide, index) => (
          <View key={slide.id} style={{ width: SCREEN_WIDTH }}>
            <SlideContent
              slide={slide}
              slideIndex={index}
              scrollX={scrollX}
            />
          </View>
        ))}
      </AnimatedFlatList>

      {/* Bottom section */}
      <View style={[styles.bottomSection, { paddingBottom: insets.bottom + 16 }]}>
        {/* Animated pagination dots */}
        <View style={styles.pagination}>
          {SLIDES.map((_, i) => (
            <Dot key={i} index={i} />
          ))}
        </View>

        {/* Next / Get Started button */}
        <TouchableOpacity
          style={styles.nextButton}
          onPress={handleNext}
          activeOpacity={0.85}
        >
          <Text style={styles.nextButtonText}>
            {isLastSlide ? 'Get Started' : 'Next Step'}
          </Text>
          <ArrowRight size={20} color="#fff" />
        </TouchableOpacity>
      </View>
    </View>
  );
}

// ─── Styles ─────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#141210',
  },

  // Skip
  skipBtn: {
    position: 'absolute',
    right: 20,
    zIndex: 10,
    paddingVertical: 6,
    paddingHorizontal: 4,
  },
  skipText: {
    color: PRIMARY,
    fontSize: 16,
    fontWeight: '600',
  },

  // Slide
  slideContainer: {
    flex: 1,
    width: SCREEN_WIDTH,
  },

  imageArea: {
    flex: 1,
    position: 'relative',
    overflow: 'hidden',
  },

  textArea: {
    paddingHorizontal: 28,
    paddingBottom: 24,
    gap: 12,
  },

  slideTitle: {
    fontSize: 30,
    fontWeight: '800',
    color: '#EDE8E4',
    letterSpacing: -0.5,
    lineHeight: 36,
  },

  highlight: {
    color: PRIMARY,
  },

  slideDescription: {
    fontSize: 15,
    lineHeight: 23,
    color: '#A89C90',
    maxWidth: 340,
  },

  // Floating cards
  floatingCard: {
    position: 'absolute',
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 16,
    elevation: 8,
  },

  floatingImage: {
    width: '100%',
    height: '100%',
    borderRadius: 16,
  },

  cardShine: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: '40%',
    borderRadius: 16,
    backgroundColor: 'transparent',
    borderBottomWidth: 0.5,
    borderBottomColor: 'rgba(255,255,255,0.08)',
  },

  cardBorder: {
    ...StyleSheet.absoluteFill,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: withPrimaryOpacity(0.2),
  },

  // Ambient glows
  topGlow: {
    position: 'absolute',
    top: -80,
    right: -40,
    width: 280,
    height: 280,
    borderRadius: 140,
  },

  sideGlow: {
    position: 'absolute',
    top: 120,
    left: -60,
    width: 200,
    height: 200,
    borderRadius: 100,
    backgroundColor: withPrimaryOpacity(0.06),
  },

  // Rate slide
  heartContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 80,
  },

  heartGlow: {
    position: 'absolute',
    width: 160,
    height: 160,
    borderRadius: 80,
    backgroundColor: withPrimaryOpacity(0.2),
  },

  heartCircle: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: withPrimaryOpacity(0.15),
    borderWidth: 2,
    borderColor: withPrimaryOpacity(0.3),
    alignItems: 'center',
    justifyContent: 'center',
  },

  starsRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 6,
    marginTop: 24,
  },

  rateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: PRIMARY,
    marginHorizontal: 40,
    marginTop: 20,
    paddingVertical: 14,
    borderRadius: 16,
  },

  rateButtonText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '700',
  },

  heartAmbientGlow: {
    position: 'absolute',
    top: 40,
    left: '50%',
    marginLeft: -100,
    width: 200,
    height: 200,
    borderRadius: 100,
    backgroundColor: withPrimaryOpacity(0.08),
  },

  // Bottom
  bottomSection: {
    paddingHorizontal: 24,
    paddingTop: 12,
  },

  pagination: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 6,
    marginBottom: 20,
  },

  dot: {
    height: 8,
    borderRadius: 4,
  },

  nextButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: PRIMARY,
    paddingVertical: 18,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 16,
    elevation: 8,
  },

  nextButtonText: {
    color: '#fff',
    fontSize: 17,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
});
