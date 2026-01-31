import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, StyleSheet, Alert, SafeAreaView, TouchableNativeFeedback, ScrollView, Image, FlatList, TouchableWithoutFeedback } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import NavBar from './Partials/NavBar';
import TopBar from './Partials/TopBar';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import { useFonts, Nunito_400Regular, Nunito_500Medium, Nunito_600SemiBold } from '@expo-google-fonts/nunito';
import { refreshAccessToken } from './refreshAccessToken'; 

const AllReadingSheetsPage = ({ navigation, page, removeAuthToken, isAuthenticated, apiBaseUrl }) => {
    const [userData, setUserData] = useState(null);
    const [active, setActive] = useState(page);

    //Reading Sheets
    const [readingSheets, setReadingSheets] = useState([]);

    const handleClick = (page, params = {}) => {
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

    const fetchReadingSheets = async () => {
        try {
            let token = await AsyncStorage.getItem('auth_token');
            const response = await axios.get(`${apiBaseUrl}/reading-sheets/`, {
                headers: { Authorization: `JWT ${token}` }
            });
            const allSheets = Object.values(response.data).flat();
            if (Array.isArray(allSheets)) {
                setReadingSheets(allSheets);
            } else {
                setReadingSheets([]);
                console.warn("Reading sheets response is not an array.");
            }
        } catch (error) {
            if (error.response?.status === 401) {
                const newToken = await refreshAccessToken(apiBaseUrl);
                if (newToken) {
                    const retryResponse = await axios.get(`${apiBaseUrl}/reading-sheets/`, {
                        headers: { Authorization: `JWT ${newToken}` }
                    });
                    const allSheets = Object.values(retryResponse.data).flat();
                    if (Array.isArray(allSheets)) {
                        setReadingSheets(allSheets);
                    } else {
                        setReadingSheets([]);
                        console.warn("Reading sheets retry response is not an array.");
                    }
                } else {
                    console.error("Unable to refresh for reading sheets.");
                }
            } 
            else {
                console.error("Reading Sheets error:", error.message);
            }
        }
    };

    const handleReadingSheetPress = (sheet) => {
        navigation.navigate('ReadingSheetPage', { sheet });
    };

    const [loading, setLoading] = useState(true);

    const fetchData = async () => {
        setLoading(true);
        await fetchUserData();
        await fetchReadingSheets();
        setLoading(false);
    };

    useFocusEffect(
        useCallback(() => {
            if (isAuthenticated) {
                fetchData();
            }
        }, [isAuthenticated])
    );
      
      
    if (loading) {
        return <Text>Loading data...</Text>;
    }

    if (!fontsLoaded) {
        return <Text>Loading fonts...</Text>;
    }

    return (
        <SafeAreaView style={styles.screen}>
            <TopBar pageName="LibraryPage" />
            
            <ScrollView 
                contentContainerStyle={{ paddingBottom: 65, paddingTop: 10 }} 
                showsVerticalScrollIndicator={false}
                style={{ width: '100%' }}
            >
                <View style={styles.header}>
                    <View style={styles.categoryContainer}>
                        <Text style={styles.textCategory}> Reading Sheets </Text>
                        <View style={styles.horizontalBar} />
                    </View>

                    {readingSheets.length === 0 ? (
                        <View style={styles.noBooksContainer}>
                            <Text style={styles.noBooksText}>No reading sheets yet</Text>
                        </View>
                    ) : (
                        <View style={{ width: '100%', alignItems: 'center' }}>
                            {readingSheets.map((readingSheet, index) => (
                                <TouchableNativeFeedback key={index} onPress={() => handleReadingSheetPress(readingSheet)}>
                                    <View style={styles.sheetContainer} accessibilityLabel={`allReadingSheet-${index}`}>
                                        <Image
                                            accessibilityLabel={`allReadingSheet-image-${index}`}
                                            source={{ uri: readingSheet.book.cover }}
                                            style={styles.covers}
                                        />
                                        <View style={styles.infoBookReadingSheet}>
                                            <Text accessibilityLabel={`allReadingSheet-title-${index}`} style={styles.textInfoTitle}>
                                                {readingSheet.book.title}
                                            </Text>
                                            <Text accessibilityLabel={`allReadingSheet-author-${index}`} style={styles.textInfoAuthor}>
                                                {readingSheet.book.author}
                                            </Text>
                                        </View>
                                    </View>
                                </TouchableNativeFeedback>
                            ))}
                        </View>
                    )}
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
        minWidth: '95%',
        backgroundColor: '#F7EDF1',
        borderColor: '#F3E3E9',
        borderWidth: 1,
        borderRadius: 8,
        paddingVertical: 10,
        marginTop: 16,
        marginHorizontal: 16,
        alignItems: 'center',
    },
    textTitleChallenges: {
        color: '#613F75', 
        fontSize: 20,
        fontFamily: 'Nunito_600SemiBold',
    },
    challengeContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
    },
    challengeBooks: {
        alignItems: 'center',
        justifyContent: 'center',
        width: '100%',
        flex: 1,
    },
    counterBox: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 1,
        borderColor: '#E5C3D1',
        borderRadius: 10,
        paddingVertical: 10,
        paddingHorizontal: 10,
        marginBottom: 10,
        marginTop: 8,
        marginRight: 8,
        height: 88,
    },
    textChallenge: {
        color: '#18101D', 
        fontSize: 16,
        fontFamily: 'Nunito_400Regular',
        textAlign: 'center',
    },
    percentage: {
        fontSize: 16,
        color: '#18101D',
        fontFamily: 'Nunito_400Regular',
    },
    textContainer: {
        fontSize: 20,
        color: '#18101D',
        fontFamily: 'Nunito_600SemiBold',
        marginBottom: 8,
        marginHorizontal: 2,
    },
    shelvesTitleContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        marginTop: 16,
        width: '90%',
    },
    readingSheetsTitleContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        marginTop: 16,
        width: '90%',
    },
    categoryContainer: {
        backgroundColor: '#FCF8FA',
        alignItems: 'center',
        paddingVertical: 10,
        marginTop: 16,
        paddingBottom: 8,
        height: 62,
    },
    textCategory: {
        fontFamily: 'Nunito_600SemiBold',
        fontSize: 24,
        color: '#18101D',
    },
    horizontalBar: {
        height: 2,
        width: 220,
        alignItems: 'center',
        backgroundColor: '#613F75', 
        marginTop: 4, 
      },
    sheetContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 10,
        backgroundColor: '#F7EDF1',
        borderColor: '#F3E3E9',
        borderWidth: 1,
        borderRadius: 8,
        paddingVertical: 10,
        marginTop: 16,
        width: '95%',
    },
    covers: {
        height: 80,
        width: 56,
        borderRadius: 4,
        marginRight: 12,
    },
    textInfoTitle: {
        flexWrap: 'wrap', 
        fontFamily: 'Nunito_600SemiBold',
        color: '#613F75',
        fontSize: 18,
    },
    textInfoAuthor: {
        flexWrap: 'wrap', 
        fontFamily: 'Nunito_500Medium',
        color: '#18101D',
    },
    infoBookReadingSheet: {
        flexDirection: 'column',
        flex: 1,
    },
    noBooksContainer: {
        marginTop: 50,
        alignItems: 'center',
    },
    noBooksText: {
        fontFamily: 'Nunito_500Medium',
        color: '#613F75',
        fontSize: 20, 
        textAlign: 'center',
    },
});

export default AllReadingSheetsPage;