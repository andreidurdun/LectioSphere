import React, { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Alert, SafeAreaView, TouchableNativeFeedback, ScrollView, Image } from 'react-native';
import NavBar from './Partials/NavBar';
import TopBar from './Partials/TopBar';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import { useFonts, Nunito_400Regular, Nunito_500Medium, Nunito_600SemiBold } from '@expo-google-fonts/nunito';
import { refreshAccessToken } from './refreshAccessToken'; 

const LibraryPage = ({ navigation, page, removeAuthToken, isAuthenticated, apiBaseUrl }) => {
    const [userData, setUserData] = useState(null);
    const [active, setActive] = useState(page);

    const handleShelfClick = (page, params = {}) => {
        setActive(page);
        navigation.navigate(page, params); 
    };

    const [fontsLoaded] = useFonts({
        Nunito_400Regular,
        Nunito_500Medium,
        Nunito_600SemiBold
    });

    const fetchUserData = async () => {
        try {
            let token = await AsyncStorage.getItem('auth_token');
            const response = await axios.get(`${apiBaseUrl}/auth/users/me/`, {
                headers: { Authorization: `JWT ${token}` }
            });
            setUserData(response.data);
        } catch (error) {
            if (error.response?.status === 401) {
                const newToken = await refreshAccessToken(apiBaseUrl);
                if (newToken) {
                    const retryResponse = await axios.get(`${apiBaseUrl}/auth/users/me/`, {
                        headers: { Authorization: `JWT ${newToken}` }
                    });
                    setUserData(retryResponse.data);
                } else {
                    handleLogout();
                }
            } else {
                console.error("User fetch error:", error.message);
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
                        await removeAuthToken();
                        navigation.replace('LoginMenu');
                    }
                }
            ]
        );
    };
    
    useEffect(() => {
        if (isAuthenticated) {
            fetchUserData();
        }
    }, [isAuthenticated]);

    if (!fontsLoaded) {
        return <Text>Loading fonts...</Text>;
    }

    return (
        <SafeAreaView style={styles.screen}>
            <TopBar pageName="LibraryPage" />

            <ScrollView contentContainerStyle={{ paddingBottom: 46 }}>

                <View style={styles.header}>
                    <Text>Va urma!</Text>
                </View>

            </ScrollView>

            <NavBar navigation={navigation} page="LibraryPage" />
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
    header: {
        width: '100%',
        justifyContent: 'flex-start',
        alignItems: 'center',
        marginBottom: 20,
        marginTop: 84,
    },
    container: {
        backgroundColor: '#F7EDF1',
        borderColor: '#F3E3E9',
        borderWidth: 1,
        borderRadius: 8,
        paddingVertical: 10,
        width: '95%',
        marginTop: 16,
    },
    textContainer: {
        fontSize: 20,
        color: '#18101D',
        fontFamily: 'Nunito_600SemiBold',
        marginBottom: 8,
        marginHorizontal: 2,
    },
    covers: {
        height: 148,
        width: 98,
        borderRadius: 4,
        marginRight: 12,
    },
    categoryContainer: {
        backgroundColor: '#FCF8FA',
        alignItems: 'center',
        paddingVertical: 10,
        width: '95%',
        marginTop: 16,
    },
    textCategory: {
        fontFamily: 'Nunito_600SemiBold',
        fontSize: 20,
        color: '#18101D',
    },
    horizontalBar: {
        height: 2,
        width: 240,
        alignItems: 'center',
        backgroundColor: '#613F75', 
        marginTop: 4, 
      },
});

export default LibraryPage;