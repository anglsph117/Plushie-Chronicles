import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Audio } from 'expo-av';

interface MusicContextType {
  bgmSound: Audio.Sound | null;
  isBgmPlaying: boolean;
  isMuted: boolean;
  playBgm: () => Promise<void>;
  pauseBgm: () => Promise<void>;
  stopBgm: () => Promise<void>;
  setBgmVolume: (volume: number) => Promise<void>;
  toggleMute: () => Promise<void>;
}

const MusicContext = createContext<MusicContextType | undefined>(undefined);

export const MusicProvider = ({ children }: { children: ReactNode }) => {
  const [bgmSound, setBgmSound] = useState<Audio.Sound | null>(null);
  const [isBgmPlaying, setIsBgmPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);

  useEffect(() => {
    const loadBGM = async () => {
      try {
        const { sound } = await Audio.Sound.createAsync(
          require('../assets/audio/battleground.mp4'),
          { isLooping: true }
        );
        setBgmSound(sound);
      } catch (error) {
        console.error('Error loading BGM:', error);
      }
    };

    loadBGM();

    return () => {
      if (bgmSound) {
        bgmSound.unloadAsync();
      }
    };
  }, []);

  const playBgm = async () => {
    if (bgmSound && !isBgmPlaying) {
      if (!isMuted) {
        await bgmSound.playAsync();
        setIsBgmPlaying(true);
      }
    }
  };

  const pauseBgm = async () => {
    if (bgmSound && isBgmPlaying) {
      await bgmSound.pauseAsync();
      setIsBgmPlaying(false);
    }
  };

  const stopBgm = async () => {
    if (bgmSound) {
      await bgmSound.stopAsync();
      setIsBgmPlaying(false);
    }
  };

  const setBgmVolume = async (volume: number) => {
    if (bgmSound) {
      await bgmSound.setVolumeAsync(isMuted ? 0 : volume);
    }
  };

  const toggleMute = async () => {
    if (bgmSound) {
      const newMutedState = !isMuted;
      await bgmSound.setVolumeAsync(newMutedState ? 0 : 1);
      setIsMuted(newMutedState);
      if (isBgmPlaying) {
        // If music was playing and now muted, it's technically still playing but silent
        // If music was playing and now unmuted, it continues playing
      }
    }
  };

  return (
    <MusicContext.Provider value={{ bgmSound, isBgmPlaying, isMuted, playBgm, pauseBgm, stopBgm, setBgmVolume, toggleMute }}>
      {children}
    </MusicContext.Provider>
  );
};

export const useMusic = () => {
  const context = useContext(MusicContext);
  if (context === undefined) {
    throw new Error('useMusic must be used within a MusicProvider');
  }
  return context;
}; 