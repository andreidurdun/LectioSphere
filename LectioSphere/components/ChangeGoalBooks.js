import React, { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Alert, SafeAreaView, TouchableNativeFeedback, ScrollView, Image, TextInput } from 'react-native';
import { ProgressBar } from 'react-native-paper';
import NavBar from './Partials/NavBar';
import TopBar from './Partials/TopBar';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import { useFonts, Nunito_400Regular, Nunito_500Medium, Nunito_600SemiBold } from '@expo-google-fonts/nunito';
import { refreshAccessToken } from './refreshAccessToken'; 

const ChangeGoalBooks = ({ route, navigation, page, removeAuthToken, isAuthenticated, apiBaseUrl }) => {
    const [userData, setUserData] = useState(null);
    const [active, setActive] = useState(page);

    const { lastGoalBooks, lastGoalPages } = route.params;

    const [newGoal, setNewGoal] = useState(lastGoalBooks?.toString() || '0');

    const handlePageClick = (page, params = {}) => {
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

            <View style={styles.header}>

                <View style={styles.container}>
                    <Text style={styles.messageText}>Set the number of books you would like to read this year:</Text>
                </View>

                <View style={styles.inputContainer}>
                    <TextInput
                        style={styles.input}
                        value={newGoal}
                        onChangeText={setNewGoal}
                        keyboardType="numeric"
                        placeholder="Enter your goal"
                        placeholderTextColor="#A79CA8"
                    />
                </View>

                <Text style={styles.changeText} onPress={() => handlePageClick('ChangeGoalBooks')}> Save </Text>
                        
            </View>

            <NavBar navigation={navigation} page="LibraryPage" />
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    screen: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 0,
        backgroundColor: '#FCF8FA',
    },
    header: {
        width: '100%',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 20,
        marginTop: 84,
    },
    container: {
        alignItems: 'center',
        width: '90%',
    },
    messageText: {
        textAlign: 'center',
        fontFamily: 'Nunito_500Medium',
        fontSize: 18,
        color: '#18101D',
        paddingHorizontal: 10,
    },
    changeText: {
        fontFamily: 'Nunito_500Medium',
        fontSize: 16,
        color: '#613F75',
        marginTop: 16,
    },
    inputContainer: {
        marginTop: 16,
        alignItems: 'center',
        width: '80%',
      },
    input: {
        width: '100%',
        padding: 12,
        borderColor: '#D8C2D5',
        borderWidth: 1,
        borderRadius: 8,
        fontSize: 18,
        fontFamily: 'Nunito_400Regular',
        backgroundColor: '#F7EDF1',
        color: '#18101D',
      },
    lastGoalNote: {
        marginTop: 8,
        fontSize: 14,
        color: '#613F75',
        fontFamily: 'Nunito_400Regular',
    },
});

export default ChangeGoalBooks;