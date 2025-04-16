import { View, Text, ScrollView, Pressable, Dimensions, Platform, StyleSheet } from 'react-native'
import React, { useState, useEffect } from 'react'
import { Image, styled, XStack } from 'tamagui'
import { Video, ResizeMode } from 'expo-av'
const bgvid = require('../../assets/bgvid.mp4');
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';


const { width, height } = Dimensions.get('window')
const isLandscape = width > height
const cardWidth = isLandscape ? Math.min(140, width * 0.15) : Math.min(120, width * 0.3)
const cardHeight = Math.floor(cardWidth * 1.4)

interface Hero {
    id: string
    name: string
    imageUrl: string
    gender: string
}

const heroes: Hero[] = [
    {
        id: '1',
        name: "Justin",
        gender: "Male",
        imageUrl: "https://ajmhkwiqsnuilsacrxby.supabase.co/storage/v1/object/public/monkey-images//1.png"
    },
    {
        id: '2',
        name: "Angel",
        gender: "Female",
        imageUrl: "https://ajmhkwiqsnuilsacrxby.supabase.co/storage/v1/object/public/monkey-images//6.png"
    },
    {
        id: '3',
        name: "Dwyane",
        gender: "Non-Binary",
        imageUrl: "https://ajmhkwiqsnuilsacrxby.supabase.co/storage/v1/object/public/monkey-images//3.png"
    },
    {
        id: '4',
        name: "Jonel",
        gender: "Male",
        imageUrl: "https://ajmhkwiqsnuilsacrxby.supabase.co/storage/v1/object/public/monkey-images//4.png"
    },
    {
        id: '5',
        name: "Andrhei",
        gender: "Female",
        imageUrl: "https://ajmhkwiqsnuilsacrxby.supabase.co/storage/v1/object/public/monkey-images//7.png"
    }
]

