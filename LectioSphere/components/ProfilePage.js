import React, { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Alert, Image, SafeAreaView } from 'react-native';
import NavBar from './Partials/NavBar';
import TopBar from './Partials/TopBar';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import { refreshAccessToken } from './refreshAccessToken'


const ProfilePage = ({ navigation, removeAuthToken, isAuthenticated, apiBaseUrl }) => {
    const [userData, setUserData] = useState(null);

    useEffect(() => {
        // Verificăm dacă utilizatorul este autentificat și încărcăm datele profilului
        if (isAuthenticated) {
            fetchUserData();
        }
    }, [isAuthenticated]);

    const fetchUserData = async () => {
        try {
            let token = await AsyncStorage.getItem('auth_token');
            if (!token) {
                console.log('No token found, attempting to refresh token');
                const refreshedToken = await refreshAccessToken();
                if (!refreshedToken) {
                    console.log('Failed to refresh token');
                    return;
                }
                token = refreshedToken;
            }

            const response = await axios.get(`${apiBaseUrl}/auth/users/me/`, {
                headers: {
                    'Authorization': `JWT ${token}`
                }
            });

            if (response.status === 200) {
                setUserData(response.data);
                console.log(userData)
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
            <TopBar pageName="ProfilePage" />

            <View style={styles.body}>
                <View style={styles.profileCard}>
                    <View style={styles.generalInfo}>
                        <Image>

                        </Image>
                        <View style={styles.textInfo}>
                            <View style={styles.followersInfo}>
                                <Text style={styles.followers}>followers</Text>
                                <Text style={styles.followers}>following</Text>
                            </View>
                            <View style={styles.nameInfo}>
                                <View style={styles.fullname}>

                                </View>
                                <View style={styles.username}>

                                </View>
                                <Image>

                                </Image>
                            </View>

                            
                        </View>
                    </View>
                    <View style={styles.description}>

                    </View>
                    

                </View>

                <View style={styles.selection}>

                </View>


            </View>

            <NavBar navigation={navigation} page="ProfilePage" />
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    screen: {
        flex: 1,
        justifyContent: 'flex-start',
        alignItems: 'center',
        padding: 0,
        backgroundColor: '#FCF8FA',
    },
    body: {
        marginTop: 100,
        marginLeft: 6,
        marginRight: 6,
    },
    profileCard: {
        width: '100%',
        height: 200,
        backgroundColor: '#F3E3E9',
        borderRadius: 8,
        padding: 12,
        flexDirection: 'column',
    },
    generalInfo: {
        flexDirection: 'row'
    },
    description: {

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

export default ProfilePage;