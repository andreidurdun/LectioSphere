import React, { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Alert, SafeAreaView, TouchableNativeFeedback } from 'react-native';
import NavBar from './Partials/NavBar';
import TopBar from './Partials/TopBar';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import { useFonts, Nunito_400Regular, Nunito_500Medium, Nunito_600SemiBold } from '@expo-google-fonts/nunito';
import { refreshAccessToken } from './refreshAccessToken'; 

const HomePage = ({ navigation, removeAuthToken, isAuthenticated, apiBaseUrl }) => {
    const [userData, setUserData] = useState(null);
    const [continueReadingItems, setContinueReadingItems] = useState([]);
    const [isReading, setIsReading] = useState(true);
    const [youMayLikeItems, setYouMayLikeItems] = useState([]);
    const [Read, setRead] = useState(true);
    const [friendsAreReadingItems, setFriendsAreReadingItems] = useState([]);
    const [areReading, setAreReading] = useState(true);


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

    const fetchContinueReading = async () => {
        try {
            let token = await AsyncStorage.getItem('auth_token');
            const response = await axios.get(`${apiBaseUrl}/api/books/read/get/`, {
                headers: { Authorization: `JWT ${token}` }
            });
            setContinueReadingItems(response.data);
        } catch (error) {
            if (error.response?.status === 401) {
                const newToken = await refreshAccessToken(apiBaseUrl);
                if (newToken) {
                    const retryResponse = await axios.get(`${apiBaseUrl}/api/books/read/get/`, {
                        headers: { Authorization: `JWT ${newToken}` }
                    });
                    setContinueReadingItems(retryResponse.data);
                } else {
                    console.error("Unable to refresh for reading items.");
                }
            } 
            else if (error.response?.status === 404) {
                setIsReading(false);
            }
            else {
                console.error("Continue Reading error:", error.message);
            }
        }
    };

    const fetchYouMayLike = async () => {
        try {
            let token = await AsyncStorage.getItem('auth_token');
            const response = await axios.get(`${apiBaseUrl}/api/books/recommendation/`, {
                headers: { Authorization: `JWT ${token}` }
            });
            setYouMayLikeItems(response.data);
        } catch (error) {
            if (error.response?.status === 401) {
                const newToken = await refreshAccessToken(apiBaseUrl);
                if (newToken) {
                    const retryResponse = await axios.get(`${apiBaseUrl}/api/books/recommendation/`, {
                        headers: { Authorization: `JWT ${newToken}` }
                    });
                    setYouMayLikeItems(retryResponse.data);
                } else {
                    console.error("Unable to refresh for reading items.");
                }
            } 
            else if (error.response?.status === 404) {
                setRead(false);
            }
            else {
                console.error("You May Like error:", error.message);
            }
        }
    };

    const fetchFriendsAreReading = async () => {
        try {
            let token = await AsyncStorage.getItem('auth_token');
            const response = await axios.get(`${apiBaseUrl}/api/books/get_friends_books/`, {
                headers: { Authorization: `JWT ${token}` }
            });
            setFriendsAreReadingItems(response.data);
        } catch (error) {
            if (error.response?.status === 401) {
                const newToken = await refreshAccessToken(apiBaseUrl);
                if (newToken) {
                    const retryResponse = await axios.get(`${apiBaseUrl}/api/books/get_friends_books/`, {
                        headers: { Authorization: `JWT ${newToken}` }
                    });
                    setFriendsAreReadingItems(retryResponse.data);
                } else {
                    console.error("Unable to refresh for reading items.");
                }
            } 
            else if (error.response?.status === 404) {
                setAreReading(false);
            }
            else {
                console.error("Friends are reading error:", error.message);
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
            fetchContinueReading();
            fetchYouMayLike();
            fetchFriendsAreReading();
        }
    }, [isAuthenticated]);

    if (!fontsLoaded) {
        return <Text>Loading fonts...</Text>;
    }

    

    return (
        <SafeAreaView style={styles.screen}>
            <TopBar pageName="HomePage" />

            <View style={styles.header}>
                {/* <TouchableNativeFeedback onPress={() => console.log("Apasat")}>
                    <View style={styles.container}>
                        <Text style={styles.textContainer}>Continue Reading</Text>
                        {continueReadingItems.map((item, index) => (
                            <Text key={index}>{item.titlu}</Text>
                        ))}
                    </View>
                </TouchableNativeFeedback> */}

                {
                    isReading ? (
                        <TouchableNativeFeedback onPress={() => console.log("Apasat")}>
                            <View style={styles.container}>
                                <Text style={styles.textContainer}> Continue Reading</Text>
                                {continueReadingItems.map((item, index) => (
                                    <Text key={index}>{item.titlu}</Text>
                                ))}
                            </View>
                        </TouchableNativeFeedback>
                    ) : null 
                }

                {
                    Read ? (
                        <TouchableNativeFeedback onPress={() => console.log("Apasat")}>
                            <View style={styles.container}>
                                <Text style={styles.textContainer}> You May Like</Text>
                            </View>
                        </TouchableNativeFeedback>
                    ) : null 
                }

                {
                    areReading ? (
                        <TouchableNativeFeedback onPress={() => console.log("Apasat")}>
                            <View style={styles.container}>
                                <Text style={styles.textContainer}> Your friends are reading</Text>
                            </View>
                        </TouchableNativeFeedback>
                    ) : null
                }

            </View>

            <NavBar navigation={navigation} page="HomePage" />
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
        fontWeight: '500',
        color: '#18101D',
        fontFamily: 'Nunito_600SemiBold',
    },
});

export default HomePage;