const HeroCustomization = () => {
    const [selectedHero, setSelectedHero] = useState<string>('1')
    const videoRef = React.useRef<Video>(null);
    const [dimensions, setDimensions] = useState({ width, height, isLandscape });

    // Handle dimension changes
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


    const styles = StyleSheet.create({
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
        }
    });

    const StyledText = styled(Text, {
        style: {
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
        }
    });

    return (
        <View style={{ flex: 1, backgroundColor: 'black' }}>
            {/* Background Video */}
            <Video
                ref={videoRef}
                source={bgvid}
                style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    width: '100%',
                    height: '100%',
                }}
                resizeMode={ResizeMode.COVER}
                isLooping
                isMuted={true}
                shouldPlay
                useNativeControls={false}
            />



            {/* Content Overlay */}
            <View style={{
                flex: 1,
                backgroundColor: 'rgba(0, 0, 0, 0.7)',
                padding: dimensions.isLandscape ? 12 : 10
            }}>
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
                    justifyContent: 'space-between',
                    paddingTop: dimensions.isLandscape ? 10 : 5
                }}>

                    <View style={{
                        flex: 1,
                        width: '100%',
                        maxWidth: dimensions.isLandscape ? 1000 : 800,
                        justifyContent: 'center'
                    }}>


                        <ScrollView
                            horizontal={dimensions.isLandscape}
                            showsHorizontalScrollIndicator={false}
                            showsVerticalScrollIndicator={false}
                            contentContainerStyle={{
                                flexGrow: 1,
                                justifyContent: 'center',
                                alignItems: 'center',
                                padding: dimensions.isLandscape ? 8 : 6
                            }}
                        >
                            <View style={{
                                flexDirection: dimensions.isLandscape ? 'row' : 'column',
                                flexWrap: dimensions.isLandscape ? 'nowrap' : 'wrap',
                                justifyContent: 'center',
                                alignItems: 'center',
                                gap: dimensions.isLandscape ? 16 : 12,
                                paddingVertical: dimensions.isLandscape ? 8 : 6
                            }}>
                                {heroes.map((hero) => (
                                    <Pressable
                                        key={hero.id}
                                        onPress={() => setSelectedHero(hero.id)}
                                        style={({ pressed }) => [
                                            {
                                                transform: [{ scale: selectedHero === hero.id ? 1.05 : pressed ? 0.98 : 1 }],
                                                transition: 'transform 0.2s'
                                            }
                                        ]}
                                    >
                                        <View style={{
                                            width: cardWidth,
                                            height: cardHeight,
                                            borderRadius: 12,
                                            borderWidth: 2,
                                            borderColor: selectedHero === hero.id ? '#FFD700' : '#20B2AA',
                                            backgroundColor: selectedHero === hero.id ? 'rgba(128, 0, 128, 0.6)' : 'rgba(128, 0, 128, 0.4)',
                                            overflow: 'hidden',
                                            shadowColor: selectedHero === hero.id ? '#FFD700' : '#20B2AA',
                                            shadowOffset: { width: 0, height: 0 },
                                            shadowOpacity: 0.6,
                                            shadowRadius: 8,
                                            elevation: 6
                                        }}>
                                            <View style={{ flex: 1, padding: 6 }}>
                                                <Image
                                                    source={{ uri: hero.imageUrl }}
                                                    style={{
                                                        width: '100%',
                                                        height: '75%',
                                                        borderRadius: 6,
                                                        marginBottom: 4
                                                    }}
                                                    resizeMode="contain"
                                                />
                                                <View style={{
                                                    height: '25%',
                                                    justifyContent: 'center',
                                                    alignItems: 'center',
                                                    backgroundColor: 'rgba(0, 0, 0, 0.4)',
                                                    borderRadius: 4,
                                                    padding: 2
                                                }}>
                                                    <Text style={{
                                                        fontSize: dimensions.isLandscape ? 14 : 12,
                                                        fontWeight: 'bold',
                                                        color: 'white',
                                                        textAlign: 'center',
                                                        textShadowColor: '#20B2AA',
                                                        textShadowOffset: { width: 1, height: 1 },
                                                        textShadowRadius: 2,
                                                        marginBottom: 1
                                                    }}>
                                                        {hero.name}
                                                    </Text>
                                                    <Text style={{
                                                        fontSize: dimensions.isLandscape ? 10 : 9,
                                                        color: '#E0E0E0',
                                                        textAlign: 'center',
                                                        textShadowColor: '#000',
                                                        textShadowOffset: { width: 1, height: 1 },
                                                        textShadowRadius: 1
                                                    }}>
                                                        {hero.gender}
                                                    </Text>
                                                </View>
                                            </View>
                                        </View>
                                    </Pressable>
                                ))}
                            </View>
                        </ScrollView>
                    </View>

                    <View style={{
                        width: '100%',
                        paddingHorizontal: dimensions.isLandscape ? 16 : 12,
                        paddingVertical: dimensions.isLandscape ? 16 : 12,
                        alignItems: 'center',
                        backgroundColor: 'rgba(0, 0, 0, 0.3)',
                        borderTopWidth: 1,
                        borderTopColor: 'rgba(32, 178, 170, 0.3)'
                    }}>
                        <Pressable
                            onPress={() => router.push('/(home)/SkillsSelection')}
                            style={({ pressed }) => ({
                                width: dimensions.isLandscape ? 200 : 180,
                                height: dimensions.isLandscape ? 45 : 40,
                                backgroundColor: pressed ? '#6B238E' : '#8B008B',
                                borderWidth: 2,
                                borderColor: '#20B2AA',
                                borderRadius: 8,
                                shadowColor: '#20B2AA',
                                shadowOffset: { width: 0, height: 0 },
                                shadowOpacity: 0.6,
                                shadowRadius: 6,
                                elevation: 4,
                                transform: [{ scale: pressed ? 0.98 : 1 }]
                            })}
                        >
                            <View style={{
                                flex: 1,
                                justifyContent: 'center',
                                alignItems: 'center',
                                paddingHorizontal: 12
                            }}>
                                <Text style={{
                                    fontSize: dimensions.isLandscape ? 16 : 14,
                                    fontWeight: 'bold',
                                    color: 'white',
                                    textAlign: 'center',
                                    textShadowColor: '#20B2AA',
                                    textShadowOffset: { width: 1, height: 1 },
                                    textShadowRadius: 2,
                                    letterSpacing: 1
                                }}>
                                    CONFIRM SELECTION
                                </Text>
                            </View>
                        </Pressable>
                    </View>
                </View>
            </View>
        </View>
    )
}

export default HeroCustomization