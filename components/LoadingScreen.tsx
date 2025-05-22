import React, { useState, useEffect } from 'react';
import { View, Image, StyleSheet, Dimensions, Animated, Platform } from 'react-native';
import { Text } from 'tamagui';

const { width, height } = Dimensions.get('window');
const isLandscape = width > height;
const progressBarWidth = Math.min(width * 0.7, 280);

export default function LoadingScreen() {
    const [progress] = useState(new Animated.Value(0));
    const [loadingText, setLoadingText] = useState('Initializing...');
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

    useEffect(() => {
        // Animate progress from 0 to 100
        Animated.timing(progress, {
            toValue: 100,
            duration: 3000, // 3 seconds total loading time
            useNativeDriver: false,
        }).start();

        // Update loading text
        const texts = [
            'Summoning plushies...',
            'Charging magic...',
            'Preparing adventure...',
            'Almost ready...'
        ];

        let currentIndex = 0;
        const interval = setInterval(() => {
            currentIndex = (currentIndex + 1) % texts.length;
            setLoadingText(texts[currentIndex]);
        }, 750);

        return () => clearInterval(interval);
    }, []);

    const progressWidth = progress.interpolate({
        inputRange: [0, 100],
        outputRange: ['0%', '100%']
    });

    return (
        <View style={styles.container}>
            <View style={styles.pixelBorder}>
                <View style={styles.contentContainer}>
                    <Image
                        source={require('../assets/plushiechronicles.jpg')}
                        style={[
                            styles.logo,
                            {
                                width: dimensions.isLandscape ? width * 0.3 : width * 0.4,
                                height: dimensions.isLandscape ? width * 0.3 : width * 0.4
                            }
                        ]}
                        resizeMode="contain"
                    />

                    <View style={styles.loadingContainer}>
                        <Text style={styles.loadingText}>
                            {loadingText}
                        </Text>

                        <View style={styles.progressBarContainer}>
                            <Animated.View
                                style={[
                                    styles.progressBar,
                                    {
                                        width: progressWidth,
                                    }
                                ]}
                            />
                        </View>

                        <Text style={styles.percentageText}>
                            <Animated.Text>
                                {progress.interpolate({
                                    inputRange: [0, 100],
                                    outputRange: ['0%', '100%']
                                })}
                            </Animated.Text>
                        </Text>
                    </View>
                </View>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#000000',
        alignItems: 'center',
        justifyContent: 'center',
    },
    pixelBorder: {
        borderWidth: 4,
        borderColor: '#20B2AA',
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        borderRadius: 8,
        padding: 2,
        shadowColor: '#6B238E',
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.8,
        shadowRadius: 10,
        elevation: 10,
    },
    contentContainer: {
        alignItems: 'center',
        justifyContent: 'center',
        padding: 16,
        width: '100%',
    },
    logo: {
        marginBottom: 20,
    },
    loadingContainer: {
        width: progressBarWidth,
        alignItems: 'center',
    },
    loadingText: {
        color: '#20B2AA',
        fontSize: 16,
        fontWeight: '600',
        marginBottom: 10,
        textAlign: 'center',
        textShadowColor: '#6B238E',
        textShadowOffset: { width: 1, height: 1 },
        textShadowRadius: 4,
        fontFamily: 'PixelifySans',
    },
    progressBarContainer: {
        width: '100%',
        height: 16,
        backgroundColor: 'rgba(32, 178, 170, 0.2)',
        borderRadius: 4,
        borderWidth: 2,
        borderColor: '#20B2AA',
        overflow: 'hidden',
        marginBottom: 6,
    },
    progressBar: {
        height: '100%',
        backgroundColor: '#6B238E',
        borderRadius: 2,
    },
    percentageText: {
        color: '#FFFFFF',
        fontSize: 14,
        fontWeight: 'bold',
        textShadowColor: '#20B2AA',
        textShadowOffset: { width: 1, height: 1 },
        textShadowRadius: 2,
        fontFamily: 'PixelifySans',
    },
});
