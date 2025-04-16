import { StyleSheet, View, Dimensions, ScrollView, Pressable } from 'react-native'
import React, { useState, useEffect, useRef } from 'react'
import { Text, YStack, XStack, Button } from 'tamagui'
import { styled } from 'tamagui'
import { Video, ResizeMode, AVPlaybackStatus } from 'expo-av';
import bgvid from "../../assets/bgvid.mp4";
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import LoadingScreen from '../../components/LoadingScreen';

const { width, height } = Dimensions.get('window');
const isLandscape = width > height;
const containerWidth = Math.min(width * 0.9, 400);

const SettingsContainer = styled(View, {
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    borderWidth: 2,
    borderColor: '#20B2AA',
    padding: 20,
    marginHorizontal: 16,
    marginVertical: 8,
    width: containerWidth,
    borderRadius: 12,
    shadowColor: '#20B2AA',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.3,
    shadowRadius: 10
});

const SettingsText = styled(Text, {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '600',
    textAlign: "left",
    textShadowColor: '#20B2AA',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
});

const ControlButton = styled(Button, {
    backgroundColor: '#6B238E',
    borderColor: '#20B2AA',
    borderWidth: 2,
    height: 40,
    width: 40,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#20B2AA',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.4,
    shadowRadius: 4
});

const ToggleButton = styled(Button, {
    backgroundColor: '#6B238E',
    borderColor: '#20B2AA',
    borderWidth: 2,
    height: 36,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
});

const VolumeBar = styled(View, {
    height: 20,
    backgroundColor: '#20B2AA',
    borderRadius: 4,
});

interface VolumeControlProps {
    label: string;
    value: number;
    onIncrease: () => void;
    onDecrease: () => void;
    isEnabled: boolean;
    onToggle: () => void;
}

const VolumeControl = ({ label, value, onIncrease, onDecrease, isEnabled, onToggle }: VolumeControlProps) => (
    <YStack space={12}>
        <XStack justifyContent="space-between" alignItems="center">
            <SettingsText>{label}</SettingsText>
            <ToggleButton
                pressStyle={{ scale: 0.97, opacity: 0.8 }}
                onPress={onToggle}
            >
                <SettingsText fontSize={14}>{isEnabled ? "ON" : "OFF"}</SettingsText>
            </ToggleButton>
        </XStack>
        <XStack alignItems="center" space={12}>
            <ControlButton
                pressStyle={{ scale: 0.95, opacity: 0.8 }}
                onPress={onDecrease}
            >
                <Ionicons name="remove" size={24} color="#FFFFFF" />
            </ControlButton>
            <View style={styles.volumeBarContainer}>
                <VolumeBar style={{ width: `${value}%`, opacity: isEnabled ? 1 : 0.5 }} />
            </View>
            <ControlButton
                pressStyle={{ scale: 0.95, opacity: 0.8 }}
                onPress={onIncrease}
            >
                <Ionicons name="add" size={24} color="#FFFFFF" />
            </ControlButton>
        </XStack>
    </YStack>
);

const SoundEffects = () => {
    const videoRef = useRef<Video>(null);
    const [videoStatus, setVideoStatus] = useState<AVPlaybackStatus | null>(null);
    const [videoError, setVideoError] = useState(null);
    const [videoReady, setVideoReady] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const [masterVolume, setMasterVolume] = useState(70);
    const [musicVolume, setMusicVolume] = useState(60);
    const [effectsVolume, setEffectsVolume] = useState(80);
    const [isSoundEnabled, setIsSoundEnabled] = useState(true);
    const [isMusicEnabled, setIsMusicEnabled] = useState(true);
    const [isEffectsEnabled, setIsEffectsEnabled] = useState(true);
    const [dimensions, setDimensions] = useState({ width, height, isLandscape });

    useEffect(() => {
        const subscription = Dimensions.addEventListener('change', ({ window }) => {
            setDimensions({
                width: window.width,
                height: window.height,
                isLandscape: window.width > window.height
            });
        });

        return () => subscription.remove();
    }, []);

    useEffect(() => {
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

                <Pressable
                    onPress={() => router.back()}
                    style={({ pressed }) => [
                        styles.backButton,
                        { transform: [{ scale: pressed ? 0.95 : 1 }] }
                    ]}
                >
                    <XStack space={8} alignItems="center" paddingHorizontal={12}>
                        <Ionicons name="arrow-back" size={20} color="#20B2AA" />
                        <Text style={styles.backButtonText}>
                            Back
                        </Text>
                    </XStack>
                </Pressable>

                <View style={{
                    flex: 1,
                    alignItems: 'center',
                    justifyContent: 'center',
                    paddingTop: dimensions.isLandscape ? 10 : 5
                }}>
                    <View style={{
                        width: '100%',
                        maxWidth: dimensions.isLandscape ? 1000 : 800,
                        justifyContent: 'center'
                    }}>
                        <ScrollView
                            showsVerticalScrollIndicator={false}
                            contentContainerStyle={{
                                flexGrow: 1,
                                justifyContent: 'center',
                                alignItems: 'center',
                                padding: dimensions.isLandscape ? 8 : 6
                            }}
                        >
                            <View style={styles.header}>
                                <Text style={styles.title}>
                                    AUDIO SETTINGS
                                </Text>
                            </View>

                            <YStack alignItems="center" space={20}>
                                <SettingsContainer>
                                    <YStack space={24}>
                                        <VolumeControl
                                            label="Master Volume"
                                            value={masterVolume}
                                            onIncrease={() => setMasterVolume(Math.min(100, masterVolume + 10))}
                                            onDecrease={() => setMasterVolume(Math.max(0, masterVolume - 10))}
                                            isEnabled={isSoundEnabled}
                                            onToggle={() => setIsSoundEnabled(!isSoundEnabled)}
                                        />

                                        <VolumeControl
                                            label="Music Volume"
                                            value={musicVolume}
                                            onIncrease={() => setMusicVolume(Math.min(100, musicVolume + 10))}
                                            onDecrease={() => setMusicVolume(Math.max(0, musicVolume - 10))}
                                            isEnabled={isMusicEnabled}
                                            onToggle={() => setIsMusicEnabled(!isMusicEnabled)}
                                        />

                                        <VolumeControl
                                            label="Effects Volume"
                                            value={effectsVolume}
                                            onIncrease={() => setEffectsVolume(Math.min(100, effectsVolume + 10))}
                                            onDecrease={() => setEffectsVolume(Math.max(0, effectsVolume - 10))}
                                            isEnabled={isEffectsEnabled}
                                            onToggle={() => setIsEffectsEnabled(!isEffectsEnabled)}
                                        />
                                    </YStack>
                                </SettingsContainer>
                            </YStack>
                        </ScrollView>
                    </View>
                </View>
            </View>
        </View>
    )
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
    scrollView: {
        flex: 1,
    },
    scrollContent: {
        paddingVertical: 20,
        paddingTop: 30,
    },
    header: {
        width: '100%',
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 20,
        paddingHorizontal: 20
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
        textShadowRadius: 2
    },
    title: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#FFFFFF',
        textAlign: 'center',
        textShadowColor: '#20B2AA',
        textShadowOffset: { width: 1, height: 1 },
        textShadowRadius: 4,
    },
    volumeBarContainer: {
        flex: 1,
        height: 20,
        backgroundColor: 'rgba(32, 178, 170, 0.2)',
        borderWidth: 2,
        borderColor: '#20B2AA',
        borderRadius: 4,
        overflow: 'hidden',
    },
});

export default SoundEffects;

