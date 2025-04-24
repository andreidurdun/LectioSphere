import React, { useEffect, useState } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import LoginMenu from './components/LoginMenu';
import HomePage from './components/HomePage';
import RegisterMenu from './components/RegisterMenu';
import AsyncStorage from '@react-native-async-storage/async-storage';

const Stack = createNativeStackNavigator();

export default function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    // Verifică dacă există un token salvat
    const checkAuth = async () => {
      const token = await AsyncStorage.getItem('auth_token');
      if (token) {
        setIsAuthenticated(false);
      } else {
        setIsAuthenticated(false);
      }
    };

    checkAuth();
  }, []);

  return (
    <NavigationContainer>
      <Stack.Navigator initialRouteName={isAuthenticated ? "HomePage" : "LoginMenu"}>
        <Stack.Screen 
          name="LoginMenu" 
          component={LoginMenu} 
          options={{ headerShown: false }}
        />
        <Stack.Screen 
          name="HomePage" 
          component={HomePage} 
          options={{ headerShown: false }}
        />
        <Stack.Screen 
          name="RegisterMenu" 
          component={RegisterMenu} 
          options={{ headerShown: false }}
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
