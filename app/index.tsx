import React, { useState, useEffect } from "react";
import { View, Dimensions, StyleSheet, Modal, TouchableOpacity, Platform, BackHandler } from "react-native";
import { Button, YStack, Text } from "tamagui";
import { styled } from "tamagui";
import { Video, ResizeMode, AVPlaybackStatus } from "expo-av";
import { LinearGradient } from 'expo-linear-gradient';
const bgvid = require('../assets/bgvid.mp4');
import { router } from "expo-router";
import LoadingScreen from "../components/LoadingScreen";
import { FontAwesome } from '@expo/vector-icons';
import { useMusic } from '../context/MusicContext';

const { width } = Dimensions.get('window');
const buttonWidth = Math.min(width * 0.8, 280);

const PixelButton = styled(Button, {
  borderRadius: 0,
  borderWidth: 3,
  borderStyle: 'solid',
  marginVertical: 8,
  marginHorizontal: 16,
  alignItems: 'center',
  justifyContent: 'center',
  height: 54,
  width: buttonWidth,
  elevation: 0,
  shadowOpacity: 0,
});

const PixelText = styled(Text, {
  fontSize: 20,
  fontWeight: '700',
  textAlign: 'center',
  textShadowColor: '#222',
  textShadowOffset: { width: 2, height: 2 },
  textShadowRadius: 0,
  letterSpacing: 1,
  color: '#fff',
});

export default function Home() {
  const videoRef = React.useRef<Video>(null);
  const [videoStatus, setVideoStatus] = useState<AVPlaybackStatus | null>(null);
  const [videoError, setVideoError] = useState(null);
  const [videoReady, setVideoReady] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [showExitConfirmation, setShowExitConfirmation] = useState(false);
  const { playBgm } = useMusic();

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

  const handleExit = () => {
    setShowExitConfirmation(true);
  };

  const handleConfirmExit = () => {
    // On web, we can't actually exit the app, so we'll just show a message
    if (Platform.OS === 'web') {
      alert('To exit the game, please close your browser tab.');
    } else {
      // On native platforms, we can exit the app
      BackHandler.exitApp();
    }
  };

  const handleCancelExit = () => {
    setShowExitConfirmation(false);
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

        <YStack space={20} alignItems="center" justifyContent="center">
          {[{
            label: 'START GAME',
            onPress: () => {
              playBgm();
              router.push('/(home)/GameDificulties');
            },
            gradient: ['#fbb040', '#e97c3c', '#a13b1d'] as [string, string, string],
            border: '#a13b1d',
          }, {
            label: 'SETTINGS',
            onPress: () => router.push('/(settings)/Settings'),
            gradient: ['#20B2AA', '#1fa88a', '#0b4c3a'] as [string, string, string],
            border: '#0b4c3a',
          }, {
            label: 'EXIT',
            onPress: handleExit,
            gradient: ['#5a8fff', '#3b6eea', '#1a2c4a'] as [string, string, string],
            border: '#1a2c4a',
          }].map((btn, idx) => (
            <View key={btn.label} style={{
              marginVertical: 8,
              marginHorizontal: 16,
              // Outer pixel border (shadow)
              backgroundColor: '#222',
              padding: 4,
              borderWidth: 2,
              borderColor: '#fff',
              borderStyle: 'solid',
              // Stepped effect: add extra padding for a blocky look
              boxShadow: '0 0 0 2px #000',
            }}>
              <LinearGradient
                colors={btn.gradient}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={{
                  paddingVertical: 10,
                  paddingHorizontal: 36,
                  minWidth: 180,
                  alignItems: 'center',
                  justifyContent: 'center',
                  borderWidth: 3,
                  borderColor: btn.border,
                  borderRadius: 0,
                  // Stepped effect: add a blocky border
                  shadowColor: '#000',
                  shadowOffset: { width: 0, height: 2 },
                  shadowOpacity: 0.7,
                  shadowRadius: 0,
                }}
              >
                <TouchableOpacity onPress={btn.onPress} activeOpacity={0.7} style={{ width: '100%' }}>
                  <Text style={{
                    fontSize: 20,
                    fontWeight: 'bold',
                    color: '#fff',
                    textAlign: 'center',
                    letterSpacing: 2,
                    textShadowColor: '#000',
                    textShadowOffset: { width: 2, height: 2 },
                    textShadowRadius: 0,
                    fontFamily: 'PixelifySans',
                    textTransform: 'uppercase',
                  }}>{btn.label}</Text>
                </TouchableOpacity>
              </LinearGradient>
            </View>
          ))}
        </YStack>
      </View>

      {/* Exit Confirmation Modal */}
      <Modal
        visible={showExitConfirmation}
        transparent={true}
        animationType="fade"
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Exit Game</Text>
            <Text style={styles.modalText}>Are you sure you want to exit?</Text>
            <View style={styles.modalButtons}>
              <TouchableOpacity 
                style={[styles.modalButton, styles.cancelButton]} 
                onPress={handleCancelExit}
              >
                <Text style={styles.modalButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={[styles.modalButton, styles.exitConfirmButton]} 
                onPress={handleConfirmExit}
              >
                <Text style={styles.modalButtonText}>Exit</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
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
  },
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.8)',
  },
  modalContent: {
    backgroundColor: 'rgba(0,0,0,0.9)',
    padding: 20,
    borderRadius: 12,
    alignItems: 'center',
    width: '80%',
    borderWidth: 2,
    borderColor: '#20B2AA',
  },
  modalTitle: {
    color: 'white',
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 10,
    textShadowColor: '#20B2AA',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
  },
  modalText: {
    color: 'white',
    fontSize: 18,
    marginBottom: 20,
    textAlign: 'center',
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    width: '100%',
  },
  modalButton: {
    padding: 10,
    borderRadius: 8,
    width: '45%',
    alignItems: 'center',
    borderWidth: 2,
    shadowColor: '#000',
    shadowOffset: { width: 2, height: 2 },
    shadowOpacity: 1,
    shadowRadius: 0,
    elevation: 4,
  },
  modalButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: 'bold',
    textShadowColor: '#000',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 0,
  },
  cancelButton: {
    backgroundColor: '#2d2d2d',
    borderColor: '#4a4a4a',
  },
  exitConfirmButton: {
    backgroundColor: '#dc2626',
    borderColor: '#991b1b',
  },
});