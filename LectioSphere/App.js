import React, { useEffect, useState } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import LoginMenu from './components/LoginMenu';
import HomePage from './components/HomePage';
import RegisterMenu from './components/RegisterMenu';
import ProfilePage from './components/ProfilePage';
import SearchPage from './components/SearchPage';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import ProfileEdit from './components/ProfileEdit';
import CategoryBooksPage from './components/CategoryBooksPage';
import BookShow from './components/BookShow';
import LibraryPage from './components/LibraryPage';
import AllShelves from './components/AllShelves';
import ShelfPage from './components/ShelfPage';
import BooksChallenge from './components/BooksChallenge';
import PagesChallenge from './components/PagesChallenge';
import ChangeGoalBooks from './components/ChangeGoalBooks';
import ChangeGoalPages from './components/ChangeGoalPages';
import AddShelf from './components/AddShelf';

const Stack = createNativeStackNavigator();
// URL-ul de bază al serverului, utilizat în întreaga aplicație
const API_BASE_URL = 'http://192.168.1.129:8000';

// Configurare interceptor global pentru axios
const setupAxiosInterceptors = (refresh) => {
  axios.interceptors.response.use(
    (response) => response,
    async (error) => {
      const originalRequest = error.config;

      // Verificăm dacă eroarea este 401 (token nevalid/expirat) și nu am încercat deja să reînnoim tokenul
      if (error.response?.status === 401 && !originalRequest._retry) {
        originalRequest._retry = true;

        try {
          // Încercăm să obținem un nou token folosind refresh token-ul
          const refreshToken = await AsyncStorage.getItem('refresh_token');
          if (!refreshToken) {
            // Nu avem refresh token, trebuie să ne autentificăm din nou
            return Promise.reject(error);
          }

          const response = await axios.post(`${API_BASE_URL}/auth/jwt/refresh/`, {
            refresh: refreshToken,
          });

          const { access } = response.data;

          // Salvăm noul token de acces
          await AsyncStorage.setItem('auth_token', access);

          // Actualizăm header-ul pentru cererea originală și o retrimitem
          originalRequest.headers['Authorization'] = 'JWT ' + access;
          return axios(originalRequest);
        } catch (refreshError) {
          // Dacă reînnoirea token-ului eșuează, trebuie să ne autentificăm din nou
          console.error('Token refresh failed', refreshError);
          if (refresh) {
            refresh();
          }
          return Promise.reject(error);
        }
      }

      return Promise.reject(error);
    }
  );
};

