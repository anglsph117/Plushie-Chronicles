import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ImageBackground, Modal, StatusBar, Platform, Animated, Image, ImageSourcePropType, ViewStyle, ImageStyle, TextStyle } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { FontAwesome } from '@expo/vector-icons';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Audio } from 'expo-av';
import { useMusic } from '../../context/MusicContext';

// Import your local animation GIFs here
// Make sure the paths are correct relative to this file
// --- Idle Animations ---
const whiteIdleGif = require('../../assets/animations/white idle.gif'); // ADJUST PATH
const purpIdleGif = require('../../assets/animations/purp idle.gif');       // ADJUST PATH
const pinkIdleGif = require('../../assets/animations/pink idle.gif');       // ADJUST PATH
const flyIdleGif = require('../../assets/animations/cyan idle.gif');         // ADJUST PATH
const blueIdleGif = require('../../assets/animations/blue idle.gif');       // ADJUST PATH

// --- Heavy Slash Animations ---
const whiteHeavySlashGif = require('../../assets/animations/White Heavy slash.gif');
const purpHeavySlashGif = require('../../assets/animations/purp Heavy slash.gif');
const pinkHeavySlashGif = require('../../assets/animations/Pink Heavy slash.gif');
const cyanHeavySlashGif = require('../../assets/animations/Cyan Heavy slash.gif');
const blueHeavySlashGif = require('../../assets/animations/Blue Heavy slash.gif');

// --- Elemental Sword Master Animations ---
const whiteElementalSlashGif = require('../../assets/animations/elem sword white.gif');
const purpElementalSlashGif = require('../../assets/animations/elem sword purp.gif');
const pinkElementalSlashGif = require('../../assets/animations/elem sword pink.gif');
const cyanElementalSlashGif = require('../../assets/animations/elem sword cyan.gif');
const blueElementalSlashGif = require('../../assets/animations/elem sword blue.gif');

// --- Death Animations ---
const whiteDeathGif = require('../../assets/animations/deathwhite.gif');
const purpDeathGif = require('../../assets/animations/deathpurp.gif');
const pinkDeathGif = require('../../assets/animations/deathpink.gif');
const cyanDeathGif = require('../../assets/animations/deathcyan.gif');
const blueDeathGif = require('../../assets/animations/deathblue.gif');

// --- Elemental Spell Animations ---
const boulderGif = require('../../assets/animations/boulder.gif');
const cryoCrystalsGif = require('../../assets/animations/cryo-crystals.gif');
const fireballGif = require('../../assets/animations/fireball.gif');
const waterShotGif = require('../../assets/animations/water-shot.gif');

// --- Enemy Attack Animations ---
const samuraiAttackGif = require('../../assets/animations/samurai attack.gif');
const sunrakuAttackGif = require('../../assets/animations/sunraku attack.gif');

interface Skill {
  name: string;
  damage: number;
  manaCost: number;
  description: string;
  cooldown: number;
  imageUrl: string;
  currentCooldown?: number;
  isPassive?: boolean;
  isOneTimeUse?: boolean;
  hasBeenUsed?: boolean;
  isElemental?: boolean;
}

interface Enemy {
  name: string;
  health: number;
  maxHealth: number;
  damage: number;
  imageUrl: string;
}

// Helper function to map initial URL to character type
const getCharacterTypeFromUrl = (url: string | string[] | null | undefined): string => {
    const urlString = Array.isArray(url) ? url[0] : url;
    if (!urlString) return 'white';
    const lowerUrl = urlString.toLowerCase();

    // More specific URL checks with exact matches
    if (lowerUrl.includes('cyan') || lowerUrl.includes('fly idle.gif')) return 'cyan';
    if (lowerUrl.includes('purp') && !lowerUrl.includes('white')) return 'purp';
    if (lowerUrl.includes('pink') && !lowerUrl.includes('white')) return 'pink';
    if (lowerUrl.includes('blue') && !lowerUrl.includes('white')) return 'blue';
    if (lowerUrl.includes('white') || lowerUrl.includes('malupittt')) return 'white';

    return 'white';
};

