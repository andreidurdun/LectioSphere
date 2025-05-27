import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, Alert, SafeAreaView, TextInput } from 'react-native';
import NavBar from './Partials/NavBar';
import TopBar from './Partials/TopBar';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import { useFonts, Nunito_400Regular, Nunito_500Medium, Nunito_600SemiBold } from '@expo-google-fonts/nunito';
import { refreshAccessToken } from './refreshAccessToken'; 

const ChangeGoalPages = ({ route, navigation, page, removeAuthToken, isAuthenticated, apiBaseUrl }) => {
    const [userData, setUserData] = useState(null);
    const [active, setActive] = useState(page);

    const { lastGoalPages } = route.params;

    const [newGoal, setNewGoal] = useState(lastGoalPages?.toString());

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

    const updateReadingGoal = async (goal_books, goal_pages, apiBaseUrl) => {
        try {
            const token = await AsyncStorage.getItem('auth_token');
            const data = {};

            if (goal_books !== null) {
                data.goal_books = goal_books;
            }
            if (goal_pages !== null) {
                data.goal_pages = goal_pages;
            }
        
            const response = await axios.post(`${apiBaseUrl}/api/library/update_reading_goals/`, data, {
                headers: { Authorization: `JWT ${token}` }
            });
        
            console.log('Updated:', response.data);
        } catch (error) {
            if (error.response?.status === 401) {
                const newToken = await refreshAccessToken(apiBaseUrl);
                if (newToken) {
                    const data = {};

                    if (goal_books !== null) {
                        data.goal_books = goal_books;
                    }
                    if (goal_pages !== null) {
                        data.goal_pages = goal_pages;
                    }
                
                    const response = await axios.post(`${apiBaseUrl}/api/library/update_reading_goals/`, data, {
                        headers: { Authorization: `JWT ${token}` }
                    });
                
                    console.log('Updated:', response.data);
                } else {
                    console.error("Error fetching reading challenge:", error.message);
                }
            } else {
                console.error('Error updating reading goal:', error.response?.data || error.message);
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
                    <Text style={styles.messageText}>Set the number of pages you would like to read this year:</Text>
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

                <Text
                    style={styles.changeText}
                    onPress={() => {
                        const parsedGoal = parseInt(newGoal);
                        if (isNaN(parsedGoal)) {
                        Alert.alert('Invalid input', 'Please enter a valid number.');
                        return;
                        }

                        updateReadingGoal(null, parsedGoal, apiBaseUrl);
                        Alert.alert('Success', 'Your reading goal has been updated!');
                        handlePageClick('LibraryPage'); 
                    }}
                    >
                    Save
                </Text>
                        
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

export default ChangeGoalPages;