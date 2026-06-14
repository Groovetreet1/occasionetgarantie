import { useEffect } from 'react';
import { View, ActivityIndicator } from 'react-native';
import { router } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';

const PIN_KEY = '@mad_pin_code';

export default function IndexScreen() {
  useEffect(() => {
    AsyncStorage.getItem(PIN_KEY).then(saved => {
      if (saved) {
        router.replace('/pin');
      } else {
        router.replace('/pin');
      }
    });
  }, []);

  return (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#0f172a' }}>
      <ActivityIndicator size="large" color="#059669" />
    </View>
  );
}
