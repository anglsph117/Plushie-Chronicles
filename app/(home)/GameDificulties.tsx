import { AVPlaybackStatus, ResizeMode, Video } from 'expo-av'
import { router } from 'expo-router'
import { useEffect, useRef, useState } from 'react'
import { Dimensions, Platform, Pressable, SafeAreaView, ScrollView, StyleSheet, View } from 'react-native'
import { styled, Text, YStack, XStack } from 'tamagui'
import { Ionicons } from '@expo/vector-icons'

const bgvid = require("../../assets/bgvid.mp4");

const { width, height } = Dimensions.get('window')
const isLandscape = width > height
const buttonWidth = Math.min(width * 0.8, 280)

interface Difficulty {
    id: string
    name: string
    description: string
    color: string
}

const difficulties: Difficulty[] = [
    {
        id: 'easy',
        name: 'Easy',
        description: 'Perfect for beginners',
        color: '#4CAF50'
    },
    {
        id: 'medium',
        name: 'Medium',
        description: 'Balanced challenge',
        color: '#FF9800'
    },
    {
        id: 'hard',
        name: 'Hard',
        description: 'For experienced players',
        color: '#F44336'
    }
]

const GameDifficulties = () => {
    const [selectedDifficulty, setSelectedDifficulty] = useState<string>('medium')
    const [dimensions, setDimensions] = useState({ width, height, isLandscape })
    const [videoStatus, setVideoStatus] = useState<AVPlaybackStatus | null>(null)
    const [videoError, setVideoError] = useState<string | null>(null)
    const [videoReady, setVideoReady] = useState(false)
    const videoRef = useRef<Video>(null)

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

    const ErrorText = styled(Text, {
        color: "#FF5555",
        fontSize: 14,
        textAlign: "center",
    });

    // Handle dimension changes
    useEffect(() => {
        const subscription = Dimensions.addEventListener('change', ({ window }: { window: { width: number; height: number } }) => {
            setDimensions({
                width: window.width,
                height: window.height,
                isLandscape: window.width > window.height
            })
        })

        return () => subscription.remove()
    }, [])

    return (
        <SafeAreaView style={styles.safeArea}>
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
                    onPlaybackStatusUpdate={setVideoStatus}
                />

                {/* Content Overlay */}
                <View style={styles.contentOverlay}>
                    {videoError && (
                        <View style={styles.errorContainer}>
                            <ErrorText>
                                Video error: Please check your connection
                            </ErrorText>
                        </View>
                    )}

                    <Pressable
                        onPress={() => router.back()}
                        style={({ pressed }: { pressed: boolean }) => [
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

                    <ScrollView
                        style={styles.scrollView}
                        contentContainerStyle={styles.scrollContent}
                        showsVerticalScrollIndicator={false}
                    >

                        {videoError && (
                            <YStack
                                padding={8}
                                backgroundColor="rgba(0, 0, 0, 0.7)"
                                borderRadius={10}
                                borderWidth={2}
                                borderColor="#FF5555"
                                marginHorizontal={16}
                                marginTop={16}
                                marginBottom={12}
                            >
                                <Text style={{
                                    color: "#FF5555",
                                    fontSize: 14,
                                    textAlign: "center",
                                    textShadowColor: 'rgba(0, 0, 0, 0.5)',
                                    textShadowOffset: { width: 1, height: 1 },
                                    textShadowRadius: 2
                                }}>
                                    {videoError}
                                </Text>
                            </YStack>
                        )}

                        <YStack space={8} width="100%" marginBottom={16} alignItems="center">
                            {difficulties.map((difficulty) => (
                                <Pressable
                                    key={difficulty.id}
                                    onPress={() => setSelectedDifficulty(difficulty.id)}
                                    style={({ pressed }: { pressed: boolean }) => [
                                        styles.difficultyButton,
                                        {
                                            backgroundColor: selectedDifficulty === difficulty.id
                                                ? difficulty.color
                                                : 'rgba(0, 0, 0, 0.6)',
                                            borderColor: difficulty.color,
                                            transform: [{ scale: selectedDifficulty === difficulty.id ? 1.05 : pressed ? 0.97 : 1 }]
                                        }
                                    ]}
                                >
                                    <YStack space={4} alignItems="center" justifyContent="center">
                                        <StyledText
                                            fontSize={18}
                                            color={selectedDifficulty === difficulty.id ? '#FFFFFF' : difficulty.color}
                                        >
                                            {difficulty.name}
                                        </StyledText>
                                        <StyledText
                                            fontSize={14}
                                            color="#CCCCCC"
                                        >
                                            {difficulty.description}
                                        </StyledText>
                                    </YStack>
                                </Pressable>
                            ))}
                        </YStack>

                        <Pressable
                            onPress={() => router.push('/(home)/HeroCustomization')}
                            style={({ pressed }: { pressed: boolean }) => [
                                styles.confirmButton,
                                {
                                    transform: [{ scale: pressed ? 0.97 : 1 }]
                                }
                            ]}
                        >
                            <StyledText>
                                CONFIRM
                            </StyledText>
                        </Pressable>
                    </ScrollView>
                </View>
            </View>
        </SafeAreaView>
    )
}

export default GameDifficulties

const styles = StyleSheet.create({
    safeArea: {
        flex: 1,
        backgroundColor: '#000000',
    },
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
    scrollView: {
        flex: 1,
    },
    scrollContent: {
        paddingHorizontal: 16,
        paddingTop: 30,
        paddingBottom: 24,
        alignItems: 'center',
    },
    header: {
        width: '100%',
        flexDirection: 'row',
        justifyContent: 'space-between',
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
    errorContainer: {
        padding: 8,
        backgroundColor: 'rgba(0, 0, 0, 0.7)',
        borderRadius: 10,
        borderWidth: 2,
        borderColor: '#FF5555',
        marginHorizontal: 16,
        marginTop: 16,
        marginBottom: 12,
    },
    difficultyButton: {
        width: buttonWidth,
        padding: 12,
        borderRadius: 10,
        borderWidth: 2,
        alignItems: 'center',
        justifyContent: 'center',
        marginVertical: 6,
        shadowColor: '#20B2AA',
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.6,
        shadowRadius: 12,
        elevation: 6,
    },
    confirmButton: {
        width: buttonWidth,
        height: 50,
        backgroundColor: '#6B238E',
        borderWidth: 2,
        borderColor: '#20B2AA',
        borderRadius: 10,
        alignItems: 'center',
        justifyContent: 'center',
        marginVertical: 6,
        shadowColor: '#20B2AA',
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.6,
        shadowRadius: 12,
        elevation: 6,
    }
})