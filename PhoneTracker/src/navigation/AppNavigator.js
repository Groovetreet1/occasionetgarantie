import React from "react";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import PhoneListScreen from "../screens/PhoneListScreen";
import AddPhoneScreen from "../screens/AddPhoneScreen";
import PhoneDetailScreen from "../screens/PhoneDetailScreen";
import RecentItemsScreen from "../screens/RecentItemsScreen";
import Colors from "../theme/colors";

const Stack = createNativeStackNavigator();

export default function AppNavigator() {
  return (
    <Stack.Navigator
      screenOptions={{
        headerStyle: { backgroundColor: Colors.primary },
        headerTintColor: "#fff",
        headerTitleStyle: { fontWeight: "bold" },
        headerShadowVisible: false,
      }}
    >
      <Stack.Screen
        name="PhoneList"
        component={PhoneListScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="AddPhone"
        component={AddPhoneScreen}
        options={{
          title: "Ajouter",
          headerBackTitle: "Retour",
        }}
      />
      <Stack.Screen
        name="PhoneDetail"
        component={PhoneDetailScreen}
        options={{
          title: "Détails",
          headerBackTitle: "Retour",
        }}
      />
      <Stack.Screen
        name="RecentItems"
        component={RecentItemsScreen}
        options={{
          title: "Tous les articles",
          headerBackTitle: "Retour",
        }}
      />
    </Stack.Navigator>
  );
}
