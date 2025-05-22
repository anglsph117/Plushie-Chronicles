import { StyleSheet, Text, View, Image, TouchableOpacity, ScrollView, Dimensions, Animated } from 'react-native'
import React, { useState, useRef, useEffect } from 'react'
import { Video, ResizeMode } from 'expo-av'
import { router, useLocalSearchParams } from 'expo-router'
import { styled } from 'tamagui'
import { Button, YStack, XStack } from 'tamagui'

interface Skill {
    id: number;
    name: string;
    description: string;
    imageUrl: string;
    selected: boolean;
    cooldown: number;  // in seconds
    damage: number;    // damage points
}

// Sample skills data
const skillsData: Skill[] = [
    {
        id: 1,
        name: 'Boulder',
        description: 'Summon a massive boulder to crush enemies',
        imageUrl: 'https://owqaiuqmvihvwomtiimr.supabase.co/storage/v1/object/public/plushiechronicles/skills/boulder-removebg-preview.png',
        selected: false,
        cooldown: 8,
        damage: 30
    },
    {
        id: 2,
        name: 'Cryo Crystals',
        description: 'Create ice crystals that freeze enemies',
        imageUrl: 'https://owqaiuqmvihvwomtiimr.supabase.co/storage/v1/object/public/plushiechronicles/skills/cryo_crystals-removebg-preview.png',
        selected: false,
        cooldown: 6,
        damage: 30
    },
    {
        id: 3,
        name: 'Elemental Sword Master',
        description: 'Master the art of elemental sword combat',
        imageUrl: 'https://owqaiuqmvihvwomtiimr.supabase.co/storage/v1/object/public/plushiechronicles/skills/elemental_sword_master-removebg-preview.png',
        selected: false,
        cooldown: 4,
        damage: 30
    },
    {
        id: 4,
        name: 'Enlightenment',
        description: 'Gain deep understanding of combat techniques',
        imageUrl: 'https://owqaiuqmvihvwomtiimr.supabase.co/storage/v1/object/public/plushiechronicles/skills/enlightenment-removebg-preview.png',
        selected: false,
        cooldown: 10,
        damage: 0
    },
    {
        id: 5,
        name: 'Fireball',
        description: 'Launch a powerful fireball at enemies',
        imageUrl: 'https://owqaiuqmvihvwomtiimr.supabase.co/storage/v1/object/public/plushiechronicles/skills/fireball-removebg-preview.png',
        selected: false,
        cooldown: 5,
        damage: 35
    },
    {
        id: 6,
        name: 'Flurries',
        description: 'Execute rapid sword strikes',
        imageUrl: 'https://owqaiuqmvihvwomtiimr.supabase.co/storage/v1/object/public/plushiechronicles/skills/flurries-removebg-preview.png',
        selected: false,
        cooldown: 3,
        damage: 20
    },
    {
        id: 7,
        name: 'Heavy Slash',
        description: 'Perform a devastating sword slash',
        imageUrl: 'https://owqaiuqmvihvwomtiimr.supabase.co/storage/v1/object/public/plushiechronicles/skills/heavy_slash-removebg-preview.png',
        selected: false,
        cooldown: 7,
        damage: 35
    },
    {
        id: 8,
        name: 'More Health',
        description: 'Increase your maximum health',
        imageUrl: 'https://owqaiuqmvihvwomtiimr.supabase.co/storage/v1/object/public/plushiechronicles/skills/more_health-removebg-preview.png',
        selected: false,
        cooldown: 0,
        damage: 0
    },
    {
        id: 9,
        name: 'Quick Slash',
        description: 'Execute a fast sword slash',
        imageUrl: 'https://owqaiuqmvihvwomtiimr.supabase.co/storage/v1/object/public/plushiechronicles/skills/quick_slash-removebg-preview.png',
        selected: false,
        cooldown: 2,
        damage: 20
    },
    {
        id: 10,
        name: 'Quick Step',
        description: 'Move quickly to dodge attacks',
        imageUrl: 'https://owqaiuqmvihvwomtiimr.supabase.co/storage/v1/object/public/plushiechronicles/skills/quick_step-removebg-preview.png',
        selected: false,
        cooldown: 4,
        damage: 0
    },
    {
        id: 11,
        name: 'Replenish',
        description: 'Restore health and energy',
        imageUrl: 'https://owqaiuqmvihvwomtiimr.supabase.co/storage/v1/object/public/plushiechronicles/skills/replenish-removebg-preview.png',
        selected: false,
        cooldown: 12,
        damage: 0
    },
    {
        id: 12,
        name: 'Swift',
        description: 'Increase movement speed',
        imageUrl: 'https://owqaiuqmvihvwomtiimr.supabase.co/storage/v1/object/public/plushiechronicles/skills/swift-removebg-preview.png',
        selected: false,
        cooldown: 0,
        damage: 0
    },
    {
        id: 13,
        name: 'Sword Blessing',
        description: 'Enhance sword damage',
        imageUrl: 'https://owqaiuqmvihvwomtiimr.supabase.co/storage/v1/object/public/plushiechronicles/skills/sword_blessing-removebg-preview.png',
        selected: false,
        cooldown: 15,
        damage: 0
    },
    {
        id: 14,
        name: 'Thrust',
        description: 'Perform a powerful thrust attack',
        imageUrl: 'https://owqaiuqmvihvwomtiimr.supabase.co/storage/v1/object/public/plushiechronicles/skills/thrust-removebg-preview.png',
        selected: false,
        cooldown: 5,
        damage: 30
    },
    {
        id: 15,
        name: 'Water Shot',
        description: 'Launch a water projectile',
        imageUrl: 'https://owqaiuqmvihvwomtiimr.supabase.co/storage/v1/object/public/plushiechronicles/skills/water_shot-removebg-preview.png',
        selected: false,
        cooldown: 4,
        damage: 30
    }
];

