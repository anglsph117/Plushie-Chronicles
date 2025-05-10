import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Video, ResizeMode } from 'expo-av';
import { useRouter, useLocalSearchParams } from 'expo-router';

const NextLevel = () => {
  const router = useRouter();
  const { playerName, playerImageUrl, selectedSkills } = useLocalSearchParams<{
    playerName: string;
    playerImageUrl: string;
    selectedSkills: string;
  }>();

  return (
    <View style={styles.container}>
      <Video
        source={require('../../assets/bgvid.mp4')}
        style={styles.backgroundVideo}
        shouldPlay
        isLooping
        isMuted
        resizeMode={ResizeMode.COVER}
      />
      
      <View style={styles.overlay}>
        <Text style={styles.title}>Level Complete!</Text>
        <Text style={styles.subtitle}>Prepare for the next challenge</Text>
        
        <View style={styles.buttonContainer}>
          <TouchableOpacity
            style={styles.button}
            onPress={() => router.push({
              pathname: '/(home)/BattleSystem',
              params: { 
                playerName,
                playerImageUrl,
                selectedSkills
              }
            })}
          >
            <Text style={styles.buttonText}>Continue</Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={styles.button}
            onPress={() => router.push('/')}
          >
            <Text style={styles.buttonText}>Return to Menu</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  backgroundVideo: {
    position: 'absolute',
    top: 0,
    left: 0,
    bottom: 0,
    right: 0,
  },
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  title: {
    color: '#FFFFFF',
    fontSize: 32,
    fontWeight: 'bold',
    marginBottom: 10,
    textShadowColor: '#20B2AA',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 6,
  },
  subtitle: {
    color: '#FFFFFF',
    fontSize: 18,
    marginBottom: 30,
    textAlign: 'center',
  },
  buttonContainer: {
    width: '100%',
    maxWidth: 300,
  },
  button: {
    backgroundColor: '#6B238E',
    padding: 15,
    borderRadius: 10,
    marginBottom: 15,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#20B2AA',
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: 'bold',
  },
});

export default NextLevel; 