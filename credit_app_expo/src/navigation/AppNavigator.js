import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Text } from 'react-native';
import { COLORS } from '../theme/colors';
import HomeScreen from '../screens/HomeScreen';
import AddCreditScreen from '../screens/AddCreditScreen';
import DetailScreen from '../screens/DetailScreen';
import CalendarScreen from '../screens/CalendarScreen';

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

function HomeTabs() {
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: COLORS.nightBlue,
        tabBarInactiveTintColor: '#9CA3AF',
        tabBarStyle: {
          backgroundColor: '#fff',
          borderTopWidth: 0,
          elevation: 8,
          shadowColor: '#000',
          shadowOpacity: 0.08,
          shadowRadius: 12,
          height: 60,
          paddingBottom: 8,
        },
        tabBarLabelStyle: { fontSize: 12, fontWeight: '500' },
      }}
    >
      <Tab.Screen
        name="Credits"
        component={HomeScreen}
        options={{
          tabBarLabel: 'Crédits',
          tabBarIcon: ({ color, size }) => (
            <Text style={{ fontSize: size, color }}>💰</Text>
          ),
        }}
      />
      <Tab.Screen
        name="CalendrierTab"
        component={CalendarScreen}
        options={{
          tabBarLabel: 'Calendrier',
          tabBarIcon: ({ color, size }) => (
            <Text style={{ fontSize: size, color }}>📅</Text>
          ),
        }}
      />
    </Tab.Navigator>
  );
}

export default function AppNavigator() {
  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        <Stack.Screen name="Home" component={HomeTabs} />
        <Stack.Screen
          name="AddCredit"
          component={AddCreditScreen}
          options={{ animation: 'slide_from_bottom' }}
        />
        <Stack.Screen
          name="Detail"
          component={DetailScreen}
          options={{ animation: 'slide_from_right' }}
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