const BattleSystem = () => {
  const router = useRouter();
  const { playerName, selectedSkills, playerImageUrl, difficulty, enemyHealth, selectedMap } = useLocalSearchParams<{
    playerName: string;
    selectedSkills: string;
    playerImageUrl: string;
    difficulty: string;
    enemyHealth: string;
    selectedMap: string;
  }>();
  const [currentLevel, setCurrentLevel] = useState(1);
  const [playerHealth, setPlayerHealth] = useState(100);
  const [playerMana, setPlayerMana] = useState(100);
  const [maxMana, setMaxMana] = useState(100);
  const [enemy, setEnemy] = useState<Enemy>({
    name: 'Samurai',
    health: parseInt(enemyHealth) || 100,
    maxHealth: parseInt(enemyHealth) || 100,
    damage: 25,
    imageUrl: require('../../assets/animations/samurai idle.gif') // Use local asset for Samurai idle
  });
  const [isPlayerTurn, setIsPlayerTurn] = useState(true);
  const [combatLog, setCombatLog] = useState<string[]>([]);
  const MAX_COMBAT_LOG_MESSAGES = 5; // Maximum number of messages to show
  const [timer, setTimer] = useState(0); // Start from 0 instead of 30
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
  const playerShakeAnim = useRef(new Animated.Value(0)).current;
  const [showRainbowBlood, setShowRainbowBlood] = useState(false);
  const rainbowBloodAnim = useRef(new Animated.Value(0)).current;
  // Assuming background map might still be a URL, keep as is or change to require if local
  const [backgroundMap, setBackgroundMap] = useState<ImageSourcePropType | null>(null);
  const [showTurnNotification, setShowTurnNotification] = useState(false);
  const [turnNotificationText, setTurnNotificationText] = useState('');
  const turnNotificationAnim = useRef(new Animated.Value(0)).current;
  const [showExitConfirmation, setShowExitConfirmation] = useState(false);
  const [hasDealtDamage, setHasDealtDamage] = useState(false);
  const [isEnemyAttacking, setIsEnemyAttacking] = useState(false);
  const enemyAttackAnim = useRef(new Animated.Value(0)).current;
  const [passiveSkills, setPassiveSkills] = useState<{ [key: string]: boolean }>({});
  const [dodgeChance, setDodgeChance] = useState(0);
  const [rawDamageBonus, setRawDamageBonus] = useState(0);
  const [maxHealth, setMaxHealth] = useState(100);
  const [showSkillMessage, setShowSkillMessage] = useState(false);
  const [skillMessage, setSkillMessage] = useState('');
  const [activeBuffs, setActiveBuffs] = useState<string[]>([]);
  const soruAnim = useRef(new Animated.Value(0)).current;
  const [showSoru, setShowSoru] = useState(false);
  const [showDamageNumber, setShowDamageNumber] = useState(false);
  const [damageAmount, setDamageAmount] = useState(0);
  const damageNumberAnim = useRef(new Animated.Value(0)).current;
  const playerHealthBarAnim = useRef(new Animated.Value(100)).current;
  const enemyHealthBarAnim = useRef(new Animated.Value(100)).current;
  const [showDodgeMessage, setShowDodgeMessage] = useState(false);
  const dodgeMessageAnim = useRef(new Animated.Value(0)).current;
  const [showElementalSpell, setShowElementalSpell] = useState(false);
  const [currentSpellAnimation, setCurrentSpellAnimation] = useState<ImageSourcePropType | null>(null);
  const spellAnim = useRef(new Animated.Value(0)).current;
  const { bgmSound, pauseBgm, playBgm: resumeBgm, isMuted, toggleMute } = useMusic();
  const [isTurnProcessing, setIsTurnProcessing] = useState(false);

  // Store character type in state
  const [playerCharacterType, setPlayerCharacterType] = useState(getCharacterTypeFromUrl(playerImageUrl));

  // Debug: Log playerImageUrl and playerCharacterType
  useEffect(() => {
    console.log('[DEBUG] playerImageUrl:', playerImageUrl);
    console.log('[DEBUG] playerCharacterType:', playerCharacterType);
  }, [playerImageUrl, playerCharacterType]);

  // Update character type when playerImageUrl changes
  useEffect(() => {
    const newType = getCharacterTypeFromUrl(playerImageUrl);
    console.log('Character type updated:', newType, 'from URL:', playerImageUrl);
    setPlayerCharacterType(newType);
  }, [playerImageUrl]);

  // Calculate the initial image source based on character type
  const getInitialImageSource = () => {
    console.log('Getting initial image source for type:', playerCharacterType);
    switch (playerCharacterType) {
      case 'white': return whiteIdleGif;
      case 'purp': return purpIdleGif;
      case 'pink': return pinkIdleGif;
      case 'cyan': return flyIdleGif; // Map 'cyan' type to flyIdleGif
      case 'blue': return blueIdleGif;
      default: return whiteIdleGif;
    }
  };

  // Initialize player character image
  const [playerCharacterImage, setPlayerCharacterImage] = useState<ImageSourcePropType>(getInitialImageSource());

  // Update player character image when character type changes
  useEffect(() => {
    const newImage = getInitialImageSource();
    console.log('Updating player image to:', newImage);
    setPlayerCharacterImage(newImage);
  }, [playerCharacterType]);

  // Restore necessary state variables
  const [isEnemyShaking, setIsEnemyShaking] = useState(false);
  const enemyShakeAnim = useRef(new Animated.Value(0)).current;
  const [showEnemyRainbowBlood, setShowEnemyRainbowBlood] = useState(false);
  const enemyRainbowBloodAnim = useRef(new Animated.Value(0)).current;
  const [showEnemyDamageNumber, setShowEnemyDamageNumber] = useState(false);
  const [enemyDamageAmount, setEnemyDamageAmount] = useState(0);
  const enemyDamageNumberAnim = useRef(new Animated.Value(0)).current;
  const [isPlayerAttacking, setIsPlayerAttacking] = useState(false);
  const playerAttackAnim = useRef(new Animated.Value(0)).current;
  const [showReplenishAura, setShowReplenishAura] = useState(false);
  const replenishAuraAnim = useRef(new Animated.Value(0)).current;
  const particleAnim = useRef(new Animated.Value(0)).current;
  const [isPlayerDying, setIsPlayerDying] = useState(false);
  const playerScaleAnim = useRef(new Animated.Value(1)).current;

  // Health bar shake animations
  const playerHealthBarShakeAnim = useRef(new Animated.Value(0)).current;
  const enemyHealthBarShakeAnim = useRef(new Animated.Value(0)).current;

  // Dragon Ball Aura: layered flames, core glow, sparks, and player scale
  const [flameConfigsInner] = useState(
    Array.from({ length: 8 }, (_, i) => ({
      left: 40 + Math.random() * 60,
      width: 10 + Math.random() * 8,
      height: 30 + Math.random() * 18,
      delay: Math.random() * 120,
      rotate: `${-10 + Math.random() * 20}deg`,
      key: `inner-${i}`,
    }))
  );
  const [flameConfigsOuter] = useState(
    Array.from({ length: 12 }, (_, i) => ({
      left: 20 + Math.random() * 80,
      width: 18 + Math.random() * 10,
      height: 50 + Math.random() * 30,
      delay: Math.random() * 200,
      rotate: `${-20 + Math.random() * 40}deg`,
      key: `outer-${i}`,
    }))
  );
  const flameAnimsInner = useRef(flameConfigsInner.map(() => new Animated.Value(0))).current;
  const flameAnimsOuter = useRef(flameConfigsOuter.map(() => new Animated.Value(0))).current;
  const [sparkConfigs, setSparkConfigs] = useState<{ left: number; bottom: number; angle: number; length: number; key: string; }[]>([]);
  const sparkAnims = useRef<Animated.Value[]>([]);

  // Update all setCombatLog calls to use this new function
  const addCombatLogMessage = (message: string) => {
    setCombatLog(prev => {
      const newLog = [...prev, message];
      if (newLog.length > MAX_COMBAT_LOG_MESSAGES) {
        return newLog.slice(-MAX_COMBAT_LOG_MESSAGES);
      }
      return newLog;
    });
  };

  useEffect(() => {
    if (selectedSkills) {
      try {
        const parsedSkills = JSON.parse(selectedSkills);
        const processedSkills = parsedSkills.map((skill: any) => ({
          name: skill.name,
          damage: skill.damage,
          manaCost: Math.floor(skill.damage * 0.5),
          description: skill.description,
          cooldown: skill.cooldown,
          // If skill icons are also local, update here
          imageUrl: skill.imageUrl || require('../../assets/skills/default-skill.png'), // Adjust path if needed
          isPassive: skill.name === "More Health" || skill.name === "Swift",
          isOneTimeUse: skill.name === "Sword Blessing" || skill.name === "Replenish"
        }));

        setSkills(processedSkills);

        // Apply passive skills immediately
        processedSkills.forEach((skill: Skill) => {
          if (skill.isPassive) {
            switch (skill.name) {
              case "More Health":
                const newMaxHealth = 150;
                setMaxHealth(newMaxHealth);
                setPlayerHealth(newMaxHealth);
                playerHealthAnim.setValue(newMaxHealth);
                setPassiveSkills(prev => ({ ...prev, [skill.name]: true }));
                setActiveBuffs(prev => [...prev, "More Health"]);
                addCombatLogMessage(`Your maximum health has been increased to ${newMaxHealth}!`);
                break;

              case "Swift":
                setDodgeChance(prev => prev + 20);
                setPassiveSkills(prev => ({ ...prev, [skill.name]: true }));
                setActiveBuffs(prev => [...prev, "Swift"]);
                addCombatLogMessage(`Your dodge chance has been increased by 20%!`);
                break;
            }
          }
        });
      } catch (error) {
        console.error('Error parsing skills:', error);
      }
    }
  }, [selectedSkills]);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (!isPaused && !showVictory && !showGameOver) { // Only count up while battle is active
      interval = setInterval(() => {
        setTimer(prev => prev + 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [timer, isPaused, showVictory, showGameOver]);

  useEffect(() => {
    const maps: string[] = [
      'https://owqaiuqmvihvwomtiimr.supabase.co/storage/v1/object/public/plushiechronicles/maps/mapp.jpg', // Assuming map is still a URL
    ];
    const randomMap = maps[Math.floor(Math.random() * maps.length)];
    setBackgroundMap({ uri: randomMap });
  }, []);

  // Initialize enemy health bar to max
  useEffect(() => {
    enemyHealthBarAnim.setValue(enemy.maxHealth);
  }, [enemy.maxHealth]);

  // Update enemy health bar when health changes
  useEffect(() => {
    const newHealth = enemy.health;
    Animated.timing(enemyHealthBarAnim, {
      toValue: newHealth,
      duration: 300,
      useNativeDriver: false,
    }).start();
  }, [enemy.health]);

  // Initialize health bar to max at start
  useEffect(() => {
    playerHealthBarAnim.setValue(maxHealth);
  }, [maxHealth]);

  // Update health animations with smoother transitions
  const animateHealthChange = (currentHealth: number, targetHealth: number, animValue: Animated.Value) => {
    Animated.timing(animValue, {
      toValue: targetHealth,
      duration: 300,
      useNativeDriver: false,
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

  // Add this new function to handle skill messages
  const showSkillPopup = (message: string) => {
    setSkillMessage(message);
    setShowSkillMessage(true);
    setTimeout(() => {
      setShowSkillMessage(false);
    }, 2000); // Hide after 2 seconds
  };

  // Update handleSkillUse to properly handle mana costs
  const handleSkillUse = (skill: Skill) => {
    // Set isTurnProcessing to true immediately when a skill is clicked
    setIsTurnProcessing(true);

    // Then check other conditions
    if (!isPlayerTurn || hasDealtDamage || isPlayerDying) {
      setIsTurnProcessing(false);
      return;
    }

    // Prevent using passive skills
    if (skill.isPassive) {
      addCombatLogMessage(`${skill.name} is a passive skill and cannot be used in battle!`);
      setIsTurnProcessing(false); // End processing if passive skill
      return;
    }

    // Check if player has enough mana
    if (playerMana < skill.manaCost) {
      addCombatLogMessage(`Not enough mana! You need ${skill.manaCost} MP to use ${skill.name}.`);
      setIsTurnProcessing(false); // End processing if not enough mana
      return;
    }

    // Check if skill is on cooldown
    if (skillCooldowns[skill.name] > 0) {
      addCombatLogMessage(`${skill.name} is on cooldown for ${skillCooldowns[skill.name]} more turns!`);
      setIsTurnProcessing(false); // End processing if on cooldown
      return;
    }

    // Set hasDealtDamage to true at the start of any skill use
    setHasDealtDamage(true);

    // Handle elemental spells
    if (skill.name === "Boulder" || skill.name === "Cryo Crystals" || 
        skill.name === "Fireball" || skill.name === "Water Shot") {
      // Deduct mana cost
      const newMana = playerMana - skill.manaCost;
      setPlayerMana(newMana);
      animateManaChange(playerMana, newMana);
      setSkillCooldowns(prev => ({ ...prev, [skill.name]: skill.cooldown }));
      
      // Animate the spell
      animateElementalSpell(skill.name, skill);
      return; // Return here to prevent double execution
    }

    // Handle Heavy Slash animation for different heroes - Use character type
    else if (skill.name === "Heavy Slash") {
      // Deduct mana cost
      const newMana = playerMana - skill.manaCost;
      setPlayerMana(newMana);
      animateManaChange(playerMana, newMana);
      setSkillCooldowns(prev => ({ ...prev, [skill.name]: skill.cooldown }));

      setIsPlayerAttacking(true);
      playerAttackAnim.setValue(0);
      let heavySlashAnimationSource;

      // Determine animation source based on character type
      switch (playerCharacterType) {
          case 'white': heavySlashAnimationSource = whiteHeavySlashGif; break;
          case 'purp': heavySlashAnimationSource = purpHeavySlashGif; break;
          case 'pink': heavySlashAnimationSource = pinkHeavySlashGif; break;
          case 'cyan': heavySlashAnimationSource = cyanHeavySlashGif; break;
          case 'blue': heavySlashAnimationSource = blueHeavySlashGif; break;
          default: heavySlashAnimationSource = whiteHeavySlashGif;
      }

      setPlayerCharacterImage(heavySlashAnimationSource);

      // Move forward and stay in front of enemy
      Animated.sequence([
        // Move to enemy position
        Animated.timing(playerAttackAnim, {
          toValue: 1,
          duration: 500,
          useNativeDriver: true,
        }),
        // Stay in front of enemy
        Animated.delay(1500),
        // Return to original position
        Animated.timing(playerAttackAnim, {
          toValue: 0,
          duration: 500,
          useNativeDriver: true,
        })
      ]).start(() => {
        // Apply damage and effects
        const totalDamage = skill.damage + rawDamageBonus;
        const newEnemyHealth = Math.max(0, enemy.health - totalDamage);
        setEnemy(prev => ({ ...prev, health: newEnemyHealth }));
        console.log(`[handleSkillUse] Before animateHealthChange (Heavy Slash) - current enemy health: ${enemy.health}, new enemy health: ${newEnemyHealth}`); // Added log
        // Ensure animateHealthChange is called with the correct anim value
        animateHealthChange(enemy.health, newEnemyHealth, enemyHealthBarAnim);
        addCombatLogMessage(`You used ${skill.name} and dealt ${totalDamage} damage!`);
        // Add this line:
        shakeHealthBar(enemyHealthBarShakeAnim); // Shake enemy health bar

        // Show enemy effects
        shakeEnemy();
        showEnemyRainbowBloodEffect();
        showEnemyDamageIndicator(totalDamage);
        shakeHealthBar(enemyHealthBarShakeAnim); // Shake enemy health bar

        // Reset player animation
        setPlayerCharacterImage(getInitialImageSource());
        setIsPlayerAttacking(false);

        if (newEnemyHealth <= 0) {
          addCombatLogMessage('Enemy defeated!');
          setIsPlayerTurn(true);
          setTimer(0);
          setIsResting(false);
          setIsDodging(false);
          if (isMounted.current) setTimeout(() => setShowVictory(true), 500);
          setIsTurnProcessing(false);
          return;
        }

        // Handle enemy turn after animation
        setIsPlayerTurn(false);
        handleEnemyAttack(() => {
          setIsPlayerTurn(true);
          setTimer(30);
          setIsResting(false);
          setHasDealtDamage(false);
          setIsTurnProcessing(false);
        });
      });
      return; // Return here to prevent double execution
    }

    // Handle Elemental Sword Master animation for different heroes - Use character type
    else if (skill.name === "Elemental Sword Master") {
      // Deduct mana cost
      const newMana = playerMana - skill.manaCost;
      setPlayerMana(newMana);
      animateManaChange(playerMana, newMana);
      setSkillCooldowns(prev => ({ ...prev, [skill.name]: skill.cooldown }));

      setIsPlayerAttacking(true);
      playerAttackAnim.setValue(0);
      let elementalSlashAnimationSource;

      // Determine animation source based on character type
      switch (playerCharacterType) {
          case 'white': elementalSlashAnimationSource = whiteElementalSlashGif; break;
          case 'purp': elementalSlashAnimationSource = purpElementalSlashGif; break;
          case 'pink': elementalSlashAnimationSource = pinkElementalSlashGif; break;
          case 'cyan': elementalSlashAnimationSource = cyanElementalSlashGif; break;
          case 'blue': elementalSlashAnimationSource = blueElementalSlashGif; break;
          default: elementalSlashAnimationSource = whiteElementalSlashGif;
      }

      setPlayerCharacterImage(elementalSlashAnimationSource);

      // Move forward and stay in front of enemy
      Animated.sequence([
        // Move to enemy position
        Animated.timing(playerAttackAnim, {
          toValue: 1,
          duration: 500,
          useNativeDriver: true,
        }),
        // Stay in front of enemy
        Animated.delay(1500),
        // Return to original position
        Animated.timing(playerAttackAnim, {
          toValue: 0,
          duration: 500,
          useNativeDriver: true,
        })
      ]).start(() => {
        // Apply damage and effects
        const totalDamage = skill.damage + rawDamageBonus;
        const newEnemyHealth = Math.max(0, enemy.health - totalDamage);
        setEnemy(prev => ({ ...prev, health: newEnemyHealth }));
        console.log(`[handleSkillUse] Before animateHealthChange (Elemental Sword Master) - current enemy health: ${enemy.health}, new enemy health: ${newEnemyHealth}`); // Added log
        // Ensure animateHealthChange is called with the correct anim value
        animateHealthChange(enemy.health, newEnemyHealth, enemyHealthBarAnim);
        addCombatLogMessage(`You used ${skill.name} and dealt ${totalDamage} damage!`);

        // Show enemy effects
        shakeEnemy();
        showEnemyRainbowBloodEffect();
        showEnemyDamageIndicator(totalDamage);
        shakeHealthBar(enemyHealthBarShakeAnim); // Shake enemy health bar

        // Reset player animation
        setPlayerCharacterImage(getInitialImageSource());
        setIsPlayerAttacking(false);

        if (newEnemyHealth <= 0) {
          addCombatLogMessage('Enemy defeated!');
          setIsPlayerTurn(true);
          setTimer(0);
          setIsResting(false);
          setIsDodging(false);
          if (isMounted.current) setTimeout(() => setShowVictory(true), 500);
          setIsTurnProcessing(false);
          return;
        }

        // Handle enemy turn after animation
        setIsPlayerTurn(false);
        handleEnemyAttack(() => {
          setIsPlayerTurn(true);
          setTimer(30);
          setIsResting(false);
          setHasDealtDamage(false);
          setIsTurnProcessing(false);
        });
      });
      return; // Return here to prevent double execution
    }

    // Handle Replenish skill
    else if (skill.name === "Replenish") {
      // Deduct mana cost
      const newMana = playerMana - skill.manaCost;
      setPlayerMana(newMana);
      animateManaChange(playerMana, newMana);
      setSkillCooldowns(prev => ({ ...prev, [skill.name]: skill.cooldown }));

      showSkillPopup("REPLENISHED!");
      showDragonBallAura();
      animateHealthChange(playerHealth, maxHealth, playerHealthBarAnim);
      setPlayerHealth(maxHealth);
      addCombatLogMessage(`Your health has been fully restored!`);

      // Mark skill as used
      setSkills(prev => prev.map(s =>
        s.name === skill.name ? { ...s, hasBeenUsed: true } : s
      ));

      setIsPlayerTurn(false);
      handleEnemyAttack(() => {
        setIsPlayerTurn(true);
        setTimer(30);
        setIsResting(false);
        setHasDealtDamage(false);
        setIsTurnProcessing(false);
      });
      return; // Return here to prevent double execution
    }

    // Regular skill usage
    const newMana = playerMana - skill.manaCost;
    setPlayerMana(newMana);
    animateManaChange(playerMana, newMana);
    setSkillCooldowns(prev => ({ ...prev, [skill.name]: skill.cooldown }));

    // Apply raw damage bonus to all attacks
    const totalDamage = skill.damage + rawDamageBonus;
    const newEnemyHealth = Math.max(0, enemy.health - totalDamage);
    setEnemy(prev => ({ ...prev, health: newEnemyHealth }));
    console.log(`[handleSkillUse] Calculated newEnemyHealth (Regular): ${newEnemyHealth}`); // Log new enemy health
    // Ensure animateHealthChange is called with the correct anim value
    animateHealthChange(enemy.health, newEnemyHealth, enemyHealthBarAnim);
    addCombatLogMessage(`You used ${skill.name} and dealt ${totalDamage} damage!`);

    if (newEnemyHealth <= 0) {
      addCombatLogMessage('Enemy defeated!');
      setIsPlayerTurn(true);
      setTimer(0);
      setIsResting(false);
      setIsDodging(false);
      if (isMounted.current) setTimeout(() => setShowVictory(true), 500);
      setIsTurnProcessing(false);
      return;
    }

    setIsPlayerTurn(false);
    handleEnemyAttack(() => {
      setIsPlayerTurn(true);
      setTimer(30);
      setIsResting(false);
      setHasDealtDamage(false);
      setIsTurnProcessing(false);
    });
  };

  // Update handleRest to properly restore mana
  const handleRest = () => {
    if (!isPlayerTurn || hasDealtDamage || isPlayerDying || isTurnProcessing) return; // Use isTurnProcessing check at the start
    setIsTurnProcessing(true); // Set to true at the start of the action
    setIsResting(true);
    const newMana = Math.min(maxMana, playerMana + 50);
    setPlayerMana(newMana);
    animateManaChange(playerMana, newMana);
    addCombatLogMessage(`You take a rest and recover 50 mana!`);
    setIsPlayerTurn(false);
    handleEnemyAttack(() => {
      setIsPlayerTurn(true);
      setTimer(30);
      setIsResting(false);
      setIsTurnProcessing(false); // Turn processing ends when player turn begins
    });
  };

  // Update handleDodge to remove turn notifications and use local assets
  const handleDodge = () => {
     if (!isPlayerTurn || hasDealtDamage || isPlayerDying || isTurnProcessing) return; // Use isTurnProcessing check at the start
     setIsTurnProcessing(true); // Set to true at the start of the action
    setHasDealtDamage(true);
    setIsDodging(true);
    addCombatLogMessage('You prepare to dodge the next attack!');
    setIsPlayerTurn(false);
    handleEnemyAttack(() => {
      addCombatLogMessage('You successfully dodged the enemy attack!');
      showDodgeIndicator();
      setIsPlayerTurn(true);
      setTimer(30);
      setIsDodging(false);
      setIsTurnProcessing(false); // Turn processing ends
    });
  };

  // Update handleHeal to remove turn notifications and use local assets
  const handleHeal = () => {
    if (!isPlayerTurn || hasDealtDamage || isPlayerDying || isTurnProcessing) return; // Use isTurnProcessing check at the start
    setIsTurnProcessing(true); // Set to true at the start of the action
    const healAmount = 20;
    const newHealth = Math.min(100, playerHealth + healAmount);
    setPlayerHealth(newHealth);
    animateHealthChange(playerHealth, newHealth, playerHealthBarAnim);
    addCombatLogMessage(`You heal yourself for ${healAmount} HP!`);
    setIsPlayerTurn(false);
    handleEnemyAttack(() => {
      setIsPlayerTurn(true);
      setTimer(30);
      setIsTurnProcessing(false); // Turn processing ends
    });
  };

  const togglePause = () => {
    if (!isTurnProcessing) { // Prevent pausing during turn processing
      setIsPaused(prev => !prev);
    }
  };

  const handleGameOver = () => {
    setIsTurnProcessing(false); // Ensure isTurnProcessing is false on game over
    setShowGameOver(true);
  };

  // This effect now triggers the death animation
  useEffect(() => {
    if (playerHealth <= 0 && !isPlayerDying) {
      setIsPlayerDying(true);
      setIsTurnProcessing(true); // Prevent further actions while dying
      const deathAnimationSource = getInitialImageSource();
      setPlayerCharacterImage(deathAnimationSource);
      playerScaleAnim.setValue(1);
      Animated.sequence([
        Animated.timing(playerScaleAnim, {
          toValue: 0,
          duration: 1000,
          useNativeDriver: true
        })
      ]).start(() => {
        handleGameOver();
      });
    }
  }, [playerHealth]);

  // Update handleRetry to reset level with correct enemy
  const handleRetry = () => {
    setCurrentLevel(1);
    setPlayerHealth(100);
    setPlayerMana(100);
    setMaxMana(100);
    setEnemy({
      name: 'Samurai',
      health: parseInt(enemyHealth) || 100,
      maxHealth: parseInt(enemyHealth) || 100,
      damage: 25,
      imageUrl: require('../../assets/animations/samurai idle.gif') // Use local asset for Samurai idle
    });
    playerHealthBarAnim.setValue(100);
    playerManaAnim.setValue(100);
    enemyHealthBarAnim.setValue(parseInt(enemyHealth) || 100);
    setCombatLog([]);
    setShowGameOver(false);
    setIsPlayerTurn(true);
    setTimer(0); // Reset timer to 0
    setPlayerCharacterImage(getInitialImageSource());
    setIsPlayerDying(false);
    playerScaleAnim.setValue(1);
    setIsTurnProcessing(false); // Reset processing on retry
  };

  // Update handleNextLevel to increase difficulty and switch enemy
  const handleNextLevel = () => {
    const nextLevel = currentLevel + 1;

    if (nextLevel === 2) {
      // Transition to Level 2: Birdman
      const samuraiBaseDamage = 25; // Samurai's base damage
      const birdmanDamage = Math.floor(samuraiBaseDamage * 1.5); // 1.5x Samurai damage
      const initialEnemyHealth = parseInt(enemyHealth) || 100; // Use initial enemy health for scaling
      const birdmanHealth = Math.floor(initialEnemyHealth * 1.5); // Example: 1.5x initial health for Birdman

      setCurrentLevel(nextLevel);
      setPlayerHealth(100); // Reset player health
      setPlayerMana(100); // Reset player mana
      setMaxMana(100); // Assuming max mana is constant between levels

      // Update enemy to Birdman with correct idle animation
      setEnemy({
        name: 'Birdman',
        health: birdmanHealth,
        maxHealth: birdmanHealth,
        damage: birdmanDamage,
        imageUrl: require('../../assets/animations/sunraku idle.gif'), // Set Birdman idle GIF
      });

      // Reset UI elements
      playerHealthBarAnim.setValue(100);
      playerManaAnim.setValue(100);
      enemyHealthBarAnim.setValue(birdmanHealth);
      setCombatLog([]);
      setShowVictory(false);
      setIsPlayerTurn(true);
      setTimer(0); // Reset timer to 0
      setIsResting(false);
      setIsDodging(false);
      setIsPlayerDying(false);
      playerScaleAnim.setValue(1);
      addCombatLogMessage(`Level ${nextLevel} - A fearsome Birdman appears with ${birdmanHealth} HP and ${birdmanDamage} attack!`);
      setIsTurnProcessing(false);
    } else {
      // If already on Level 2 or higher, treat as final victory (return to menu)
      handleReturnToMenu(); // Use existing return to menu logic
    }
  };

  const handleReturnToMenu = () => {
    setIsPaused(false);
    setIsTurnProcessing(false); // Reset processing on return to menu
    router.push('/');
  };

  // Add this function to handle exit
  const handleExit = () => {
    if (!isTurnProcessing) { // Prevent exiting during turn processing
      setShowExitConfirmation(true);
    }
  };

  const handleConfirmExit = () => {
    setIsTurnProcessing(false); // Reset processing on confirming exit
    router.push('/');
  };

  const handleCancelExit = () => {
    setShowExitConfirmation(false);
  };

  // Helper to handle enemy attack animation and logic
  const handleEnemyAttack = (attackCallback: () => void) => {
    if (isPlayerDying) return; // Prevent enemy attack if player is dying

    enemyAttackAnim.setValue(0);
    soruAnim.setValue(0);
    setIsEnemyAttacking(true);
    setShowSoru(true);

    // Animate the SORU text
    Animated.sequence([
      Animated.timing(soruAnim, {
        toValue: 1,
        duration: 200,
        useNativeDriver: true,
      }),
      Animated.timing(soruAnim, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      })
    ]).start();

    Animated.timing(enemyAttackAnim, {
      toValue: 1,
      duration: 2000, // Assuming enemy attack animation duration
      useNativeDriver: true,
    }).start(() => {
      setIsEnemyAttacking(false);
      setShowSoru(false);

      // Apply dodge chance
      const dodgeRoll = Math.random() * 100;
      if (dodgeRoll < dodgeChance) {
        addCombatLogMessage('You successfully dodged the enemy attack!');
        showDodgeIndicator();
        setIsPlayerTurn(true);
        setTimer(30);
        setIsDodging(false);
        setIsTurnProcessing(false); // Turn processing ends after dodge
        attackCallback(); // Call the callback to end the turn sequence
        return;
      }

      // Apply enemy damage
      const damage = enemy.damage;
      setPlayerHealth(prev => {
        const newHealth = Math.max(0, prev - damage);
        animateHealthChange(prev, newHealth, playerHealthBarAnim); // Keep this for animation start point
        // Make sure this line uses playerHealthBarShakeAnim:
        shakeHealthBar(enemyHealthBarShakeAnim); // Shake player health bar
        return newHealth;
      });
      addCombatLogMessage(`Enemy attacked and dealt ${damage} damage!`);

      // Show damage number and trigger effects
      showDamageIndicator(damage);
      shakePlayer();
      // console.log(`[handleEnemyAttack] Player took ${damage} damage, new health: ${playerHealth - damage}, playerHealthBarAnim: ${playerHealthBarAnim.__getValue()}`); // Removed due to linter error
      showRainbowBloodEffect();

      // Check if player is defeated after applying damage
      if (playerHealth - damage <= 0) {
         // The useEffect for playerHealth will handle the death animation and game over
         setIsTurnProcessing(false); // Turn processing ends on game over
         attackCallback(); // Call the callback to end the turn sequence
         return;
      }

      setIsPlayerTurn(true);
      setTimer(30);
      setIsResting(false);
      setHasDealtDamage(false);  // Reset hasDealtDamage when enemy turn ends
      setIsTurnProcessing(false); // Turn processing ends after enemy attack
      attackCallback();
    });
  };

  // Track all timeouts for cleanup
  const timeouts = useRef<NodeJS.Timeout[]>([]);

  // Cleanup all timeouts/intervals on unmount
  useEffect(() => {
    return () => {
      isMounted.current = false;
      timeouts.current.forEach(clearTimeout);
      timeouts.current = [];
    };
  }, []);

  // Wrap navigation in try/catch
  const handleReturnToMainMenu = () => {
    setIsPaused(false);
    setTimeout(() => {
      try {
        if (isMounted.current) router.push('/');
      } catch (e) {
        console.error('[ERROR] Navigation failed:', e);
      }
    }, 100);
  };

  // Update the shake animation timing
  const shakePlayer = () => {
    // Start shake animation 0.8s earlier
    setTimeout(() => {
      Animated.sequence([
        Animated.timing(playerShakeAnim, {
          toValue: 10,
          duration: 25,
          useNativeDriver: true,
        }),
        Animated.timing(playerShakeAnim, {
          toValue: -10,
          duration: 25,
          useNativeDriver: true,
        }),
        Animated.timing(playerShakeAnim, {
          toValue: 10,
          duration: 25,
          useNativeDriver: true,
        }),
        Animated.timing(playerShakeAnim, {
          toValue: 0,
          duration: 25,
          useNativeDriver: true,
        }),
      ]).start();
    }, 200); // 0.8s earlier than the blood effect
  };

  // Update the rainbow blood effect to create multiple droplets
  const showRainbowBloodEffect = () => {
    setShowRainbowBlood(true);
    rainbowBloodAnim.setValue(0);
    Animated.timing(rainbowBloodAnim, {
      toValue: 1,
      duration: 800, // Increased duration for falling effect
      useNativeDriver: true,
    }).start(() => {
      setShowRainbowBlood(false);
    });
  };

  // Add function to show damage number
  const showDamageIndicator = (damage: number) => {
    setDamageAmount(damage);
    setShowDamageNumber(true);
    damageNumberAnim.setValue(0);
    Animated.sequence([
      Animated.timing(damageNumberAnim, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.timing(damageNumberAnim, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      })
    ]).start(() => {
      setShowDamageNumber(false);
    });
  };

  // Ensure health bar anim values are always in sync with max health
  useEffect(() => {
    // Whenever maxHealth changes (e.g., More Health skill), update the animation value
    playerHealthBarAnim.setValue(playerHealth);
  }, [maxHealth, playerHealth]);

  useEffect(() => {
    // Whenever enemy maxHealth changes, update the animation value
    enemyHealthBarAnim.setValue(enemy.maxHealth);
  }, [enemy.maxHealth, enemy.health]);

  // Add this function to show dodge message
  const showDodgeIndicator = () => {
    setShowDodgeMessage(true);
    dodgeMessageAnim.setValue(0);
    Animated.sequence([
      Animated.timing(dodgeMessageAnim, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.timing(dodgeMessageAnim, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      })
    ]).start(() => {
      setShowDodgeMessage(false);
    });
  };

  // Add enemy shake animation
  const shakeEnemy = () => {
    setIsEnemyShaking(true);
    Animated.sequence([
      Animated.timing(enemyShakeAnim, {
        toValue: 10,
        duration: 25,
        useNativeDriver: true,
      }),
      Animated.timing(enemyShakeAnim, {
        toValue: -10,
        duration: 25,
        useNativeDriver: true,
      }),
      Animated.timing(enemyShakeAnim, {
        toValue: 10,
        duration: 25,
        useNativeDriver: true,
      }),
      Animated.timing(enemyShakeAnim, {
        toValue: 0,
        duration: 25,
        useNativeDriver: true,
      }),
    ]).start(() => {
      setIsEnemyShaking(false);
    });
  };

  // Add enemy blood effect
  const showEnemyRainbowBloodEffect = () => {
    setShowEnemyRainbowBlood(true);
    enemyRainbowBloodAnim.setValue(0);
    Animated.timing(enemyRainbowBloodAnim, {
      toValue: 1,
      duration: 800,
      useNativeDriver: true,
    }).start(() => {
      setShowEnemyRainbowBlood(false);
    });
  };

  // Add enemy damage number
  const showEnemyDamageIndicator = (damage: number) => {
    setEnemyDamageAmount(damage);
    setShowEnemyDamageNumber(true);
    enemyDamageNumberAnim.setValue(0);
    Animated.sequence([
      Animated.timing(enemyDamageNumberAnim, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.timing(enemyDamageNumberAnim, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      })
    ]).start(() => {
      setShowEnemyDamageNumber(false);
    });
  };

  // Add this function to handle the replenish aura animation
  const showDragonBallAura = () => {
    setShowReplenishAura(true);
    // Animate flames
    flameAnimsInner.forEach((anim, i) => {
      anim.setValue(0);
      Animated.loop(
        Animated.sequence([
          Animated.timing(anim, {
            toValue: 1,
            duration: 200 + Math.random() * 120,
            delay: flameConfigsInner[i].delay,
            useNativeDriver: true,
          }),
          Animated.timing(anim, {
            toValue: 0,
            duration: 120 + Math.random() * 80,
            useNativeDriver: true,
          })
        ])
      ).start();
    });
    flameAnimsOuter.forEach((anim, i) => {
      anim.setValue(0);
      Animated.loop(
        Animated.sequence([
          Animated.timing(anim, {
            toValue: 1,
            duration: 400 + Math.random() * 300,
            delay: flameConfigsOuter[i].delay,
            useNativeDriver: true,
          }),
          Animated.timing(anim, {
            toValue: 0,
            duration: 200 + Math.random() * 200,
            useNativeDriver: true,
          })
        ])
      ).start();
    });
    // Animate player scale (power-up effect)
    playerScaleAnim.setValue(1);
    Animated.sequence([
      Animated.timing(playerScaleAnim, { toValue: 1.08, duration: 120, useNativeDriver: true }),
      Animated.timing(playerScaleAnim, { toValue: 0.97, duration: 120, useNativeDriver: true }),
      Animated.timing(playerScaleAnim, { toValue: 1.03, duration: 120, useNativeDriver: true }),
      Animated.timing(playerScaleAnim, { toValue: 1, duration: 120, useNativeDriver: true })
    ]).start();
    // Animate sparks
    const sparks = Array.from({ length: 8 }, (_, i) => ({
      left: 120 + Math.random() * 40 - 20,
      bottom: 80 + Math.random() * 40 - 20,
      angle: -30 + Math.random() * 60,
      length: 18 + Math.random() * 10,
      key: `spark-${i}`,
    }));
    setSparkConfigs(sparks);
    sparkAnims.current = sparks.map(() => new Animated.Value(0));
    sparkAnims.current.forEach((anim, i) => {
      anim.setValue(0);
      Animated.sequence([
        Animated.timing(anim, {
          toValue: 1,
          duration: 350 + Math.random() * 200,
          delay: Math.random() * 200,
          useNativeDriver: true,
        }),
        Animated.timing(anim, {
          toValue: 0,
          duration: 100,
          useNativeDriver: true,
        })
      ]).start();
    });
    // Hide aura after 1.2s
    setTimeout(() => {
      setShowReplenishAura(false);
      // isTurnProcessing ends in handleEnemyAttack callback
    }, 1200);
  };

  // Function to animate elemental spells
  const animateElementalSpell = (spellType: string, skill: Skill) => {
    let spellAnimation;
    switch (spellType) {
      case 'Boulder':
        spellAnimation = boulderGif;
        break;
      case 'Cryo Crystals':
        spellAnimation = cryoCrystalsGif;
        break;
      case 'Fireball':
        spellAnimation = fireballGif;
        break;
      case 'Water Shot':
        spellAnimation = waterShotGif;
        break;
      default:
        return;
    }

    setCurrentSpellAnimation(spellAnimation);
    setShowElementalSpell(true);
    spellAnim.setValue(0);
    // isTurnProcessing is already true

    // Animate spell from center to enemy
    Animated.timing(spellAnim, {
      toValue: 1,
      duration: 1000, // 1 second animation
      useNativeDriver: true,
    }).start(() => {
      // Calculate damage after animation completes
      const totalDamage = skill.damage + rawDamageBonus;
      const newEnemyHealth = Math.max(0, enemy.health - totalDamage);
      setEnemy(prev => ({ ...prev, health: newEnemyHealth }));
      console.log(`[animateElementalSpell] Before animateHealthChange - current enemy health: ${enemy.health}, new enemy health: ${newEnemyHealth}`); // Added log
      // Ensure animateHealthChange is called with the correct anim value
      animateHealthChange(enemy.health, newEnemyHealth, enemyHealthBarAnim);
      setHasDealtDamage(true);
      shakeEnemy();
      showEnemyRainbowBloodEffect();
      showEnemyDamageIndicator(totalDamage);
      addCombatLogMessage(`You used ${skill.name} and dealt ${totalDamage} damage!`);
      shakeHealthBar(enemyHealthBarShakeAnim); // Shake enemy health bar

      // Reset animation state
      setTimeout(() => {
        setShowElementalSpell(false);
        setCurrentSpellAnimation(null);
        // isTurnProcessing ends in handleEnemyAttack callback
        if (newEnemyHealth <= 0) {
          addCombatLogMessage('Enemy defeated!');
          setIsPlayerTurn(true);
          setTimer(0);
          setIsResting(false);
          setIsDodging(false);
          if (isMounted.current) setTimeout(() => setShowVictory(true), 500);
          setIsTurnProcessing(false); // Turn processing ends on victory after spell animation
          return;
        }
        handleEnemyAttack(() => {
          setIsPlayerTurn(true);
          setTimer(30);
          setIsResting(false);
          setIsTurnProcessing(false); // Turn processing ends after enemy turn following spell
        });
      }, 500);
    });
  };

  // Add shake animation function for health bars
  const shakeHealthBar = (animValue: Animated.Value) => {
    Animated.sequence([
      Animated.timing(animValue, {
        toValue: 5, // Shake amount
        duration: 50, // Shake speed
        useNativeDriver: true,
      }),
      Animated.timing(animValue, {
        toValue: -5,
        duration: 50,
        useNativeDriver: true,
      }),
      Animated.timing(animValue, {
        toValue: 5,
        duration: 50,
        useNativeDriver: true,
      }),
      Animated.timing(animValue, {
        toValue: 0,
        duration: 50,
        useNativeDriver: true,
      }),
    ]).start();
  };

  // Helper to get the correct enemy attack GIF
  const getEnemyAttackGif = (enemyName: string) => {
    console.log('[DEBUG] getEnemyAttackGif enemyName:', enemyName);
    if (enemyName === 'Samurai') {
      return samuraiAttackGif;
    } else if (enemyName === 'Birdman') {
      return sunrakuAttackGif;
    }
    // Fallback to a local idle gif for unknown enemies
    return require('../../assets/animations/samurai idle.gif');
  };

  // Add a ref to track if the component is mounted
  const isMounted = useRef(true);

  useEffect(() => {
    isMounted.current = true;
    return () => {
      isMounted.current = false;
    };
  }, []);

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
        source={{ uri: selectedMap }}
        style={styles.backgroundImage}
        resizeMode="cover"
      >
        <View style={[styles.overlay, isPaused && styles.pausedOverlay]}>
          {/* Level Display */}
          <View style={styles.levelContainer}>
            <Text style={[styles.levelText, { fontFamily: 'PixelifySans' }]}>Level {currentLevel}</Text>
          </View>

          {/* Buffs Display */}
          {activeBuffs.length > 0 && (
            <View style={styles.buffsContainer}>
              <Text style={[styles.buffsLabel, { fontFamily: 'PixelifySans' }]}>Buffs:</Text>
              {activeBuffs.map((buff, index) => (
                <Text key={index} style={[styles.buffText, { fontFamily: 'PixelifySans' }]}>
                  {buff}
                </Text>
              ))}
            </View>
          )}

          {/* Timer Container */}
          <View style={styles.statusContainer}>
            <View style={styles.timerContainer}>
              <Text style={[styles.timerText, { fontFamily: 'PixelifySans' }]}>Time: {timer}s</Text>
            </View>
          </View>

          {/* Enemy Health Bar - Top Center */}
          <Animated.View 
            style={[
              styles.enemyHealthContainer, 
              { 
                top: 40,
                transform: [{ translateX: enemyHealthBarShakeAnim }]
              }
            ]}
          >
            <View style={styles.barContainer}>
              <Text style={[styles.barLabel, { fontFamily: 'PixelifySans' }]}>HP</Text>
              <Animated.View
                style={{
                  flex: 1,
                  transform: [{ translateX: enemyHealthBarShakeAnim }],
                }}
              >
                <View style={styles.barBackground}>
                  <Animated.View
                    style={[
                      styles.enemyHealthBar,
                      {
                        width: `${(enemy.health / enemy.maxHealth) * 100}%`
                      }
                    ]}
                  />
                </View>
                <Text style={[styles.hpText, { fontFamily: 'PixelifySans' }]}>
                  {enemy.health}/{enemy.maxHealth}
                </Text>
              </Animated.View>
            </View>
          </Animated.View>

          {/* VS and Names Centered */}
          <View style={[styles.centeredNamesContainer, { top: 60 }]}>
            <Text style={[styles.nameText, { fontFamily: 'PixelifySans', marginRight: 12, fontWeight: '900' }]}>{playerName}</Text>
            <Text style={[styles.vsText, { fontFamily: 'PixelifySans', marginHorizontal: 12 }]}>VS</Text>
            <Text style={[styles.nameText, { fontFamily: 'PixelifySans', marginLeft: 12, fontWeight: '900' }]}>{enemy.name}</Text>
          </View>

          {/* Battle Arena Layout */}
          <View style={[styles.battleArena, { zIndex: 2 }]}>
            {/* Player Side */}
            <View style={[styles.playerSide, { zIndex: 2 }]}>
              <Animated.View
                style={{
                  transform: [
                    {
                      translateX: playerShakeAnim
                    },
                    {
                      translateX: playerAttackAnim.interpolate({
                        inputRange: [0, 1],
                        outputRange: [0, 300]
                      })
                    }
                  ]
                }}
              >
                <Animated.Image 
                  source={playerCharacterImage}
                  style={[
                    styles.playerCharacterImage,
                    {
                      width: 120,
                      height: 120,
                      transform: [
                        { scale: showReplenishAura ? playerScaleAnim : 1 }
                      ]
                    }
                  ]}
                  resizeMode="contain"
                />
                {showDamageNumber && (
                  <Animated.Text
                    style={[
                      styles.damageNumber,
                      {
                        opacity: damageNumberAnim,
                        transform: [
                          {
                            translateY: damageNumberAnim.interpolate({
                              inputRange: [0, 1],
                              outputRange: [0, -50]
                            })
                          }
                        ]
                      }
                    ]}
                  >
                    -{damageAmount}
                  </Animated.Text>
                )}
                {showRainbowBlood && (
                  <>
                    {/* Blood drips */}
                    {[...Array(15)].map((_, index) => (
                      <Animated.View
                        key={index}
                        style={[
                          styles.bloodContainer,
                          {
                            opacity: rainbowBloodAnim.interpolate({
                              inputRange: [0, 0.8, 1],
                              outputRange: [1, 0.8, 0]
                            }),
                            transform: [
                              {
                                translateY: rainbowBloodAnim.interpolate({
                                  inputRange: [0, 1],
                                  outputRange: [0, 300]
                                })
                              },
                              {
                                scale: rainbowBloodAnim.interpolate({
                                  inputRange: [0, 0.3, 1],
                                  outputRange: [1, 1.2, 0.8]
                                })
                              }
                            ],
                            left: `${-5 + (index * 7)}%`,
                            top: `${20 + (index % 3) * 5}%`,
                            width: 8 + Math.random() * 4,
                            height: 12 + Math.random() * 8,
                          }
                        ]}
                      >
                        <View 
                          style={[
                            styles.bloodDrop,
                            {
                              backgroundColor: `rgba(139, 0, 0, ${0.8 + Math.random() * 0.2})`,
                              borderRadius: 4,
                            }
                          ]} 
                        />
                      </Animated.View>
                    ))}
                    {/* Blood splatter on ground */}
                    {[...Array(8)].map((_, index) => (
                      <Animated.View
                        key={`splatter-${index}`}
                        style={[
                          styles.bloodSplatterContainer,
                          {
                            opacity: rainbowBloodAnim.interpolate({
                              inputRange: [0.3, 0.8, 1],
                              outputRange: [0, 1, 0]
                            }),
                            transform: [
                              {
                                scale: rainbowBloodAnim.interpolate({
                                  inputRange: [0.3, 0.5, 1],
                                  outputRange: [0, 1, 1.2]
                                })
                              }
                            ],
                            left: `${-15 + (index * 8)}%`,
                            bottom: '0%',
                            width: 20 + Math.random() * 15,
                            height: 10 + Math.random() * 8,
                          }
                        ]}
                      >
                        <View 
                          style={[
                            styles.bloodSplatter,
                            {
                              backgroundColor: `rgba(139, 0, 0, ${0.6 + Math.random() * 0.4})`,
                              borderRadius: 8,
                            }
                          ]} 
                        />
                      </Animated.View>
                    ))}
                  </>
                )}
                {showDodgeMessage && (
                  <Animated.Text
                    style={[
                      styles.dodgeMessage,
                      {
                        opacity: dodgeMessageAnim,
                        transform: [
                          {
                            translateY: dodgeMessageAnim.interpolate({
                              inputRange: [0, 1],
                              outputRange: [0, -50]
                            })
                          },
                          {
                            scale: dodgeMessageAnim.interpolate({
                              inputRange: [0, 0.5, 1],
                              outputRange: [0.5, 1.2, 1]
                            })
                          }
                        ]
                      }
                    ]}
                  >
                    DODGED!
                  </Animated.Text>
                )}
              </Animated.View>
            </View>

            {/* Enemy Side */}
            <View style={[styles.enemySide, { zIndex: 2 }]}>
              <Animated.View
                style={{
                  transform: [{
                    translateX: enemyShakeAnim
                  }]
                }}
              >
                <Animated.Image
                  source={isEnemyAttacking
                    ? getEnemyAttackGif(enemy.name)
                    : enemy.imageUrl}
                  style={[
                    styles.characterImage,
                    isEnemyAttacking && enemy.name === 'Samurai' && {
                      width: 240,
                      height: 240,
                    },
                    isEnemyAttacking && enemy.name === 'Birdman' && {
                      width: 60,
                      height: 60,
                    },
                    isEnemyAttacking && enemy.name !== 'Samurai' && enemy.name !== 'Birdman' && {
                      width: 120,
                      height: 120,
                    },
                    isEnemyAttacking && {
                      transform: [{
                        translateX: enemyAttackAnim.interpolate({
                          inputRange: [0, 0.1, 0.9, 1],
                          outputRange: [0, -300, -300, 0]
                        })
                      }]
                    }
                  ]}
                  resizeMode="contain"
                />
                {showEnemyDamageNumber && (
                  <Animated.Text
                    style={[
                      styles.damageNumber,
                      {
                        opacity: enemyDamageNumberAnim,
                        transform: [
                          {
                            translateY: enemyDamageNumberAnim.interpolate({
                              inputRange: [0, 1],
                              outputRange: [0, -50]
                            })
                          },
                          {
                            scale: enemyDamageNumberAnim.interpolate({
                              inputRange: [0, 0.5, 1],
                              outputRange: [0.5, 1.2, 1]
                            })
                          }
                        ]
                      }
                    ]}
                  >
                    -{enemyDamageAmount}
                  </Animated.Text>
                )}
                {showEnemyRainbowBlood && (
                  <>
                    {/* Enemy blood drips */}
                    {[...Array(15)].map((_, index) => (
                      <Animated.View
                        key={index}
                        style={[
                          styles.bloodContainer,
                          {
                            opacity: enemyRainbowBloodAnim.interpolate({
                              inputRange: [0, 0.8, 1],
                              outputRange: [1, 0.8, 0]
                            }),
                            transform: [
                              {
                                translateY: enemyRainbowBloodAnim.interpolate({
                                  inputRange: [0, 1],
                                  outputRange: [0, 300]
                                })
                              },
                              {
                                scale: enemyRainbowBloodAnim.interpolate({
                                  inputRange: [0, 0.3, 1],
                                  outputRange: [1, 1.2, 0.8]
                                })
                              }
                            ],
                            left: `${-5 + (index * 7)}%`,
                            top: `${20 + (index % 3) * 5}%`,
                            width: 8 + Math.random() * 4,
                            height: 12 + Math.random() * 8,
                          }
                        ]}
                      >
                        <View 
                          style={[
                            styles.bloodDrop,
                            {
                              backgroundColor: `rgba(139, 0, 0, ${0.8 + Math.random() * 0.2})`,
                              borderRadius: 4,
                            }
                          ]} 
                        />
                      </Animated.View>
                    ))}
                    {/* Enemy blood splatter */}
                    {[...Array(8)].map((_, index) => (
                      <Animated.View
                        key={`splatter-${index}`}
                        style={[
                          styles.bloodSplatterContainer,
                          {
                            opacity: enemyRainbowBloodAnim.interpolate({
                              inputRange: [0.3, 0.8, 1],
                              outputRange: [0, 1, 0]
                            }),
                            transform: [
                              {
                                scale: enemyRainbowBloodAnim.interpolate({
                                  inputRange: [0.3, 0.5, 1],
                                  outputRange: [0, 1, 1.2]
                                })
                              }
                            ],
                            left: `${-15 + (index * 8)}%`,
                            bottom: '0%',
                            width: 20 + Math.random() * 15,
                            height: 10 + Math.random() * 8,
                          }
                        ]}
                      >
                        <View 
                          style={[
                            styles.bloodSplatter,
                            {
                              backgroundColor: `rgba(139, 0, 0, ${0.6 + Math.random() * 0.4})`,
                              borderRadius: 8,
                            }
                          ]} 
                        />
                      </Animated.View>
                    ))}
                  </>
                )}
              </Animated.View>
              {showSoru && (
                <Animated.Text
                  style={[
                    styles.soruText,
                    {
                      opacity: soruAnim,
                      transform: [{
                        scale: soruAnim.interpolate({
                          inputRange: [0, 1],
                          outputRange: [0.5, 1.5]
                        })
                      }]
                    }
                  ]}
                >
                  Slash!
                </Animated.Text>
              )}
            </View>
          </View>

          {/* Player Health/Mana Bars - Bottom Center */}
          <View style={[styles.playerStatusContainer, { zIndex: 10 }]}>
            <View style={styles.barContainer}>
              <Text style={[styles.barLabel, { fontFamily: 'PixelifySans' }]}>HP</Text>
              {/* Apply shake animation to the bar wrapper */}
              <Animated.View
                style={{
                  flex: 1, // Needs to be here to work with barContainer flex
                  transform: [{ translateX: playerHealthBarShakeAnim }],
                }}
              >
                <View style={styles.barBackground}>
                  <Animated.View
                    style={[
                      styles.healthBar,
                      { /* Add key here if needed */
                        width: playerHealthBarAnim.interpolate({
                          inputRange: [0, maxHealth],
                          outputRange: ['0%', '100%']
                        })
                      }
                    ]}
                  />
                </View>
                <Text style={[styles.hpText, { fontFamily: 'PixelifySans' }]}>
                  {playerHealth}/{maxHealth}
                </Text>
              </Animated.View>
            </View>
            <View style={styles.barContainer}>
              <Text style={[styles.barLabel, { fontFamily: 'PixelifySans', marginLeft: 8 }]}>MP</Text>
              <View style={styles.barWrapper}>
                <View style={styles.barBackground}>
                  <Animated.View 
                    style={[
                      styles.manaBar, 
                      { 
                        width: playerManaAnim.interpolate({
                          inputRange: [0, maxMana],
                          outputRange: ['0%', '100%']
                        })
                      }
                    ]} 
                  />
                </View>
                <Text style={[styles.hpText, { fontFamily: 'PixelifySans' }]}>
                  {playerMana}/{maxMana}
                </Text>
              </View>
            </View>
          </View>

          {/* Combat Log - Moved to background layer */}
          <View style={[styles.combatLogContainer, { zIndex: 1 }]}>
            {combatLog.map((message, index) => (
              <Text key={index} style={[styles.combatLogText, { fontFamily: 'PixelifySans' }]}>
                {message}
              </Text>
            ))}
          </View>
        </View>
      </ImageBackground>

      {/* Rest Button - Left Side */}
      <TouchableOpacity
        style={[
          styles.restButtonContainer,
          (!isPlayerTurn || isPlayerDying || isTurnProcessing) && styles.disabledButton // Disable if turn is processing
        ]}
        onPress={handleRest}
        disabled={!isPlayerTurn || isPlayerDying || isTurnProcessing} // Disable if turn is processing
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
      <View style={[styles.skillsContainer, { zIndex: 20 }]}>
        {skills.map((skill, index) => {
          const isOnCooldown = skillCooldowns[skill.name] > 0;
          const isPassive = passiveSkills[skill.name];
          const isUsed = skill.hasBeenUsed;
          const canUse = isPlayerTurn && playerMana >= skill.manaCost && !isOnCooldown && !isPassive && !isUsed && !isPlayerDying && !isTurnProcessing;

          return (
            <TouchableOpacity
              key={index}
              style={[
                styles.skillButton,
                index === 2 ? styles.largeSkillButton :
                index === 1 ? styles.mediumSkillButton :
                styles.smallSkillButton,
                (!canUse || isTurnProcessing) && styles.disabledButton // Add isTurnProcessing to visual state
              ]}
              onPress={() => handleSkillUse(skill)}
              disabled={!canUse || isTurnProcessing}
            >
              <View style={[
                styles.skillIconContainer,
                index === 2 ? styles.largeSkillIconContainer :
                index === 1 ? styles.mediumSkillIconContainer :
                styles.smallSkillIconContainer,
                (isOnCooldown || isPassive || isUsed) && styles.cooldownOverlay
              ]}>
                <Image 
                  source={{ uri: skill.imageUrl }}
                  style={[
                    styles.equalSkillIcon,
                    (isOnCooldown || isPassive || isUsed) && styles.cooldownImage
                  ]}
                  resizeMode="cover"
                />
                {isOnCooldown && (
                  <View style={styles.cooldownTextContainer}>
                    <Text style={[styles.cooldownText, { fontFamily: 'PixelifySans' }]}>{skillCooldowns[skill.name]}</Text>
                  </View>
                )}
                {(isPassive || isUsed) && (
                  <View style={styles.cooldownTextContainer}>
                    <Text style={[styles.cooldownText, { fontFamily: 'PixelifySans' }]}>
                      {isPassive ? 'PASSIVE' : 'USED'}
                    </Text>
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
      <TouchableOpacity style={styles.pauseButton} onPress={togglePause} disabled={isPlayerDying || isTurnProcessing}>
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
            <TouchableOpacity 
              style={[
                styles.mainMenuButton,
                Platform.OS === 'ios' && styles.iosMainMenuButton
              ]} 
              onPress={handleReturnToMainMenu}
            >
              <Text style={[
                styles.mainMenuButtonText,
                Platform.OS === 'ios' && styles.iosMainMenuButtonText,
                { fontFamily: 'PixelifySans' }
              ]}>Main Menu</Text>
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
      {isMounted.current && (
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
                {currentLevel === 1 ? (
                  <TouchableOpacity style={styles.modalButton} onPress={handleNextLevel}>
                    <Text style={[styles.modalButtonText, { fontFamily: 'PixelifySans' }]}>Next Level</Text>
                  </TouchableOpacity>
                ) : (
                  <TouchableOpacity style={styles.modalButton} onPress={handleReturnToMenu}>
                    <Text style={[styles.modalButtonText, { fontFamily: 'PixelifySans' }]}>Return to Menu</Text>
                  </TouchableOpacity>
                )}
              </View>
            </View>
          </View>
        </Modal>
      )}

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

      {/* Update the skill message popup */}
      {showSkillMessage && (
        <Animated.View style={[
          styles.skillMessageContainer,
          skillMessage === "REPLENISHED!" && styles.replenishMessageContainer
        ]}>
          {skillMessage === "REPLENISHED!" ? (
            <View style={styles.replenishContent}>
              <View style={styles.replenishCross}>
                <View style={styles.crossLine} />
                <View style={[styles.crossLine, { transform: [{ rotate: '90deg' }] }]} />
                <View style={styles.crossGlow} />
              </View>
              <Text style={[styles.replenishText, { fontFamily: 'PixelifySans' }]}>
                {skillMessage}
              </Text>
            </View>
          ) : (
            <Text style={[styles.skillMessageText, { fontFamily: 'PixelifySans' }]}>
              {skillMessage}
            </Text>
          )}
        </Animated.View>
      )}

      {/* Elemental Spell Animation */}
      {showElementalSpell && currentSpellAnimation && (
        <Animated.View
          style={[
            styles.elementalSpellContainer,
            {
              transform: [
                {
                  translateX: spellAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: [0, 300] // Move from player to enemy
                  })
                }
              ]
            }
          ]}
        >
          <Image
            source={currentSpellAnimation}
            style={styles.elementalSpellImage}
            resizeMode="contain"
          />
        </Animated.View>
      )}

      {/* Mute Button */}
      <TouchableOpacity 
        style={[styles.muteButton, isMuted && styles.muteButtonActive]} 
        onPress={toggleMute}
      >
        <FontAwesome 
          name={isMuted ? "volume-off" : "volume-up"} 
          size={24} 
          color="white" 
        />
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  } as ViewStyle,
  backgroundImage: {
    flex: 1,
    width: '100%',
    height: '100%',
  } as ViewStyle,
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    padding: 16,
  } as ViewStyle,
  battleArena: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    marginTop: 60,
    marginBottom: 60,
    position: 'relative',
    zIndex: 2, // Higher z-index to appear above combat log
  } as ViewStyle,
  playerSide: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    height: 200,
    marginRight: 40,
    marginTop: 80,
    zIndex: 2, // Higher z-index to appear above combat log
  } as ViewStyle,
  enemySide: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    height: 200,
    marginLeft: 40,
    marginTop: 80,
    zIndex: 2, // Higher z-index to appear above combat log
  } as ViewStyle,
  characterImage: {
    width: 120,
    height: 120,
    marginBottom: 8,
  } as ImageStyle,
  playerCharacterImage: {
    width: 120, // Reduced from 240
    height: 120, // Reduced from 240
    marginBottom: 8,
  } as ImageStyle,
  vsContainer: {
    position: 'absolute',
    left: '50%',
    top: 40,
    transform: [{ translateX: -20 }],
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1,
  } as ViewStyle,
  vsText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: 'bold',
    textShadowColor: '#000',
    textShadowOffset: { width: 2, height: 2 },
    textShadowRadius: 3,
    letterSpacing: 1,
  } as TextStyle,
  namesContainer: {
    position: 'absolute',
    top: 3,
    left: -100,
    right: -100,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  } as ViewStyle,
  nameText: {
    color: '#FFB23F',
    fontSize: 14,
    fontWeight: 'bold',
    textAlign: 'center',
    textShadowColor: '#000',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
    width: 100,
  } as TextStyle,
  statusBars: {
    width: '100%',
    maxWidth: 200,
    marginTop: 8,
    alignItems: 'flex-start',
    paddingHorizontal: 10,
  } as ViewStyle,
  barContainer: {
    marginBottom: 6,
    width: 300,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  } as ViewStyle,
  barWrapper: {
    flex: 1,
  } as ViewStyle,
  barBackground: {
    height: 8,
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    borderRadius: 4,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#ffffff40',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 2,
  } as ViewStyle,
  barLabel: {
    color: 'white',
    fontSize: 12,
    textShadowColor: '#000',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
    width: 45,
  } as TextStyle,
  healthBar: {
    height: '100%',
    backgroundColor: '#22c55e',
    borderRadius: 4,
    shadowColor: '#22c55e',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.5,
    shadowRadius: 4,
  } as ViewStyle,
  manaBar: {
    height: '100%',
    backgroundColor: '#3b82f6',
    borderRadius: 4,
    shadowColor: '#3b82f6',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.5,
    shadowRadius: 4,
  } as ViewStyle,
  enemyContainer: {
    alignItems: 'flex-end',
    marginTop: 8,
    width: '100%',
    maxWidth: 200,
    paddingHorizontal: 10,
  } as ViewStyle,
  playerNameContainer: {
    alignItems: 'flex-start',
    marginBottom: 4,
  } as ViewStyle,
  playerName: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 4,
    textShadowColor: '#000000',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
  } as TextStyle,
  enemyName: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 4,
    textShadowColor: '#000000',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
  } as ViewStyle,
  enemyHealthBar: {
    height: '100%',
    backgroundColor: '#dc2626',
    borderRadius: 4,
    shadowColor: '#dc2626',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.5,
    shadowRadius: 4,
  } as ViewStyle,
  skillsContainer: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'flex-end',
    gap: 8,
    position: 'absolute',
    bottom: 20,
    right: 20,
    paddingHorizontal: 8,
    zIndex: 20, // Ensure skills container is above combat log
  } as ViewStyle,
  restButtonContainer: {
    position: 'absolute',
    bottom: 20,
    left: 20,
    alignItems: 'center',
    justifyContent: 'center',
    width: 65,
    height: 65,
    borderRadius: 32.5,
  } as ViewStyle,
  skillButton: {
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 20, // Ensure skill buttons are above combat log
  } as ViewStyle,
  smallSkillButton: {
    width: 42,
    height: 54,
  } as ViewStyle,
  smallSkillIconContainer: {
    width: 38,
    height: 38,
    borderRadius: 19,
  } as ViewStyle,
  smallSkillIcon: {
    width: 28,
    height: 28,
  } as ImageStyle,
  mediumSkillButton: {
    width: 50,
    height: 62,
  } as ViewStyle,
  mediumSkillIconContainer: {
    width: 46,
    height: 46,
    borderRadius: 23,
  } as ViewStyle,
  mediumSkillIcon: {
    width: 36,
    height: 36,
  } as ImageStyle,
  largeSkillButton: {
    width: 58,
    height: 70,
  } as ViewStyle,
  largeSkillIconContainer: {
    width: 54,
    height: 54,
    borderRadius: 27,
  } as ViewStyle,
  largeSkillIcon: {
    width: 44,
    height: 44,
  } as ImageStyle,
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
  } as ViewStyle,
  skillName: {
    color: '#ffffff',
    fontSize: 8,
    fontWeight: 'bold',
    textAlign: 'center',
    marginTop: 2,
    textShadowColor: '#000',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 0,
  } as TextStyle,
  disabledButton: {
    opacity: 0.5,
  } as ViewStyle,
  turnInfo: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginBottom: 16,
  } as ViewStyle,
  turnText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  } as TextStyle,
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
  } as ViewStyle,
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.8)',
  } as ViewStyle,
  modalContent: {
    backgroundColor: 'rgba(0,0,0,0.9)',
    padding: 20,
    borderRadius: 12,
    alignItems: 'center',
    width: '80%',
  } as ViewStyle,
  modalTitle: {
    color: 'white',
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 10,
  } as TextStyle,
  modalText: {
    color: 'white',
    fontSize: 18,
    marginBottom: 20,
    textAlign: 'center',
  } as TextStyle,
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    width: '100%',
  } as ViewStyle,
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
  } as ViewStyle,
  modalButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: 'bold',
    textShadowColor: '#000',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 0,
  } as TextStyle,
  pausedOverlay: {
    opacity: 0.5,
  } as ViewStyle,
  iosPauseScreenContainer: {
    backgroundColor: 'rgba(0,0,0,0.95)',
  } as ViewStyle,
  pauseScreenContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.8)',
  } as ViewStyle,
  pauseScreenContent: {
    backgroundColor: 'rgba(0,0,0,0.9)',
    padding: 30,
    borderRadius: 20,
    alignItems: 'center',
    width: '80%',
  } as ViewStyle,
  iosPauseScreenContent: {
    backgroundColor: 'rgba(0,0,0,1)',
    padding: 40,
    borderRadius: 25,
    borderWidth: 2,
    borderColor: '#6B238E',
  } as ViewStyle,
  pauseScreenTitle: {
    color: 'white',
    fontSize: 32,
    fontWeight: 'bold',
    marginBottom: 30,
  } as TextStyle,
  iosPauseScreenTitle: {
    fontSize: 40,
    color: '#6B238E',
    textShadowColor: 'rgba(0,0,0,0.75)',
    textShadowOffset: { width: 2, height: 2 },
    textShadowRadius: 4,
  } as TextStyle,
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
  } as ViewStyle,
  iosResumeButton: {
    backgroundColor: '#6B238E',
    paddingVertical: 20,
    paddingHorizontal: 50,
    borderRadius: 20,
    borderWidth: 2,
    borderColor: 'white',
  } as ViewStyle,
  resumeButtonText: {
    color: '#ffffff',
    fontSize: 24,
    fontWeight: 'bold',
    textShadowColor: '#000',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 0,
  } as TextStyle,
  iosResumeButtonText: {
    fontSize: 28,
    textShadowColor: 'rgba(0,0,0,0.75)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
  } as TextStyle,
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
  } as ViewStyle,
  timerText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: 'bold',
    textAlign: 'center',
    textShadowColor: '#000',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 0,
  } as TextStyle,
  statusContainer: {
    position: 'absolute',
    top: 16,
    left: 16,
    gap: 12,
  } as ViewStyle,
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
  } as ViewStyle,
  statusText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: 'bold',
    textAlign: 'center',
    textShadowColor: '#000',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 0,
  } as TextStyle,
  enemyHealthContainer: {
    position: 'absolute',
    top: 40,
    left: 0,
    right: 0,
    alignItems: 'center',
    paddingHorizontal: 20,
    zIndex: 10,
  } as ViewStyle,
  playerStatusContainer: {
    position: 'absolute',
    bottom: 10,
    left: 0,
    right: 0,
    alignItems: 'center',
    paddingHorizontal: 20,
    zIndex: 10,
  } as ViewStyle,
  enemyNameText: {
    position: 'absolute',
    top: -20,
    color: '#FFB23F',
    fontSize: 14,
    fontWeight: 'bold',
    textShadowColor: '#000',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
  } as TextStyle,
  characterNameContainer: {
    position: 'absolute',
    bottom: 140,
    left: 0,
    right: 0,
    alignItems: 'center',
  } as ViewStyle,
  characterName: {
    color: '#FFB23F',
    fontSize: 14,
    fontWeight: 'bold',
    textShadowColor: '#000',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
  } as TextStyle,
  loadingText: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
    textAlign: 'center',
  } as TextStyle,
  cooldownOverlay: {
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
  } as ViewStyle,
  cooldownImage: {
    opacity: 0.5,
  } as ImageStyle,
  cooldownTextContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
  } as ViewStyle,
  cooldownText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
    textShadowColor: '#000',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
  } as TextStyle,
  manaCostText: {
    color: '#3b82f6',
    fontSize: 8,
    fontWeight: 'bold',
    textAlign: 'center',
    marginTop: 2,
    textShadowColor: '#000',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 1,
  } as TextStyle,
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
  } as ViewStyle,
  turnNotificationText: {
    color: '#FFFFFF',
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
    textShadowColor: '#20B2AA',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
  } as TextStyle,
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
  } as ViewStyle,
  modalSubText: {
    color: '#ff6b6b',
    fontSize: 14,
    marginBottom: 20,
    textAlign: 'center',
    fontStyle: 'italic',
  } as TextStyle,
  cancelButton: {
    backgroundColor: '#2d2d2d',
    borderColor: '#4a4a4a',
  } as ViewStyle,
  exitButton: {
    backgroundColor: '#dc2626',
    borderColor: '#991b1b',
  } as ViewStyle,
  hpText: {
    color: 'white',
    fontSize: 10,
    fontWeight: 'bold',
    textAlign: 'center',
    marginTop: 2,
    textShadowColor: '#000',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
  } as TextStyle,
  skillMessageContainer: {
    position: 'absolute',
    top: '30%',
    left: '35%',
    transform: [{ translateX: -50 }, { translateY: -25 }],
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
  } as ViewStyle,
  replenishMessageContainer: {
    backgroundColor: 'transparent',
    borderWidth: 0,
    shadowOpacity: 0,
    elevation: 0,
  } as ViewStyle,
  replenishContent: {
    alignItems: 'center',
    justifyContent: 'center',
  } as ViewStyle,
  replenishCross: {
    width: 50,
    height: 50,
    marginBottom: 8,
    position: 'relative',
  } as ViewStyle,
  crossLine: {
    position: 'absolute',
    width: '100%',
    height: 8,
    backgroundColor: '#22c55e',
    borderRadius: 4,
    top: '50%',
    left: 0,
    transform: [{ translateY: -4 }],
    shadowColor: '#22c55e',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 4,
    elevation: 5,
  } as ViewStyle,
  crossGlow: {
    position: 'absolute',
    width: '120%',
    height: '120%',
    top: '-10%',
    left: '-10%',
    borderRadius: 25,
    backgroundColor: 'rgba(34, 197, 94, 0.2)',
    shadowColor: '#22c55e',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.5,
    shadowRadius: 10,
    elevation: 3,
  } as ViewStyle,
  replenishText: {
    color: '#22c55e',
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
    textShadowColor: 'rgba(0, 0, 0, 0.5)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
    marginTop: 4,
  } as TextStyle,
  skillMessageText: {
    color: '#FFFFFF',
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
    textShadowColor: '#20B2AA',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
  } as TextStyle,
  mainMenuButton: {
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
    marginTop: 10,
  },
  iosMainMenuButton: {
    backgroundColor: '#6B238E',
    paddingVertical: 20,
    paddingHorizontal: 50,
    borderRadius: 20,
    borderWidth: 2,
    borderColor: 'white',
  },
  mainMenuButtonText: {
    color: '#ffffff',
    fontSize: 24,
    fontWeight: 'bold',
    textShadowColor: '#000',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 0,
  },
  iosMainMenuButtonText: {
    fontSize: 28,
    textShadowColor: 'rgba(0,0,0,0.75)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
  },
  buffsContainer: {
    position: 'absolute',
    top: 60,
    left: 40,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    padding: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#4a4a4a',
    zIndex: 20,
  },
  buffsLabel: {
    color: '#FFB23F',
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: 4,
    textShadowColor: '#000',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
  },
  buffText: {
    color: '#ffffff',
    fontSize: 12,
    marginBottom: 2,
    textShadowColor: '#000',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
  },
  soruText: {
    position: 'absolute',
    color: '#FFB23F',
    fontSize: 32,
    fontWeight: 'bold',
    textShadowColor: '#000',
    textShadowOffset: { width: 2, height: 2 },
    textShadowRadius: 4,
    fontFamily: 'PixelifySans',
    transform: [{ rotate: '-15deg' }],
    zIndex: 100,
  },
  bloodContainer: {
    position: 'absolute',
    transform: [{ translateX: -4 }, { translateY: -6 }],
    zIndex: 100,
    marginLeft: -20,
  },
  bloodDrop: {
    width: '100%',
    height: '100%',
    shadowColor: '#8B0000',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.5,
    shadowRadius: 2,
    elevation: 3,
  },
  bloodSplatterContainer: {
    position: 'absolute',
    transform: [{ translateX: -10 }, { translateY: -5 }],
    zIndex: 99,
  },
  bloodSplatter: {
    width: '100%',
    height: '100%',
    shadowColor: '#8B0000',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.3,
    shadowRadius: 1,
    elevation: 2,
  },
  damageNumber: {
    position: 'absolute',
    top: '20%',
    left: '50%',
    transform: [{ translateX: -20 }],
    color: '#FF0000',
    fontSize: 32,
    fontWeight: 'bold',
    textShadowColor: '#000',
    textShadowOffset: { width: 2, height: 2 },
    textShadowRadius: 4,
    fontFamily: 'PixelifySans',
    zIndex: 1000,
  },
  centeredNamesContainer: {
    position: 'absolute',
    top: 60,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10,
  },
  equalSkillIconContainer: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#222',
    overflow: 'hidden',
  },
  equalSkillIcon: {
    width: '100%',
    height: '100%',
  },
  dodgeMessage: {
    position: 'absolute',
    top: '20%',
    left: '50%',
    transform: [{ translateX: -40 }],
    color: '#FFFFFF',
    fontSize: 32,
    fontWeight: 'bold',
    textShadowColor: '#000',
    textShadowOffset: { width: 2, height: 2 },
    textShadowRadius: 4,
    fontFamily: 'PixelifySans',
    zIndex: 1000,
  },
  replenishAura: {
    position: 'absolute',
    width: 200,
    height: 200,
    borderRadius: 100,
    backgroundColor: 'rgba(34, 197, 94, 0.2)',
    borderWidth: 2,
    borderColor: 'rgba(34, 197, 94, 0.4)',
    shadowColor: '#22c55e',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 20,
    elevation: 5,
    zIndex: 1,
    top: -40,
    left: -40,
  },
  combatLogContainer: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    transform: [{ translateX: -150 }, { translateY: -50 }],
    backgroundColor: 'rgba(0, 0, 0, 0.4)', // More transparent background
    padding: 12,
    borderRadius: 8,
    borderWidth: 1, // Thinner border
    borderColor: 'rgba(255, 255, 255, 0.1)', // Subtle border
    borderStyle: 'solid',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.3, // Reduced shadow
    shadowRadius: 4,
    elevation: 2, // Reduced elevation
    width: 300,
    maxHeight: 100,
    overflow: 'scroll',
    zIndex: 1,
    backdropFilter: 'blur(4px)', // Add blur effect if supported
  },
  combatLogText: {
    color: 'rgba(255, 255, 255, 0.6)', // More transparent text
    fontSize: 12,
    marginBottom: 4,
    textShadowColor: 'rgba(0, 0, 0, 0.3)', // Subtle text shadow
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 1,
  },
  elementalSpellContainer: {
    position: 'absolute',
    left: '25%', // Start from player's position
    top: '40%',
    zIndex: 15,
  },
  elementalSpellImage: {
    width: 300,
    height: 300,
  },
  levelContainer: {
    position: 'absolute',
    top: 60, // Position below pause and mute buttons
    right: 16, // Align with the right side
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
  levelText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: 'bold',
    textAlign: 'center',
    textShadowColor: '#000',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 0,
  },
  muteButton: {
    position: 'absolute',
    top: 16,
    right: 70,
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
  muteButtonActive: {
    backgroundColor: 'rgba(255,0,0,0.7)',
  },
});

export default BattleSystem; 