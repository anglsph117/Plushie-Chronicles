import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ImageBackground, Modal, StatusBar, Platform, Animated, Image, ImageSourcePropType } from 'react-native';
import { Video, ResizeMode } from 'expo-av';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { FontAwesome } from '@expo/vector-icons';

interface Skill {
  name: string;
  damage: number;
  manaCost: number;
  description: string;
  cooldown: number;
  imageUrl: string;
  currentCooldown?: number;
}

interface Enemy {
  name: string;
  health: number;
  maxHealth: number;
  damage: number;
  imageUrl: string;
}

const BattleSystem = () => {
  const router = useRouter();
  const { playerName, selectedSkills, playerImageUrl, difficulty, enemyHealth } = useLocalSearchParams<{ 
    playerName: string;
    selectedSkills: string;
    playerImageUrl: string;
    difficulty: string;
    enemyHealth: string;
  }>();
  const [playerHealth, setPlayerHealth] = useState(100);
  const [playerMana, setPlayerMana] = useState(100);
  const [enemy, setEnemy] = useState<Enemy>({
    name: 'Samurai',
    health: parseInt(enemyHealth) || 100,
    maxHealth: parseInt(enemyHealth) || 100,
    damage: 25 ,
    imageUrl: 'https://owqaiuqmvihvwomtiimr.supabase.co/storage/v1/object/public/plushiechronicles/Characters/samurai%20idle.gif'
  });
  const [isPlayerTurn, setIsPlayerTurn] = useState(true);
  const [combatLog, setCombatLog] = useState<string[]>([]);
  const [timer, setTimer] = useState(30);
  const [isPaused, setIsPaused] = useState(false);
  const [showGameOver, setShowGameOver] = useState(false);
  const [showVictory, setShowVictory] = useState(false);
  const [isResting, setIsResting] = useState(false);
  const [isDodging, setIsDodging] = useState(false);
  const [skills, setSkills] = useState<Skill[]>([]);
  const [skillCooldowns, setSkillCooldowns] = useState<{ [key: string]: number }>({});
  const playerHealthAnim = useRef(new Animated.Value(100)).current;
  const playerManaAnim = useRef(new Animated.Value(100)).current;
  const enemyHealthAnim = useRef(new Animated.Value(100)).current;
  const [backgroundMap, setBackgroundMap] = useState<ImageSourcePropType | null>(null);
  const [showTurnNotification, setShowTurnNotification] = useState(false);
  const [turnNotificationText, setTurnNotificationText] = useState('');
  const turnNotificationAnim = useRef(new Animated.Value(0)).current;
  const [showExitConfirmation, setShowExitConfirmation] = useState(false);
  const [hasDealtDamage, setHasDealtDamage] = useState(false);
  const [isEnemyAttacking, setIsEnemyAttacking] = useState(false);
  const enemyAttackAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (selectedSkills) {
      try {
        const parsedSkills = JSON.parse(selectedSkills);
        setSkills(parsedSkills.map((skill: any) => ({
          name: skill.name,
          damage: skill.damage,
          manaCost: Math.floor(skill.damage * 0.5),
          description: skill.description,
          cooldown: skill.cooldown,
          imageUrl: skill.imageUrl || 'https://owqaiuqmvihvwomtiimr.supabase.co/storage/v1/object/public/plushiechronicles/default-skill.png'
        })));
      } catch (error) {
        console.error('Error parsing skills:', error);
      }
    }
  }, [selectedSkills]);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (!isPaused && timer > 0) {
      interval = setInterval(() => {
        setTimer(prev => prev - 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [timer, isPaused]);

  useEffect(() => {
    const maps: ImageSourcePropType[] = [
      require('../../assets/map1.jpg'),
      require('../../assets/map2.jpg'),
    ];
    const randomMap = maps[Math.floor(Math.random() * maps.length)];
    setBackgroundMap(randomMap);
  }, []);

  // Initialize enemy health bar to max
  useEffect(() => {
    enemyHealthAnim.setValue(enemy.maxHealth);
  }, []);

  // Update health animations with smoother transitions
  const animateHealthChange = (currentHealth: number, targetHealth: number, animValue: Animated.Value) => {
    Animated.spring(animValue, {
      toValue: targetHealth,
      useNativeDriver: false,
      friction: 8,
      tension: 40,
    }).start();
  };

  // Add mana animation
  const animateManaChange = (currentMana: number, targetMana: number) => {
    Animated.spring(playerManaAnim, {
      toValue: targetMana,
      useNativeDriver: false,
      friction: 8,
      tension: 40,
    }).start();
  };

  // Add this function to handle cooldown updates
  const updateCooldowns = () => {
    setSkillCooldowns(prev => {
      const newCooldowns = { ...prev };
      Object.keys(newCooldowns).forEach(skillName => {
        if (newCooldowns[skillName] > 0) {
          newCooldowns[skillName]--;
        }
      });
      return newCooldowns;
    });
  };

  // Add cooldown timer effect
  useEffect(() => {
    const cooldownInterval = setInterval(updateCooldowns, 1000);
    return () => clearInterval(cooldownInterval);
  }, []);

  // Reset flag at the start of each turn
  useEffect(() => {
    setHasDealtDamage(false);
  }, [isPlayerTurn]);

  // Update handleSkillUse to remove turn notifications
  const handleSkillUse = (skill: Skill) => {
    if (!isPlayerTurn || playerMana < skill.manaCost || skillCooldowns[skill.name] > 0 || hasDealtDamage) return;
    setHasDealtDamage(true);
    const newMana = playerMana - skill.manaCost;
    setPlayerMana(newMana);
    animateManaChange(playerMana, newMana);
    setSkillCooldowns(prev => ({ ...prev, [skill.name]: skill.cooldown }));
    const newEnemyHealth = Math.max(0, enemy.health - skill.damage);
    setEnemy(prev => ({ ...prev, health: newEnemyHealth }));
    animateHealthChange(enemy.health, newEnemyHealth, enemyHealthAnim);
    setCombatLog(prev => [...prev, `You used ${skill.name} and dealt ${skill.damage} damage!`]);

    if (newEnemyHealth <= 0) {
      setCombatLog(prev => [...prev, 'Enemy defeated!']);
      setIsPlayerTurn(true);
      setTimer(30);
      setIsResting(false);
      setIsDodging(false);
      if (Platform.OS === 'ios') {
        requestAnimationFrame(() => {
          setShowVictory(true);
        });
      } else {
        setShowVictory(true);
      }
      return;
    }

    setIsPlayerTurn(false);
    handleEnemyAttack(() => {
      if (isDodging) {
        setCombatLog(prev => [...prev, 'You successfully dodged the enemy attack!']);
        setIsPlayerTurn(true);
        setTimer(30);
        setIsDodging(false);
        return;
      }
      if (!hasDealtDamage) {
        setHasDealtDamage(true);
        const damage = isResting ? enemy.damage * 2 : enemy.damage;
        setPlayerHealth(prev => {
          animateHealthChange(prev, Math.max(0, prev - damage), playerHealthAnim);
          return Math.max(0, prev - damage);
        });
        setCombatLog(prev => [...prev, `Enemy attacked and dealt ${damage} damage!`]);
      }
      setIsPlayerTurn(true);
      setTimer(30);
      setIsResting(false);
    });
  };

  // Update handleRest to remove turn notifications
  const handleRest = () => {
    if (!isPlayerTurn || hasDealtDamage) return;
    setHasDealtDamage(true); 
    setIsResting(true);
    const newMana = Math.min(100, playerMana + 50);
    setPlayerMana(newMana);
    animateManaChange(playerMana, newMana);
    setCombatLog(prev => [...prev, 'You take a rest and recover 50 mana!']);
    setIsPlayerTurn(false);
    handleEnemyAttack(() => {
      if (!hasDealtDamage) {
        setHasDealtDamage(true);
        const damage = enemy.damage * 2;
        setPlayerHealth(prev => {
          animateHealthChange(prev, Math.max(0, prev - damage), playerHealthAnim);
          return Math.max(0, prev - damage);
        });
        setCombatLog(prev => [...prev, `Enemy attacked and dealt ${damage} damage!`]);
      }
      setIsPlayerTurn(true);
      setTimer(30);
      setIsResting(false);
    });
  };

  // Update handleDodge to remove turn notifications
  const handleDodge = () => {
    if (!isPlayerTurn || hasDealtDamage) return;
    setHasDealtDamage(true);
    setIsDodging(true);
    setCombatLog(prev => [...prev, 'You prepare to dodge the next attack!']);
    setIsPlayerTurn(false);
    handleEnemyAttack(() => {
      setCombatLog(prev => [...prev, 'You successfully dodged the enemy attack!']);
      setIsPlayerTurn(true);
      setTimer(30);
      setIsDodging(false);
    });
  };

  // Update handleHeal to remove turn notifications
  const handleHeal = () => {
    if (!isPlayerTurn || hasDealtDamage) return;
    setHasDealtDamage(true);
    const healAmount = 20;
    const newHealth = Math.min(100, playerHealth + healAmount);
    setPlayerHealth(newHealth);
    animateHealthChange(playerHealth, newHealth, playerHealthAnim);
    setCombatLog(prev => [...prev, `You heal yourself for ${healAmount} HP!`]);
    setIsPlayerTurn(false);
    handleEnemyAttack(() => {
      if (!hasDealtDamage) {
        setHasDealtDamage(true);
        const damage = enemy.damage;
        setPlayerHealth(prev => {
          animateHealthChange(prev, Math.max(0, prev - damage), playerHealthAnim);
          return Math.max(0, prev - damage);
        });
        setCombatLog(prev => [...prev, `Enemy attacked and dealt ${damage} damage!`]);
      }
      setIsPlayerTurn(true);
      setTimer(30);
    });
  };

  const togglePause = () => {
    setIsPaused(prev => !prev);
  };

  const handleGameOver = () => {
    setShowGameOver(true);
  };

  const handleRetry = () => {
    setPlayerHealth(100);
    setPlayerMana(100);
    setEnemy({
      name: 'Samurai',
      health: parseInt(enemyHealth) || 100,
      maxHealth: parseInt(enemyHealth) || 100,
      damage: 35,
      imageUrl: 'https://owqaiuqmvihvwomtiimr.supabase.co/storage/v1/object/public/plushiechronicles/Characters/samurai%20idle.gif'
    });
    setCombatLog([]);
    setShowGameOver(false);
    setIsPlayerTurn(true);
    setTimer(30);
  };

  const handleNextLevel = () => {
    // Reset all states before transitioning
    const resetStates = () => {
      setPlayerHealth(100);
      setPlayerMana(100);
      setEnemy({
        name: 'Samurai',
        health: parseInt(enemyHealth) || 100,
        maxHealth: parseInt(enemyHealth) || 100,
        damage: 35,
        imageUrl: 'https://owqaiuqmvihvwomtiimr.supabase.co/storage/v1/object/public/plushiechronicles/Characters/samurai%20idle.gif'
      });
      setCombatLog([]);
      setShowVictory(false);
      setIsPlayerTurn(true);
      setTimer(30);
      setIsResting(false);
      setIsDodging(false);
    };

    if (Platform.OS === 'ios') {
      // On iOS, ensure state cleanup is complete before navigation
      setShowVictory(false); // Hide modal first
      setTimeout(() => {
        resetStates();
        router.push('/(home)/NextLevel');
      }, 100); // Small delay to ensure modal is hidden
    } else {
      resetStates();
      router.push('/(home)/NextLevel');
    }
  };

  const handleReturnToMenu = () => {
    router.push('/');
  };

  // Add this function to handle exit
  const handleExit = () => {
    setShowExitConfirmation(true);
  };

  const handleConfirmExit = () => {
    router.push('/');
  };

  const handleCancelExit = () => {
    setShowExitConfirmation(false);
  };

  useEffect(() => {
    if (playerHealth <= 0) {
      handleGameOver();
    }
  }, [playerHealth]);

  // Helper to handle enemy attack animation and logic
  const handleEnemyAttack = (attackCallback: () => void) => {
    enemyAttackAnim.setValue(0); // Start from left
    setIsEnemyAttacking(true);
    Animated.timing(enemyAttackAnim, {
      toValue: 1, // Move to right
      duration: 2000, // Match the GIF duration
      useNativeDriver: true,
    }).start(() => {
      setIsEnemyAttacking(false);
      attackCallback();
    });
  };

  if (!backgroundMap) {
    return (
      <View style={styles.container}>
        <Text style={styles.loadingText}>Loading...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar
        backgroundColor="transparent"
        translucent={true}
      />
      <ImageBackground
        source={backgroundMap}
        style={styles.backgroundImage}
        resizeMode="cover"
      >
        <View style={[styles.overlay, isPaused && styles.pausedOverlay]}>
          {/* Timer Container */}
          <View style={styles.statusContainer}>
            <View style={styles.timerContainer}>
              <Text style={[styles.timerText, { fontFamily: 'PixelifySans' }]}>Time: {timer}s</Text>
            </View>
          </View>

          {/* Enemy Health Bar - Top Center */}
          <View style={styles.enemyHealthContainer}>
            <Text style={[styles.barLabel, { width: 'auto', marginBottom: 4, fontFamily: 'PixelifySans' }]}>ENEMY</Text>
            <View style={styles.barContainer}>
              <Text style={[styles.barLabel, { fontFamily: 'PixelifySans' }]}>HP</Text>
              <View style={styles.barWrapper}>
                <View style={styles.barBackground}>
                  <Animated.View 
                    style={[
                      styles.enemyHealthBar, 
                      { 
                        width: enemyHealthAnim.interpolate({
                          inputRange: [0, enemy.maxHealth],
                          outputRange: ['0%', '100%']
                        })
                      }
                    ]} 
                  />
                </View>
                <Text style={[styles.hpText, { fontFamily: 'PixelifySans' }]}>
                  {enemy.health}/{enemy.maxHealth}
                </Text>
              </View>
            </View>
          </View>

          {/* VS Text and Names Container */}
          <View style={styles.vsContainer}>
            <Text style={[styles.vsText, { fontFamily: 'PixelifySans' }]}>V.S</Text>
            <View style={styles.namesContainer}>
              <Text style={[styles.nameText, { fontFamily: 'PixelifySans' }]}>{playerName}</Text>
              <Text style={[styles.nameText, { fontFamily: 'PixelifySans' }]}>{enemy.name}</Text>
            </View>
          </View>

          {/* Battle Arena Layout */}
          <View style={styles.battleArena}>
            {/* Player Side */}
            <View style={styles.playerSide}>
              <Image 
                source={{ uri: playerImageUrl }}
                style={styles.playerCharacterImage}
                resizeMode="contain"
              />
            </View>

            {/* Enemy Side */}
            <View style={styles.enemySide}>
              <Animated.Image
                source={{ uri: isEnemyAttacking
                  ? 'https://owqaiuqmvihvwomtiimr.supabase.co/storage/v1/object/public/plushiechronicles/animations/samurai%20attack.gif'
                  : enemy.imageUrl }}
                style={[
                  styles.characterImage,
                  isEnemyAttacking && {
                    position: 'absolute',
                    transform: [{
                      translateX: enemyAttackAnim.interpolate({
                        inputRange: [0, 1],
                        outputRange: [0, 60]
                      })
                    }]
                  }
                ]}
                resizeMode="contain"
              />
            </View>
          </View>

          {/* Player Health/Mana Bars - Bottom Center */}
          <View style={styles.playerStatusContainer}>
            <View style={styles.barContainer}>
              <Text style={[styles.barLabel, { fontFamily: 'PixelifySans' }]}>HP</Text>
              <View style={styles.barWrapper}>
                <View style={styles.barBackground}>
                  <Animated.View 
                    style={[
                      styles.healthBar, 
                      { 
                        width: playerHealthAnim.interpolate({
                          inputRange: [0, 100],
                          outputRange: [0, 100]
                        }).interpolate({
                          inputRange: [0, 100],
                          outputRange: ['0%', '100%']
                        })
                      }
                    ]} 
                  />
                </View>
                <Text style={[styles.hpText, { fontFamily: 'PixelifySans' }]}>
                  {playerHealth}/100
                </Text>
              </View>
            </View>
            <View style={styles.barContainer}>
              <Text style={[styles.barLabel, { fontFamily: 'PixelifySans' }]}>MP</Text>
              <View style={styles.barWrapper}>
                <View style={styles.barBackground}>
                  <Animated.View 
                    style={[
                      styles.manaBar, 
                      { 
                        width: playerManaAnim.interpolate({
                          inputRange: [0, 100],
                          outputRange: [0, 100]
                        }).interpolate({
                          inputRange: [0, 100],
                          outputRange: ['0%', '100%']
                        })
                      }
                    ]} 
                  />
                </View>
              </View>
            </View>
          </View>
        </View>
      </ImageBackground>

      {/* Rest Button - Left Side */}
      <TouchableOpacity
        style={[
          styles.restButtonContainer,
          !isPlayerTurn && styles.disabledButton
        ]}
        onPress={handleRest}
        disabled={!isPlayerTurn}
      >
        <View style={[styles.skillIconContainer, { width: 65, height: 65, borderRadius: 32.5 }]}>
          <Image 
            source={{ uri: 'https://owqaiuqmvihvwomtiimr.supabase.co/storage/v1/object/public/plushiechronicles/skills/zzz-removebg-preview.png' }}
            style={{ width: 45, height: 45 }}
            resizeMode="contain"
          />
        </View>
        <Text style={[styles.skillName, { fontFamily: 'PixelifySans' }]}>REST</Text>
      </TouchableOpacity>

      {/* Skills Container - Right Side */}
      <View style={styles.skillsContainer}>
        {skills.map((skill, index) => {
          const isOnCooldown = skillCooldowns[skill.name] > 0;
          const canUse = isPlayerTurn && playerMana >= skill.manaCost && !isOnCooldown;

          return (
            <TouchableOpacity
              key={index}
              style={[
                styles.skillButton,
                index === 2 ? styles.largeSkillButton :
                index === 1 ? styles.mediumSkillButton :
                styles.smallSkillButton,
                !canUse && styles.disabledButton
              ]}
              onPress={() => handleSkillUse(skill)}
              disabled={!canUse}
            >
              <View style={[
                styles.skillIconContainer,
                index === 2 ? styles.largeSkillIconContainer :
                index === 1 ? styles.mediumSkillIconContainer :
                styles.smallSkillIconContainer,
                isOnCooldown && styles.cooldownOverlay
              ]}>
                <Image 
                  source={{ uri: skill.imageUrl }}
                  style={[
                    index === 2 ? styles.largeSkillIcon :
                    index === 1 ? styles.mediumSkillIcon :
                    styles.smallSkillIcon,
                    isOnCooldown && styles.cooldownImage
                  ]}
                  resizeMode="contain"
                />
                {isOnCooldown && (
                  <View style={styles.cooldownTextContainer}>
                    <Text style={[styles.cooldownText, { fontFamily: 'PixelifySans' }]}>{skillCooldowns[skill.name]}</Text>
                  </View>
                )}
              </View>
              <Text style={[styles.skillName, { fontFamily: 'PixelifySans' }]}>{skill.name}</Text>
              <Text style={[styles.manaCostText, { fontFamily: 'PixelifySans' }]}>{skill.manaCost} MP</Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {/* Pause Button */}
      <TouchableOpacity style={styles.pauseButton} onPress={togglePause}>
        <FontAwesome name={isPaused ? "play" : "pause"} size={24} color="white" />
      </TouchableOpacity>

      {/* Pause Screen */}
      {isPaused && (
        <View style={[
          styles.pauseScreenContainer,
          Platform.OS === 'ios' && styles.iosPauseScreenContainer
        ]}>
          <View style={[
            styles.pauseScreenContent,
            Platform.OS === 'ios' && styles.iosPauseScreenContent
          ]}>
            <Text style={[
              styles.pauseScreenTitle,
              Platform.OS === 'ios' && styles.iosPauseScreenTitle,
              { fontFamily: 'PixelifySans' }
            ]}>Game Paused</Text>
            <TouchableOpacity 
              style={[
                styles.resumeButton,
                Platform.OS === 'ios' && styles.iosResumeButton
              ]} 
              onPress={togglePause}
            >
              <Text style={[
                styles.resumeButtonText,
                Platform.OS === 'ios' && styles.iosResumeButtonText,
                { fontFamily: 'PixelifySans' }
              ]}>Resume</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      {/* Game Over Modal */}
      <Modal
        visible={showGameOver}
        transparent={true}
        animationType="fade"
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <Text style={[styles.modalTitle, { fontFamily: 'PixelifySans' }]}>Game Over</Text>
            <Text style={[styles.modalText, { fontFamily: 'PixelifySans' }]}>You have been defeated!</Text>
            <View style={styles.modalButtons}>
              <TouchableOpacity style={styles.modalButton} onPress={handleRetry}>
                <Text style={[styles.modalButtonText, { fontFamily: 'PixelifySans' }]}>Retry</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.modalButton} onPress={handleReturnToMenu}>
                <Text style={[styles.modalButtonText, { fontFamily: 'PixelifySans' }]}>Return to Menu</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Victory Modal */}
      <Modal
        visible={showVictory}
        transparent={true}
        animationType="fade"
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <Text style={[styles.modalTitle, { fontFamily: 'PixelifySans' }]}>Victory!</Text>
            <Text style={[styles.modalText, { fontFamily: 'PixelifySans' }]}>You have defeated the enemy!</Text>
            <View style={styles.modalButtons}>
              <TouchableOpacity style={styles.modalButton} onPress={handleNextLevel}>
                <Text style={[styles.modalButtonText, { fontFamily: 'PixelifySans' }]}>Next Level</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.modalButton} onPress={handleReturnToMenu}>
                <Text style={[styles.modalButtonText, { fontFamily: 'PixelifySans' }]}>Return to Menu</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Exit Confirmation Modal */}
      <Modal
        visible={showExitConfirmation}
        transparent={true}
        animationType="fade"
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <Text style={[styles.modalTitle, { fontFamily: 'PixelifySans' }]}>Exit Battle</Text>
            <Text style={[styles.modalText, { fontFamily: 'PixelifySans' }]}>Are you sure you want to exit?</Text>
            <Text style={[styles.modalSubText, { fontFamily: 'PixelifySans' }]}>Your progress will be lost.</Text>
            <View style={styles.modalButtons}>
              <TouchableOpacity 
                style={[styles.modalButton, styles.cancelButton]} 
                onPress={handleCancelExit}
              >
                <Text style={[styles.modalButtonText, { fontFamily: 'PixelifySans' }]}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={[styles.modalButton, styles.exitButton]} 
                onPress={handleConfirmExit}
              >
                <Text style={[styles.modalButtonText, { fontFamily: 'PixelifySans' }]}>Exit</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  backgroundImage: {
    flex: 1,
    width: '100%',
    height: '100%',
  },
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    padding: 16,
  },
  battleArena: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    marginTop: 60,
    marginBottom: 60,
    position: 'relative',
  },
  playerSide: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    height: 200,
    marginRight: 40,
    marginTop: 80,
  },
  enemySide: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    height: 200,
    marginLeft: 40,
    marginTop: 80,
  },
  characterImage: {
    width: 120,
    height: 120,
    marginBottom: 8,
  },
  playerCharacterImage: {
    width: 240,
    height: 240,
    marginBottom: 8,
  },
  vsContainer: {
    position: 'absolute',
    left: '50%',
    top: 40,
    transform: [{ translateX: -20 }],
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1,
  },
  vsText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: 'bold',
    textShadowColor: '#000',
    textShadowOffset: { width: 2, height: 2 },
    textShadowRadius: 3,
    letterSpacing: 1,
  },
  namesContainer: {
    position: 'absolute',
    top: 3,
    left: -100,
    right: -100,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  nameText: {
    color: '#FFB23F',
    fontSize: 14,
    fontWeight: 'bold',
    textAlign: 'center',
    textShadowColor: '#000',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
    width: 100,
  },
  statusBars: {
    width: '100%',
    maxWidth: 200,
    marginTop: 8,
    alignItems: 'flex-start',
    paddingHorizontal: 10,
  },
  barContainer: {
    marginBottom: 6,
    width: 300,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  barWrapper: {
    flex: 1,
  },
  barBackground: {
    height: 8,
    backgroundColor: 'rgba(0,0,0,0.5)',
    borderRadius: 4,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#ffffff40',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 2,
  },
  barLabel: {
    color: 'white',
    fontSize: 12,
    textShadowColor: '#000',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
    width: 45,
  },
  healthBar: {
    height: '100%',
    backgroundColor: '#22c55e',
    borderRadius: 4,
    shadowColor: '#22c55e',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.5,
    shadowRadius: 4,
  },
  manaBar: {
    height: '100%',
    backgroundColor: '#3b82f6',
    borderRadius: 4,
    shadowColor: '#3b82f6',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.5,
    shadowRadius: 4,
  },
  enemyContainer: {
    alignItems: 'flex-end',
    marginTop: 8,
    width: '100%',
    maxWidth: 200,
    paddingHorizontal: 10,
  },
  playerNameContainer: {
    alignItems: 'flex-start',
    marginBottom: 4,
  },
  playerName: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 4,
    textShadowColor: '#000000',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
  },
  enemyName: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 4,
    textShadowColor: '#000000',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
  },
  enemyHealthBar: {
    height: '100%',
    backgroundColor: '#dc2626',
    borderRadius: 4,
    shadowColor: '#dc2626',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.5,
    shadowRadius: 4,
  },
  skillsContainer: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'flex-end',
    gap: 8,
    position: 'absolute',
    bottom: 20,
    right: 20,
    paddingHorizontal: 8,
  },
  restButtonContainer: {
    position: 'absolute',
    bottom: 20,
    left: 20,
    alignItems: 'center',
    justifyContent: 'center',
    width: 42,
    height: 54,
  },
  skillButton: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  smallSkillButton: {
    width: 34,
    height: 46,
  },
  smallSkillIconContainer: {
    width: 30,
    height: 30,
    borderRadius: 15,
  },
  smallSkillIcon: {
    width: 20,
    height: 20,
  },
  mediumSkillButton: {
    width: 42,
    height: 54,
  },
  mediumSkillIconContainer: {
    width: 38,
    height: 38,
    borderRadius: 19,
  },
  mediumSkillIcon: {
    width: 28,
    height: 28,
  },
  largeSkillButton: {
    width: 50,
    height: 62,
  },
  largeSkillIconContainer: {
    width: 46,
    height: 46,
    borderRadius: 23,
  },
  largeSkillIcon: {
    width: 36,
    height: 36,
  },
  skillIconContainer: {
    backgroundColor: '#2d2d2d',
    borderWidth: 1,
    borderColor: '#4a4a4a',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 1, height: 1 },
    shadowOpacity: 0.8,
    shadowRadius: 1,
    elevation: 3,
  },
  skillName: {
    color: '#ffffff',
    fontSize: 8,
    fontWeight: 'bold',
    textAlign: 'center',
    marginTop: 2,
    textShadowColor: '#000',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 0,
  },
  disabledButton: {
    opacity: 0.5,
  },
  turnInfo: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginBottom: 16,
  },
  turnText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  pauseButton: {
    position: 'absolute',
    top: 16,
    right: 16,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0,0,0,0.7)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#4a4a4a',
    shadowColor: '#000',
    shadowOffset: { width: 2, height: 2 },
    shadowOpacity: 1,
    shadowRadius: 0,
    elevation: 4,
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
  },
  modalTitle: {
    color: 'white',
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 10,
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
    backgroundColor: '#2d2d2d',
    padding: 10,
    borderRadius: 8,
    width: '45%',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#4a4a4a',
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
  pausedOverlay: {
    opacity: 0.5,
  },
  iosPauseScreenContainer: {
    backgroundColor: 'rgba(0,0,0,0.95)',
  },
  pauseScreenContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.8)',
  },
  pauseScreenContent: {
    backgroundColor: 'rgba(0,0,0,0.9)',
    padding: 30,
    borderRadius: 20,
    alignItems: 'center',
    width: '80%',
  },
  iosPauseScreenContent: {
    backgroundColor: 'rgba(0,0,0,1)',
    padding: 40,
    borderRadius: 25,
    borderWidth: 2,
    borderColor: '#6B238E',
  },
  pauseScreenTitle: {
    color: 'white',
    fontSize: 32,
    fontWeight: 'bold',
    marginBottom: 30,
  },
  iosPauseScreenTitle: {
    fontSize: 40,
    color: '#6B238E',
    textShadowColor: 'rgba(0,0,0,0.75)',
    textShadowOffset: { width: 2, height: 2 },
    textShadowRadius: 4,
  },
  resumeButton: {
    backgroundColor: '#2d2d2d',
    paddingVertical: 15,
    paddingHorizontal: 40,
    borderRadius: 0,
    width: '100%',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#4a4a4a',
    borderStyle: 'solid',
    shadowColor: '#000',
    shadowOffset: { width: 2, height: 2 },
    shadowOpacity: 1,
    shadowRadius: 0,
    elevation: 4,
  },
  iosResumeButton: {
    backgroundColor: '#6B238E',
    paddingVertical: 20,
    paddingHorizontal: 50,
    borderRadius: 20,
    borderWidth: 2,
    borderColor: 'white',
  },
  resumeButtonText: {
    color: '#ffffff',
    fontSize: 24,
    fontWeight: 'bold',
    textShadowColor: '#000',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 0,
  },
  iosResumeButtonText: {
    fontSize: 28,
    textShadowColor: 'rgba(0,0,0,0.75)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
  },
  timerContainer: {
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    padding: 8,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: '#4a4a4a',
    borderStyle: 'solid',
    shadowColor: '#000',
    shadowOffset: { width: 2, height: 2 },
    shadowOpacity: 1,
    shadowRadius: 0,
    elevation: 4,
    minWidth: 120,
  },
  timerText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: 'bold',
    textAlign: 'center',
    textShadowColor: '#000',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 0,
  },
  statusContainer: {
    position: 'absolute',
    top: 16,
    left: 16,
    gap: 12,
  },
  turnContainer: {
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    padding: 8,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: '#4a4a4a',
    borderStyle: 'solid',
    shadowColor: '#000',
    shadowOffset: { width: 2, height: 2 },
    shadowOpacity: 1,
    shadowRadius: 0,
    elevation: 4,
    minWidth: 120,
  },
  statusText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: 'bold',
    textAlign: 'center',
    textShadowColor: '#000',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 0,
  },
  enemyHealthContainer: {
    position: 'absolute',
    top: 10,
    left: 0,
    right: 0,
    alignItems: 'center',
    paddingHorizontal: 20,
    zIndex: 10,
  },
  playerStatusContainer: {
    position: 'absolute',
    bottom: 10,
    left: 0,
    right: 0,
    alignItems: 'center',
    paddingHorizontal: 20,
    zIndex: 10,
  },
  enemyNameText: {
    position: 'absolute',
    top: -20,
    color: '#FFB23F',
    fontSize: 14,
    fontWeight: 'bold',
    textShadowColor: '#000',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
  },
  characterNameContainer: {
    position: 'absolute',
    bottom: 140,
    left: 0,
    right: 0,
    alignItems: 'center',
  },
  characterName: {
    color: '#FFB23F',
    fontSize: 14,
    fontWeight: 'bold',
    textShadowColor: '#000',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
  },
  loadingText: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  cooldownOverlay: {
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
  },
  cooldownImage: {
    opacity: 0.5,
  },
  cooldownTextContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cooldownText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
    textShadowColor: '#000',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
  },
  manaCostText: {
    color: '#3b82f6',
    fontSize: 8,
    fontWeight: 'bold',
    textAlign: 'center',
    marginTop: 2,
    textShadowColor: '#000',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 1,
  },
  turnNotificationContainer: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    transform: [{ translateX: -100 }, { translateY: -25 }],
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: '#20B2AA',
    shadowColor: '#20B2AA',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.5,
    shadowRadius: 10,
    elevation: 5,
    zIndex: 1000,
  },
  turnNotificationText: {
    color: '#FFFFFF',
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
    textShadowColor: '#20B2AA',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
  },
  exitButtonContainer: {
    position: 'absolute',
    top: 16,
    left: 16,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0,0,0,0.7)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#4a4a4a',
    shadowColor: '#000',
    shadowOffset: { width: 2, height: 2 },
    shadowOpacity: 1,
    shadowRadius: 0,
    elevation: 4,
    zIndex: 1000,
  },
  modalSubText: {
    color: '#ff6b6b',
    fontSize: 14,
    marginBottom: 20,
    textAlign: 'center',
    fontStyle: 'italic',
  },
  cancelButton: {
    backgroundColor: '#2d2d2d',
    borderColor: '#4a4a4a',
  },
  exitButton: {
    backgroundColor: '#dc2626',
    borderColor: '#991b1b',
  },
  hpText: {
    color: 'white',
    fontSize: 10,
    fontWeight: 'bold',
    textAlign: 'center',
    marginTop: 2,
    textShadowColor: '#000',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
  },
});

export default BattleSystem; 