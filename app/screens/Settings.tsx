import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, ScrollView, Dimensions, Pressable } from 'react-native';
import { Text, YStack, Button, XStack } from 'tamagui';
import { styled } from 'tamagui';
import { Video, ResizeMode } from 'expo-av';
const bgvid = require('../../assets/bgvid.mp4');
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

const { width } = Dimensions.get('window');
const containerWidth = Math.min(width * 0.9, 400);

const PixelContainer = styled(View, {
  backgroundColor: 'rgba(0, 0, 0, 0.7)',
  borderWidth: 4,
  borderColor: '#20B2AA',
  padding: 20,
  margin: 16,
  width: containerWidth,
  borderRadius: 4,
});

const TitleText = styled(Text, {
  color: '#FFFFFF',
  fontSize: 28,
  fontWeight: '700',
  textAlign: "center",
  textShadowColor: '#20B2AA',
  textShadowOffset: { width: 1, height: 1 },
  textShadowRadius: 4,
  marginBottom: 20,
  fontFamily: '$body',
});

const ContentText = styled(Text, {
  color: '#FFFFFF',
  fontSize: 16,
  lineHeight: 24,
  textAlign: "left",
  marginBottom: 12,
  fontFamily: '$body',
});

const CategoryText = styled(Text, {
  color: "#20B2AA",
  fontSize: 16,
  fontWeight: "600",
  textAlign: "left",
  marginLeft: 16,
  marginTop: 16,
  marginBottom: 6,
  textTransform: "uppercase",
  letterSpacing: 1,
  fontFamily: '$body',
});

const StyledButton = styled(Button, {
  backgroundColor: "#6B238E",
  borderColor: "#20B2AA",
  borderWidth: 2,
  borderRadius: 10,
  width: containerWidth,
  height: 50,
  marginVertical: 6,
  marginHorizontal: 16,
  alignItems: "center",
  justifyContent: "center",
  shadowColor: "#20B2AA",
  shadowOffset: {
    width: 0,
    height: 0,
  },
  shadowOpacity: 0.6,
  shadowRadius: 12,
  elevation: 6,
});

const StyledText = styled(Text, {
  color: "#FFFFFF",
  fontSize: 18,
  fontWeight: "700",
  textAlign: "center",
  textShadowColor: "#20B2AA",
  textShadowOffset: {
    width: 1,
    height: 1,
  },
  textShadowRadius: 6,
  numberOfLines: 1,
  adjustsFontSizeToFit: true,
  fontFamily: '$body',
});

const Settings = () => {
  const videoRef = useRef<Video>(null);

  useEffect(() => {
    const loadVideo = async () => {
      try {
        if (videoRef.current) {
          await videoRef.current.loadAsync(bgvid, {}, false);
          await videoRef.current.playAsync();
        }
      } catch (error: any) {
        console.error("Error loading video:", error?.message || "Failed to load video");
      }
    };

    loadVideo();

    return () => {
      if (videoRef.current) {
        videoRef.current.unloadAsync();
      }
    };
  }, []);

  return (
    <View style={styles.container}>
      {/* Background Video */}
      <Video
        ref={videoRef}
        source={bgvid}
        style={styles.backgroundVideo}
        resizeMode={ResizeMode.COVER}
        isLooping={true}
        isMuted={true}
        shouldPlay={true}
        useNativeControls={false}
        rate={1.0}
        volume={1.0}
      />

      {/* Content Layer */}
      <View style={styles.contentOverlay}>
        <Pressable
          onPress={() => router.back()}
          style={({ pressed }) => [
            styles.backButton,
            { transform: [{ scale: pressed ? 0.95 : 1 }] }
          ]}
        >
          <XStack space={8} alignItems="center" paddingHorizontal={12}>
            <Ionicons name="arrow-back" size={20} color="#20B2AA" />
            <Text style={{ ...styles.backButtonText, fontFamily: 'PixelifySans' }}>
              Back
            </Text>
          </XStack>
        </Pressable>
        <ScrollView
          style={styles.scrollView}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
        >
          <CategoryText fontFamily="$body">Audio</CategoryText>
          <YStack space={4} alignItems="center">
            <StyledButton
              pressStyle={{
                scale: 0.97,
                opacity: 0.9,
                backgroundColor: "#8B008B"
              }}
              onPress={() => router.push('/(settings)/SoundEffects')}
              animation="quick"
            >
              <StyledText fontFamily="$body">SOUND EFFECTS</StyledText>
            </StyledButton>
          </YStack>

          <CategoryText fontFamily="$body">System</CategoryText>
          <YStack space={4} alignItems="center" marginBottom={24}>
            <StyledButton
              pressStyle={{
                scale: 0.97,
                opacity: 0.9,
                backgroundColor: "#8B008B"
              }}
              onPress={() => router.push('/(settings)/About')}
              animation="quick"
            >
              <StyledText fontFamily="$body">ABOUT</StyledText>
            </StyledButton>
          </YStack>
        </ScrollView>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
  },
  backgroundVideo: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    width: '100%',
    height: '100%',
  },
  contentOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingVertical: 20,
    paddingTop: 30,
  },
  backButton: {
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#20B2AA',
    marginTop: 16,
    marginLeft: 16,
    alignSelf: 'flex-start',
  },
  backButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
    textShadowColor: '#20B2AA',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
  },
});

export default Settings;