export default function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Verifică dacă există un token salvat
    const checkAuth = async () => {
      try {
        const token = await AsyncStorage.getItem('auth_token');
        if (token) {
          // Configurăm header-ul default pentru toate cererile axios
          axios.defaults.headers.common['Authorization'] = `JWT ${token}`;
          setIsAuthenticated(true);
        } else {
          setIsAuthenticated(false);
        }
      } catch (error) {
        console.error('Error reading auth token from AsyncStorage:', error);
        setIsAuthenticated(false);
      } finally {
        setIsLoading(false);
      }
    };

    checkAuth();

    // Configurare interceptor pentru reînnoirea automată a tokenului
    setupAxiosInterceptors(() => {
      // Callback când reînnoirea tokenului eșuează complet
      console.log('Token refresh failed completely, logging out');
      removeAuthToken();
    });
  }, []);

  const saveAuthToken = async (token) => {
    try {
      await AsyncStorage.setItem('auth_token', token);
      // Setăm token-ul și pentru cereri viitoare
      axios.defaults.headers.common['Authorization'] = `JWT ${token}`;
      setIsAuthenticated(true);
    } catch (error) {
      console.error('Error saving auth token to AsyncStorage:', error);
    }
  };

  const removeAuthToken = async () => {
    try {
      await AsyncStorage.removeItem('auth_token');
      await AsyncStorage.removeItem('refresh_token');
      // Eliminăm token-ul din header-ul default
      delete axios.defaults.headers.common['Authorization'];
      setIsAuthenticated(false);
    } catch (error) {
      console.error('Error removing auth token from AsyncStorage:', error);
    }
  };

  // Așteptăm să se termine verificarea autentificării înainte de a randa aplicația
  if (isLoading) {
    return null; // sau poți returna un indicator de încărcare aici
  }

  return (
    <NavigationContainer>
      <Stack.Navigator initialRouteName={isAuthenticated ? 'HomePage' : 'LoginMenu'}> 
      {/*<Stack.Navigator initialRouteName={'LoginMenu'}>*/}
        <Stack.Screen name="LoginMenu" options={{ headerShown: false }}>
          {(props) => <LoginMenu {...props} saveAuthToken={saveAuthToken} apiBaseUrl={API_BASE_URL} />}
        </Stack.Screen>

        <Stack.Screen name="RegisterMenu" options={{ headerShown: false }}>
          {(props) => <RegisterMenu {...props} saveAuthToken={saveAuthToken} apiBaseUrl={API_BASE_URL} />}
        </Stack.Screen>

        <Stack.Screen name="HomePage" options={{ headerShown: false }}>
          {(props) => (
            <HomePage
              {...props}
              removeAuthToken={removeAuthToken}
              isAuthenticated={isAuthenticated}
              apiBaseUrl={API_BASE_URL}
            />
          )}
        </Stack.Screen>

        <Stack.Screen name="SearchPage" options={{ headerShown: false }}>
          {(props) => (
            <SearchPage
              {...props}
              removeAuthToken={removeAuthToken}
              isAuthenticated={isAuthenticated}
              apiBaseUrl={API_BASE_URL}
            />
          )}
        </Stack.Screen>

        <Stack.Screen name="LibraryPage" options={{ headerShown: false }}>
          {(props) => (
            <LibraryPage
              {...props}
              removeAuthToken={removeAuthToken}
              isAuthenticated={isAuthenticated}
              apiBaseUrl={API_BASE_URL}
            />
          )}
        </Stack.Screen>

        <Stack.Screen name="ProfilePage" options={{ headerShown: false }}>
          {(props) => (
            <ProfilePage
              {...props}
              removeAuthToken={removeAuthToken}
              isAuthenticated={isAuthenticated}
              apiBaseUrl={API_BASE_URL}
            />
          )}
        </Stack.Screen>

        <Stack.Screen name="ProfileEdit" options={{ headerShown: false }}>
          {(props) => (
            <ProfileEdit
              {...props}
              removeAuthToken={removeAuthToken}
              isAuthenticated={isAuthenticated}
              apiBaseUrl={API_BASE_URL}
            />
          )}
        </Stack.Screen>


        <Stack.Screen name="CategoryBooksPage" options={{ headerShown: false }}>
          {(props) => (
            <CategoryBooksPage
              {...props}
              removeAuthToken={removeAuthToken}
              isAuthenticated={isAuthenticated}
              apiBaseUrl={API_BASE_URL}
            />
          )}
        </Stack.Screen>
        
        <Stack.Screen name="BookShow" options={{ headerShown: false }}>
          {(props) => (
            <BookShow
              {...props}
              removeAuthToken={removeAuthToken}
              isAuthenticated={isAuthenticated}
              apiBaseUrl={API_BASE_URL}
            />
          )}
        </Stack.Screen>

        <Stack.Screen name="AllShelves" options={{ headerShown: false }}>
          {(props) => (
            <AllShelves
              {...props}
              removeAuthToken={removeAuthToken}
              isAuthenticated={isAuthenticated}
              apiBaseUrl={API_BASE_URL}
            />
          )}
        </Stack.Screen>

        <Stack.Screen name="ShelfPage" options={{ headerShown: false }}>
          {(props) => (
            <ShelfPage
              {...props}
              removeAuthToken={removeAuthToken}
              isAuthenticated={isAuthenticated}
              apiBaseUrl={API_BASE_URL}
            />
          )}
        </Stack.Screen>

        <Stack.Screen name="BooksChallenge" options={{ headerShown: false }}>
          {(props) => (
            <BooksChallenge
              {...props}
              removeAuthToken={removeAuthToken}
              isAuthenticated={isAuthenticated}
              apiBaseUrl={API_BASE_URL}
            />
          )}
        </Stack.Screen>

        <Stack.Screen name="PagesChallenge" options={{ headerShown: false }}>
          {(props) => (
            <PagesChallenge
              {...props}
              removeAuthToken={removeAuthToken}
              isAuthenticated={isAuthenticated}
              apiBaseUrl={API_BASE_URL}
            />
          )}
        </Stack.Screen>

        <Stack.Screen name="ChangeGoalPages" options={{ headerShown: false }}>
          {(props) => (
            <ChangeGoalPages
              {...props}
              removeAuthToken={removeAuthToken}
              isAuthenticated={isAuthenticated}
              apiBaseUrl={API_BASE_URL}
            />
          )}
        </Stack.Screen>

        <Stack.Screen name="ChangeGoalBooks" options={{ headerShown: false }}>
          {(props) => (
            <ChangeGoalBooks
              {...props}
              removeAuthToken={removeAuthToken}
              isAuthenticated={isAuthenticated}
              apiBaseUrl={API_BASE_URL}
            />
          )}
        </Stack.Screen>

        <Stack.Screen name="AddShelf" options={{ headerShown: false }}>
          {(props) => (
            <AddShelf
              {...props}
              removeAuthToken={removeAuthToken}
              isAuthenticated={isAuthenticated}
              apiBaseUrl={API_BASE_URL}
            />
          )}
        </Stack.Screen>

      </Stack.Navigator>
    </NavigationContainer>
  );
}