const StyledButton = styled(Button, {
    backgroundColor: "#6B238E",
    borderColor: "#20B2AA",
    borderWidth: 2,
    borderRadius: 10,
    width: 200,
    height: 50,
    marginVertical: 8,
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

const StyledText = ({ children }: { children: React.ReactNode }) => (
    <Text style={{
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
        fontFamily: 'Jersey10',
    }}>
        {children}
    </Text>
);

const SkillsSelection = () => {
    const { playerName, playerImageUrl, difficulty, enemyHealth } = useLocalSearchParams<{ 
        playerName: string;
        playerImageUrl: string;
        difficulty: string;
        enemyHealth: string;
    }>();
    const [skills, setSkills] = useState<Skill[]>(skillsData);
    const [selectedSkills, setSelectedSkills] = useState<Skill[]>([]);
    const videoRef = React.useRef<Video>(null);
    const fadeAnim = useRef(new Animated.Value(0)).current;
    const scaleAnim = useRef(new Animated.Value(0.9)).current;
    const [selectedCount, setSelectedCount] = useState(0);
    const MAX_SELECTED_SKILLS = 3;

    useEffect(() => {
        Animated.parallel([
            Animated.timing(fadeAnim, {
                toValue: 1,
                duration: 500,
                useNativeDriver: true,
            }),
            Animated.spring(scaleAnim, {
                toValue: 1,
                friction: 8,
                tension: 40,
                useNativeDriver: true,
            })
        ]).start();
    }, []);

    const toggleSkill = (skillId: number) => {
        const updatedSkills = skills.map(s => {
            if (s.id === skillId) {
                const newSelectedState = !s.selected;
                if (newSelectedState && selectedSkills.length >= MAX_SELECTED_SKILLS) {
                    return s; // Don't allow selection if max skills reached
                }
                return { ...s, selected: newSelectedState };
            }
            return s;
        });
        setSkills(updatedSkills);
        const newSelectedSkills = updatedSkills.filter(s => s.selected);
        setSelectedSkills(newSelectedSkills);
        setSelectedCount(newSelectedSkills.length);
    };

    const handleConfirm = () => {
        if (selectedSkills.length === 3) {
            router.push({
                pathname: '/(home)/MapSelection',
                params: { 
                    playerName,
                    playerImageUrl,
                    selectedSkills: JSON.stringify(selectedSkills),
                    difficulty,
                    enemyHealth
                }
            });
        }
    };

    return (
        <View style={styles.container}>
            <Video
                ref={videoRef}
                source={require('../../assets/bgvid.mp4')}
                style={styles.backgroundVideo}
                resizeMode={ResizeMode.COVER}
                isLooping
                isMuted={true}
                shouldPlay
                useNativeControls={false}
            />

            <Animated.View
                style={[
                    styles.contentOverlay,
                    { opacity: fadeAnim, transform: [{ scale: scaleAnim }] }
                ]}
            >
                <View style={styles.header}>
                    <View style={styles.titleContainer}>
                        <Text style={styles.title}>Select Your Skills</Text>
                        <Text style={styles.subtitle}>Choose {MAX_SELECTED_SKILLS} skills to continue</Text>
                    </View>
                    <TouchableOpacity
                        style={styles.backButton}
                        onPress={() => router.back()}
                    >
                        <Text style={styles.backButtonText}>← Back</Text>
                    </TouchableOpacity>
                </View>

                <View style={styles.mainContent}>
                    <View style={styles.column}>
                        <Text style={styles.columnTitle}>Selected Skills ({selectedSkills.length}/{MAX_SELECTED_SKILLS})</Text>
                        <ScrollView style={styles.selectedSkillsContainer}>
                            {selectedSkills.map((skill) => (
                                <Animated.View
                                    key={skill.id}
                                    style={[
                                        styles.selectedSkillCard,
                                        {
                                            opacity: fadeAnim,
                                            transform: [{ scale: scaleAnim }]
                                        }
                                    ]}
                                >
                                    <Image
                                        source={{ uri: skill.imageUrl }}
                                        style={styles.smallSkillImage}
                                    />
                                    <View style={styles.skillInfo}>
                                        <Text style={styles.skillName}>{skill.name}</Text>
                                        <View style={styles.skillStats}>
                                            {skill.damage > 0 && (
                                                <View style={styles.statContainer}>
                                                    <Text style={styles.statLabel}>DMG</Text>
                                                    <Text style={styles.statValue}>{skill.damage}</Text>
                                                </View>
                                            )}
                                            {skill.cooldown > 0 && (
                                                <View style={styles.statContainer}>
                                                    <Text style={styles.statLabel}>CD</Text>
                                                    <Text style={styles.statValue}>{skill.cooldown}s</Text>
                                                </View>
                                            )}
                                        </View>
                                        <Text style={styles.skillDescription}>{skill.description}</Text>
                                    </View>
                                    <TouchableOpacity
                                        style={styles.removeButton}
                                        onPress={() => toggleSkill(skill.id)}
                                    >
                                        <Text style={styles.removeButtonText}>×</Text>
                                    </TouchableOpacity>
                                </Animated.View>
                            ))}
                        </ScrollView>
                    </View>

                    <View style={styles.column}>
                        <Text style={styles.columnTitle}>Available Skills</Text>
                        <ScrollView style={styles.skillsContainer}>
                            <View style={styles.skillsGrid}>
                                {skills.map((skill) => (
                                    <TouchableOpacity
                                        key={skill.id}
                                        style={[
                                            styles.skillCard,
                                            skill.selected && styles.selectedSkill
                                        ]}
                                        onPress={() => toggleSkill(skill.id)}
                                    >
                                        <Image
                                            source={{ uri: skill.imageUrl }}
                                            style={styles.skillImage}
                                        />
                                        <Text style={styles.skillName}>{skill.name}</Text>
                                        <View style={styles.skillStats}>
                                            {skill.damage > 0 && (
                                                <View style={styles.statContainer}>
                                                    <Text style={styles.statLabel}>DMG</Text>
                                                    <Text style={styles.statValue}>{skill.damage}</Text>
                                                </View>
                                            )}
                                            {skill.cooldown > 0 && (
                                                <View style={styles.statContainer}>
                                                    <Text style={styles.statLabel}>CD</Text>
                                                    <Text style={styles.statValue}>{skill.cooldown}s</Text>
                                                </View>
                                            )}
                                        </View>
                                        <Text style={styles.skillDescription}>{skill.description}</Text>
                                    </TouchableOpacity>
                                ))}
                            </View>
                        </ScrollView>
                    </View>
                </View>

                {/* Continue Button */}
                <TouchableOpacity
                    style={[
                        styles.continueButton,
                        selectedCount !== MAX_SELECTED_SKILLS && styles.disabledButton
                    ]}
                    onPress={handleConfirm}
                    disabled={selectedCount !== MAX_SELECTED_SKILLS}
                >
                    <Text style={styles.continueButtonText}>
                        {selectedCount === MAX_SELECTED_SKILLS ? 'Continue to Battle' : `Select ${MAX_SELECTED_SKILLS - selectedCount} more skills`}
                    </Text>
                </TouchableOpacity>
            </Animated.View>
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
        backgroundColor: 'rgba(0, 0, 0, 0.7)',
        padding: 8,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 8,
    },
    titleContainer: {
        flex: 1,
    },
    title: {
        color: '#FFFFFF',
        fontSize: 20,
        fontWeight: 'bold',
        textAlign: 'left',
        textShadowColor: '#20B2AA',
        textShadowOffset: { width: 1, height: 1 },
        textShadowRadius: 6,
        fontFamily: 'Jersey10',
    },
    subtitle: {
        color: '#FFFFFF',
        fontSize: 12,
        textAlign: 'left',
        opacity: 0.8,
        fontFamily: 'Jersey10',
    },
    backButton: {
        backgroundColor: 'rgba(107, 35, 142, 0.7)',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 8,
        borderWidth: 1,
        borderColor: '#20B2AA',
    },
    backButtonText: {
        color: '#FFFFFF',
        fontSize: 14,
        fontWeight: 'bold',
        fontFamily: 'Jersey10',
    },
    mainContent: {
        flex: 1,
        flexDirection: 'row',
        gap: 8,
    },
    column: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        borderRadius: 8,
        padding: 6,
    },
    columnTitle: {
        color: '#FFFFFF',
        fontSize: 14,
        fontWeight: 'bold',
        textAlign: 'center',
        marginBottom: 6,
        textShadowColor: '#20B2AA',
        textShadowOffset: { width: 1, height: 1 },
        textShadowRadius: 4,
        fontFamily: 'Jersey10',
    },
    selectedSkillsContainer: {
        flex: 1,
    },
    selectedSkillCard: {
        flexDirection: 'row',
        backgroundColor: 'rgba(32, 178, 170, 0.7)',
        borderRadius: 8,
        padding: 8,
        marginBottom: 8,
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#6B238E',
        shadowColor: '#20B2AA',
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.3,
        shadowRadius: 4,
        elevation: 4
    },
    smallSkillImage: {
        width: 40,
        height: 40,
        borderRadius: 20,
        marginRight: 8,
        borderWidth: 2,
        borderColor: '#6B238E'
    },
    skillInfo: {
        flex: 1,
        marginRight: 8
    },
    skillsContainer: {
        flex: 1,
    },
    skillsGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'space-between',
        gap: 6,
    },
    skillCard: {
        width: '48%',
        backgroundColor: 'rgba(107, 35, 142, 0.7)',
        borderRadius: 8,
        padding: 8,
        marginBottom: 8,
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#20B2AA',
        shadowColor: '#20B2AA',
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.3,
        shadowRadius: 4,
        elevation: 4
    },
    selectedSkill: {
        backgroundColor: 'rgba(32, 178, 170, 0.7)',
        borderColor: '#6B238E',
        transform: [{ scale: 1.02 }]
    },
    skillImage: {
        width: 48,
        height: 48,
        borderRadius: 24,
        marginBottom: 6,
        borderWidth: 2,
        borderColor: '#20B2AA'
    },
    skillName: {
        color: '#FFFFFF',
        fontSize: 12,
        fontWeight: 'bold',
        textAlign: 'center',
        marginBottom: 4,
        textShadowColor: '#20B2AA',
        textShadowOffset: { width: 1, height: 1 },
        textShadowRadius: 2,
        fontFamily: 'Jersey10',
    },
    skillStats: {
        flexDirection: 'row',
        gap: 4,
        marginVertical: 4
    },
    statContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(0, 0, 0, 0.3)',
        paddingHorizontal: 6,
        paddingVertical: 2,
        borderRadius: 4,
        borderWidth: 1,
        borderColor: '#6B238E'
    },
    statLabel: {
        color: '#20B2AA',
        fontSize: 10,
        fontWeight: 'bold',
        marginRight: 2,
        fontFamily: 'Jersey10',
    },
    statValue: {
        color: '#FFFFFF',
        fontSize: 10,
        fontWeight: 'bold',
        fontFamily: 'Jersey10',
    },
    skillDescription: {
        color: '#FFFFFF',
        fontSize: 9,
        textAlign: 'center',
        opacity: 0.8,
        marginTop: 4,
        fontFamily: 'Jersey10',
    },
    removeButton: {
        width: 24,
        height: 24,
        borderRadius: 12,
        backgroundColor: 'rgba(255, 0, 0, 0.7)',
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 1,
        borderColor: '#FFFFFF'
    },
    removeButtonText: {
        color: '#FFFFFF',
        fontSize: 16,
        fontWeight: 'bold',
        textAlign: 'center',
        lineHeight: 20,
        fontFamily: 'Jersey10',
    },
    continueButton: {
        backgroundColor: '#4CAF50',
        padding: 15,
        borderRadius: 10,
        alignItems: 'center',
        marginTop: 20,
        marginBottom: 20,
    },
    disabledButton: {
        backgroundColor: '#cccccc',
    },
    continueButtonText: {
        color: 'white',
        fontSize: 18,
        fontWeight: 'bold',
        fontFamily: 'Jersey10',
    },
});

export default SkillsSelection

