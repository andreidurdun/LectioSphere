import React, { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Alert, SafeAreaView, TouchableNativeFeedback, ScrollView, Image, FlatList } from 'react-native';
import { ProgressBar } from 'react-native-paper';
import NavBar from './Partials/NavBar';
import TopBar from './Partials/TopBar';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import { useFonts, Nunito_400Regular, Nunito_500Medium, Nunito_600SemiBold } from '@expo-google-fonts/nunito';
import { refreshAccessToken } from './refreshAccessToken'; 

const PagesChallenge = ({ navigation, page, removeAuthToken, isAuthenticated, apiBaseUrl }) => {
    const [userData, setUserData] = useState(null);
    const [active, setActive] = useState(page);

    const [currentPages, setCurrentPages] = useState(0);
    const [totalPages, setTotalPages] = useState(0);
    const [progressPages, setProgressPages] = useState(0);

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

    const fetchBooksChallenge = async () => {
        try {
            let token = await AsyncStorage.getItem('auth_token');
            const response = await axios.get(`${apiBaseUrl}/library/reading_challenge/`, {
                headers: { Authorization: `JWT ${token}` }
            });
            const data = response.data;
            if (data.pages_read > data.goal_pages) {
                setTotalPages(data.goal_pages);
                setCurrentPages(totalPages);
                setProgressPages(100);
            }
            else {
                setCurrentPages(data.pages_read);
                setTotalPages(data.goal_pages);
                setProgressPages(data.progress_pages_percent);
            }
        } catch (error) {
            if (error.response?.status === 401) {
                const newToken = await refreshAccessToken(apiBaseUrl);
                if (newToken) {
                    const retryResponse = await axios.get(`${apiBaseUrl}/library/reading_challenge/`, {
                        headers: { Authorization: `JWT ${newToken}` }
                    });
                    const data = retryResponse.data;
                    if (data.pages_read > data.goal_pages) {
                        setTotalPages(data.goal_pages);
                        setCurrentPages(data.goal_pages);
                        setProgressPages(100);
                    }
                    else {
                        setCurrentPages(data.pages_read);
                        setTotalPages(data.goal_pages);
                        setProgressPages(data.progress_pages_percent);
                    }
                } else {
                    console.error(`Unable to refresh token for reading challenge items.`);
                }
            } else {
                console.error("Error fetching reading challenge:", error.message);
            }
        }
    };

    const getDaysUntilEndOfYear = () => {
        const today = new Date();
        const endOfYear = new Date(today.getFullYear(), 11, 31); // 11 = decembrie
        const diffTime = endOfYear - today;
        const leftDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        return leftDays;
    };

    const leftDays = getDaysUntilEndOfYear();

    
    useEffect(() => {
        if (isAuthenticated) {
            fetchUserData();
            fetchBooksChallenge();
        }
    }, [isAuthenticated]);

    if (!fontsLoaded) {
        return <Text>Loading fonts...</Text>;
    }

    return (
        <SafeAreaView style={styles.screen}>
            <TopBar pageName="LibraryPage" />

            <ScrollView contentContainerStyle={{ paddingBottom: 46 }} showsVerticalScrollIndicator={false}>

                <View style={styles.header}>
                    <View style={styles.categoryContainer}>
                        <Text style={styles.textCategory}> Number of Pages </Text>
                        <Text style={styles.textCategory}> Challenge </Text>
                        <View style={styles.horizontalBar} />
                    </View>

                    <View style={styles.container}>
                        <Text style={styles.messageText}>   You have read <Text style={styles.numberText}>{currentPages}</Text> out of <Text style={styles.numberText}>{totalPages}</Text> pages</Text> 
                        { progressPages < 100 ? (
                            <View style={styles.daysLeftContainer}>
                                <Text style={styles.daysLeftText}> {leftDays} days left to complete </Text>
                                <Text style={styles.daysLeftMessageText}> You can do it! </Text>
                            </View>
                        ) : (
                            <View style={styles.daysLeftContainer}>
                                <Text style={styles.daysLeftMessageText}> You did it! Congrats! </Text>
                            </View>
                        )
                        }
                        <View style={styles.progressContainer}>
                            <ProgressBar progress={progressPages} color="#613F75" style={styles.progressBarChallenge} />
                            <Text style={styles.percentage}> {progressPages}%</Text>
                        </View>
                    </View>

                    <Text style={styles.changeText} onPress={() => handlePageClick('ChangeGoalPages')}> Change goal </Text>      

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
        width: '95%',
        backgroundColor: '#F7EDF1',
        borderColor: '#F3E3E9',
        borderWidth: 1,
        borderRadius: 8,
        paddingVertical: 10,
        marginTop: 16,
        minWidth: '95%',
    },
    textContainer: {
        fontSize: 20,
        color: '#18101D',
        fontFamily: 'Nunito_600SemiBold',
        marginBottom: 8,
        marginHorizontal: 2,
    },
    categoryContainer: {
        backgroundColor: '#FCF8FA',
        alignItems: 'center',
        paddingVertical: 10,
        marginTop: 16,
        paddingBottom: 8,
        height: 86,
    },
    textCategory: {
        fontFamily: 'Nunito_600SemiBold',
        fontSize: 24,
        color: '#18101D',
    },
    horizontalBar: {
        height: 2,
        width: 280,
        alignItems: 'center',
        backgroundColor: '#613F75', 
        marginTop: 4, 
      },
    shelf: {
        height: 106,
        justifyContent: 'center',
    },
    textShelf: {
        fontFamily: 'Nunito_500Medium',
        fontSize: 32,
        color: '#18101D',
    },
    progressBarChallenge: {
        height: 8,
        backgroundColor: '#E5C3D1',
        borderRadius: 5,
        width: 200,
    },
    progressContainer: {
        marginTop: 10,
        width: '100%',
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        alignSelf: 'center',
    },
    percentage: {
        fontSize: 16,
        color: '#18101D',
        fontFamily: 'Nunito_400Regular',
    },
    messageText: {
        fontFamily: 'Nunito_500Medium',
        fontSize: 18,
        color: '#18101D',
        paddingHorizontal: 10,
    },
    numberText: {
        fontFamily: 'Nunito_600SemiBold',
        fontSize: 20,
        color: '#613F75',
    },
    daysLeftContainer: {
        alignItems: 'center',
    },
    daysLeftText: {
        marginTop: 5,
        fontFamily: 'Nunito_400Regular',
        fontSize: 14,
        color: '#18101D',
    },
    daysLeftMessageText: {
        fontFamily: 'Nunito_500Medium',
        fontSize: 14,
        color: '#613F75',
    },
    changeText: {
        fontFamily: 'Nunito_500Medium',
        fontSize: 16,
        color: '#613F75',
        marginTop: 16,
    },
    booksReadText: {
        fontFamily: 'Nunito_600SemiBold',
        fontSize: 20,
        color: '#18101D',
        marginTop: 16,
    },
});

export default PagesChallenge;