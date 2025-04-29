import React, { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Alert, SafeAreaView } from 'react-native';
import NavBar from './Partials/NavBar';
import TopBar from './Partials/TopBar';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';

const HomePage = ({ navigation, removeAuthToken, isAuthenticated, apiBaseUrl }) => {
    const [userData, setUserData] = useState(null);

    useEffect(() => {
        // Verificăm dacă utilizatorul este autentificat și încărcăm datele profilului
        if (isAuthenticated) {
            fetchUserData();
        }
    }, [isAuthenticated]);

    const fetchUserData = async () => {
        try {
            const token = await AsyncStorage.getItem('auth_token');
            if (!token) {
                console.log('No token found');
                return;
            }

            const response = await axios.get(`${apiBaseUrl}/auth/users/me/`, {
                headers: {
                    'Authorization': `JWT ${token}`
                }
            });

            if (response.status === 200) {
                setUserData(response.data);
            }
        } catch (error) {
            console.error('Error fetching user data:', error);
            if (error.response && error.response.status === 401) {
                // Token expirat sau invalid - delogăm utilizatorul
                handleLogout();
            }
        }
    };

    const handleLogout = async () => {
        Alert.alert(
            'Logout',
            'Are you sure you want to logout?',
            [
                { text: 'Cancel', style: 'cancel' },
                { 
                    text: 'Logout', 
                    onPress: async () => {
                        // Utilizează funcția removeAuthToken pasată din App.js
                        await removeAuthToken();
                        // Navigăm către ecranul de login
                        navigation.replace('LoginMenu');
                    }
                }
            ]
        );
    };

    return (
        <SafeAreaView style={styles.screen}>
            
            <TopBar pageName="OwnProfilePage" />

            <View style={styles.header}>
                <Text style={styles.title}>Welcome to LectioSphere</Text>
                {userData && (
                    <Text style={styles.welcomeText}>
                        Hello, {userData.first_name} {userData.last_name}!
                    </Text>
                )}
                <Text style={styles.title}>In tot view-ul asta implementezi logica pentru HomePage</Text>
            </View>

            
            <NavBar />

        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    screen: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 0,
    },
    header: {
        width: '100%',
        alignItems: 'center',
        marginBottom: 20,
    },
    title: {
        fontSize: 24,
        fontWeight: 'bold',
        textAlign: 'center',
        marginBottom: 10,
    },
    welcomeText: {
        fontSize: 18,
        textAlign: 'center',
        marginBottom: 10,
        color: '#613F75',
    },
    subtitle: {
        fontSize: 16,
        textAlign: 'center',
        marginBottom: 20,
    },
    button: {
        paddingVertical: 10,
        paddingHorizontal: 20,
        backgroundColor: '#613F75',
        borderRadius: 5,
        marginBottom: 60, // Pentru a lăsa spațiu pentru NavBar
    },
    buttonText: {
        fontSize: 16,
        color: '#fff',
        textAlign: 'center',
    },
    logoutButton: {
        paddingVertical: 8,
        paddingHorizontal: 15,
        backgroundColor: '#f44336',
        borderRadius: 4,
        marginTop: 10,
    },
    logoutButtonText: {
        fontSize: 14,
        color: '#fff',
        textAlign: 'center',
    },
});

export default HomePage;