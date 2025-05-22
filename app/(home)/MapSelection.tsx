import React from 'react';
import { View, Text, TouchableOpacity, Image, StyleSheet } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';

const mapOptions = [
  'https://owqaiuqmvihvwomtiimr.supabase.co/storage/v1/object/public/plushiechronicles/maps/mapp.jpg',
  'https://owqaiuqmvihvwomtiimr.supabase.co/storage/v1/object/public/plushiechronicles/maps/map.png'
];

export default function MapSelection() {
  const router = useRouter();
  const params = useLocalSearchParams();

  const handleSelect = (url: string) => {
    router.push({
      pathname: '/(home)/BattleSystem',
      params: { ...params, selectedMap: url }
    });
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Choose Your Map</Text>
      <View style={styles.options}>
        {mapOptions.map((url, idx) => (
          <TouchableOpacity key={url} onPress={() => handleSelect(url)}>
            <Image source={{ uri: url }} style={styles.mapImage} />
            <Text style={styles.label}>
              {idx === 0 ? "Castle Graveyard" : "Willow Forest"}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#111' },
  title: { color: 'white', fontSize: 24, marginBottom: 20 },
  options: { flexDirection: 'row' },
  mapImage: { width: 180, height: 120, margin: 16, borderWidth: 2, borderColor: 'white', borderRadius: 8 },
  label: { color: 'white', textAlign: 'center', marginTop: 8 }
}); 