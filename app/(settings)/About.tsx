import { StyleSheet, View, Dimensions, ScrollView, Pressable } from 'react-native'
import React, { useRef, useEffect } from 'react'
import { Text, XStack, YStack } from 'tamagui'
import { styled } from 'tamagui'
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

const HeadingText = styled(Text, {
    color: '#20B2AA',
    fontSize: 20,
    fontWeight: '700',
    textAlign: "left",
    textShadowColor: '#000000',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
    marginTop: 16,
    marginBottom: 8,
    textTransform: "uppercase",
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

const VersionText = styled(Text, {
    color: '#20B2AA',
    fontSize: 14,
    textAlign: "center",
    marginTop: 20,
    fontFamily: '$body',
});

const About = () => {
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
                        <Text style={styles.backButtonText}>
                            Back
                        </Text>
                    </XStack>
                </Pressable>
                <ScrollView
                    style={styles.scrollView}
                    showsVerticalScrollIndicator={false}
                    contentContainerStyle={styles.scrollContent}
                >

                    <YStack alignItems="center">
                        <PixelContainer>
                            <HeadingText>Game Description</HeadingText>
                            <ContentText>
                                Plushie Chronicles is an engaging offline mobile fighting game designed to bring
                                excitement and strategy to players of all ages. At its core, the game offers an
                                exhilarating combat experience where players can enjoy fast-paced battles and
                                strategic gameplay with adorable yet fierce plushie fighters.
                            </ContentText>

                            <HeadingText>Features</HeadingText>
                            <ContentText>
                                • Diverse Roster of Plushie Fighters{'\n'}
                                • Three Unique Skills per Character{'\n'}
                                • Epic Ultimate Abilities{'\n'}
                                • Strategic Combat System{'\n'}
                                • High-Quality Graphics{'\n'}
                                • Offline Gameplay{'\n'}
                                • Intuitive Controls
                            </ContentText>

                            <HeadingText>Gameplay</HeadingText>
                            <ContentText>
                                Master the art of combat through thrilling one-on-one matches.
                                Combine skills strategically, unleash powerful ultimate abilities,
                                and demonstrate your quick reflexes to defeat opponents. The
                                charming art style and user-friendly interface ensure an enjoyable
                                and immersive experience for everyone.
                            </ContentText>

                            <HeadingText>Combat System</HeadingText>
                            <ContentText>
                                • Strategic Skill Combinations{'\n'}
                                • Real-time Battle Mechanics{'\n'}
                                • Character-specific Movesets{'\n'}
                                • Ultimate Ability System{'\n'}
                                • Dynamic Combat Animations
                            </ContentText>

                            <HeadingText>Credits</HeadingText>
                            <ContentText>
                                Developed by Playbox Studio{'\n'}
                                Art Direction: Angel Saydoquen, Mar Jonel Rebustes, Lloyd Quijano, Jthird Sadje, Kwarl Ortega, {'\n'}
                                Sound Design: Andrhei Bleza, Melnard Doctolero{'\n'}
                                Combat Design: Angel Saydoquen, Justin Dacula
                            </ContentText>

                            <VersionText>Version 1.0.0</VersionText>
                        </PixelContainer>
                    </YStack>
                </ScrollView>
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
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
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
    title: {
        color: '#FFFFFF',
        fontSize: 24,
        fontWeight: 'bold',
        textAlign: 'center',
        textShadowColor: '#20B2AA',
        textShadowOffset: { width: 1, height: 1 },
        textShadowRadius: 4
    },
});

export default About;
