import React, { useState, useEffect } from "react";
import { View, Dimensions, StyleSheet } from "react-native";
import { Button, YStack, Text } from "tamagui";
import { styled } from "tamagui";
import { Video, ResizeMode, AVPlaybackStatus } from "expo-av";
const bgvid = require('../assets/bgvid.mp4');
import { router } from "expo-router";
import LoadingScreen from "../components/LoadingScreen";

const { width } = Dimensions.get('window');
const buttonWidth = Math.min(width * 0.8, 280);

const StyledButton = styled(Button, {
  backgroundColor: "#6B238E",
  borderColor: "#20B2AA",
  borderWidth: 2,
  borderRadius: 10,
  width: buttonWidth,
  height: 50,
  marginVertical: 8,
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
  fontSize: 20,
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
});

export default function Home() {
  const videoRef = React.useRef<Video>(null);
  const [videoStatus, setVideoStatus] = useState<AVPlaybackStatus | null>(null);
  const [videoError, setVideoError] = useState(null);
  const [videoReady, setVideoReady] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Choose ONE video source - this uses the remote demo video which is reliable for testing
  /*  const videoSource = {
     uri: "http://d23dyxeqlo5psv.cloudfront.net/big_buck_bunny.mp4"
   };
  */
  // For local video, use require with a relative path
  // const videoSource = require('../assets/bgvid.mp4');

  useEffect(() => {
    // This effect handles video loading and initial app loading
    const initializeApp = async () => {
      try {
        if (videoRef.current) {
          await videoRef.current.loadAsync(bgvid, {}, false);
          await videoRef.current.playAsync();
        }
        // Simulate loading time (minimum 3 seconds for loading screen animation)
        await new Promise(resolve => setTimeout(resolve, 3000));
        setVideoReady(true);
        setIsLoading(false);
      } catch (error: any) {
        console.error("Error loading video:", error);
        setVideoError(error.toString());
        setIsLoading(false);
      }
    };

    initializeApp();

    return () => {
      if (videoRef.current) {
        videoRef.current.unloadAsync();
      }
    };
  }, []);

  const handleVideoLoad = () => {
    console.log("Video loaded successfully");
    setVideoReady(true);
  };

  const handleVideoError = (error: any) => {
    console.error("Video error:", error);
    setVideoError(error.toString());
  };

  if (isLoading) {
    return <LoadingScreen />;
  }

  return (
    <View style={styles.container}>
      {/* Background Video */}
      <Video
        ref={videoRef}
        source={bgvid}
        style={styles.backgroundVideo}
        resizeMode={ResizeMode.COVER}
        isLooping
        isMuted={true}
        shouldPlay
        useNativeControls={false}
        onLoad={handleVideoLoad}
        onError={handleVideoError}
        onPlaybackStatusUpdate={setVideoStatus}
      />

      {/* Content Layer */}
      <View style={styles.contentOverlay}>
        {videoError && (
          <Text style={styles.errorText}>
            Video error: Please check your connection
          </Text>
        )}

        <YStack space={16} alignItems="center" justifyContent="center">
          <StyledButton
            pressStyle={{
              scale: 0.97,
              opacity: 0.9,
              backgroundColor: "#8B008B"
            }}
            onPress={() => router.push('/(home)/GameDificulties')}
            animation="quick"
          >
            <StyledText>START GAME</StyledText>
          </StyledButton>

          <StyledButton
            pressStyle={{
              scale: 0.97,
              opacity: 0.9,
              backgroundColor: "#8B008B"
            }}
            onPress={() => router.push('/(settings)/Settings')}
            animation="quick"
          >
            <StyledText>SETTINGS</StyledText>
          </StyledButton>
        </YStack>
      </View>
    </View>
  );
}

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
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
  },
  errorText: {
    color: '#FF5555',
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 16,
    padding: 8,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    borderRadius: 5,
  }
});