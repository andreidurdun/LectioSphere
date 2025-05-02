import React, { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Alert, Image, SafeAreaView } from 'react-native';
import NavBar from './Partials/NavBar';
import TopBar from './Partials/TopBar';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import { useFonts, Nunito_400Regular, Nunito_500Medium, Nunito_600SemiBold } from '@expo-google-fonts/nunito';
import { refreshAccessToken } from './refreshAccessToken'


const ProfilePage = ({ navigation, removeAuthToken, isAuthenticated, apiBaseUrl }) => {
    const [userData, setUserData] = useState(null);
    const [profileData, setProfileData] = useState(null);
    const [authToken, setAuthToken] = useState(null);
    const [refreshToken, setRefreshToken] = useState(null);

    const [fontsLoaded] = useFonts({
        Nunito_400Regular,
        Nunito_500Medium,
        Nunito_600SemiBold
    });
    
    
    
    const saveAuthToken = async (newToken, refreshToken) => {
        try {
            await AsyncStorage.setItem('auth_token', newToken);
            setAuthToken(`JWT ${newToken}`);
        } catch (error) {
            console.error("Error saving auth token:", error);
        }
    };

    const fetchUserData = async () => {
        try {
            const response = await axios.get(`${apiBaseUrl}/auth/users/me/`, {
                headers: { Authorization: authToken }
            });
            setUserData(response.data);
        } catch (error) {
            if (error.response?.status === 401) {
                try {
                    const response = await axios.post(`${apiBaseUrl}/auth/jwt/refresh/`, {
                        refresh: refreshToken
                    });
                    const newToken = response.data.access;
                    
                    saveAuthToken(newToken, refreshToken);
                    
                    const retryResponse = await axios.get(`${apiBaseUrl}/auth/users/me/`, {
                        headers: { Authorization: `JWT ${newToken}` }
                    });
                    setUserData(retryResponse.data);
                } catch (refreshError) {
                    console.error("Failed to refresh token:", refreshError);
                    handleLogout();
                }
            } else {
                console.error("User fetch error:", error.message);
            }
        }
    };

    const fetchProfileData = async () => {
        try {
            const response = await axios.get(`${apiBaseUrl}/api/accounts/profile/read`, {
                headers: { Authorization: authToken }
            });
            setProfileData(response.data);
        } catch (error) {
            if (error.response?.status === 401) {
                try {
                    const response = await axios.post(`${apiBaseUrl}/auth/jwt/refresh/`, {
                        refresh: refreshToken
                    });
                    const newToken = response.data.access;
                    
                    saveAuthToken(newToken, refreshToken);
                    
                    const retryResponse = await axios.get(`${apiBaseUrl}/api/profile/`, {
                        headers: { Authorization: `JWT ${newToken}` }
                    });
                    setProfileData(retryResponse.data);
                } catch (refreshError) {
                    console.error("Failed to refresh token:", refreshError);
                }
            } else {
                console.error("Profile fetch error:", error.message);
            }
        }
    };

    useEffect(() => {
        const getTokensAndFetchData = async () => {
            try {
                const storedAuthToken = await AsyncStorage.getItem('auth_token');
                const storedRefreshToken = await AsyncStorage.getItem('refresh_token');
                
                if (storedAuthToken && storedRefreshToken) {
                    setAuthToken(`JWT ${storedAuthToken}`);
                    setRefreshToken(storedRefreshToken);
                    
                    // Fetch data after tokens are set
                    fetchUserData();
                    fetchProfileData();
                }
            } catch (error) {
                console.error("Error retrieving tokens:", error);
            }
        };
        
        getTokensAndFetchData();
    }, []);


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
                        <Image 
                            source={
                                profileData?.profile_pic 
                                ? { uri: profileData.profile_pic } 
                                : require('../assets/humanPurple.png')
                            }
                            style={styles.profilePic}
                        />
                        <View style={styles.textInfo}>
                            <View style={styles.followersInfo}>
                                <Text style={styles.followers}>
                                    {profileData?.follower_count || 0} followers
                                </Text>
                                <Text style={styles.followers}>
                                    {profileData?.following_count || 0} following
                                </Text>
                            </View>
                            <View style={styles.nameInfo}>
                                <View style={styles.fullname}>
                                    <Text style={styles.nameText}>
                                        {userData?.first_name} {userData?.last_name}
                                    </Text>
                                </View>
                                <View style={styles.username}>
                                    <Text style={styles.usernameText}>
                                        @{userData?.username}
                                    </Text>
                                </View>
                                <TouchableOpacity onPress={handleLogout} style={styles.logoutButton}>
                                    <Text style={styles.logoutButtonText}>Logout</Text>
                                </TouchableOpacity>
                            </View>
                        </View>
                    </View>
                    <View style={styles.description}>
                        <Text style={styles.bioText}>
                            {profileData?.bio || "No bio available"}
                        </Text>
                    </View>
                </View>

                <View style={styles.selection}>
                    {/* Additional content like reading lists, shelves, etc. can be added here */}
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
        width: '95%',
    },
    profileCard: {
        width: '100%',
        minHeight: 200,
        backgroundColor: '#F3E3E9',
        borderRadius: 8,
        padding: 16,
        flexDirection: 'column',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
    },
    generalInfo: {
        flexDirection: 'row',
        marginBottom: 15,
    },
    description: {
        padding: 8,
        backgroundColor: 'rgba(255,255,255,0.5)',
        borderRadius: 6,
        marginTop: 5,
    },
    textInfo: {
        flex: 1,
        marginLeft: 15,
    },
    profilePic: {
        width: 80,
        height: 80,
        borderRadius: 40,
        borderWidth: 2,
        borderColor: '#613F75',
    },
    followersInfo: {
        flexDirection: 'row',
        justifyContent: 'flex-start',
        marginBottom: 8,
    },
    followers: {
        fontSize: 14,
        color: '#613F75',
        marginRight: 15,
        fontFamily: 'Nunito_500Medium',
    },
    nameInfo: {
        marginTop: 5,
    },
    fullname: {
        marginBottom: 3,
    },
    nameText: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#613F75',
        fontFamily: 'Nunito_600SemiBold',
    },
    username: {
        marginBottom: 8,
    },
    usernameText: {
        fontSize: 14,
        color: '#613F75',
        fontFamily: 'Nunito_400Regular',
    },
    bioText: {
        fontSize: 14,
        lineHeight: 20,
        color: '#613F75',
        fontFamily: 'Nunito_400Regular',
    },
    selection: {
        marginTop: 20,
    },
    logoutButton: {
        paddingVertical: 6,
        paddingHorizontal: 12,
        backgroundColor: '#f44336',
        borderRadius: 4,
        alignSelf: 'flex-start',
    },
    logoutButtonText: {
        fontSize: 12,
        color: '#fff',
        textAlign: 'center',
        fontFamily: 'Nunito_500Medium',
    },
});

export default ProfilePage;