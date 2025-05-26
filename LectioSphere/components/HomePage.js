import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, Alert, SafeAreaView, TouchableNativeFeedback, ScrollView } from 'react-native';
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
            const response = await axios.get(`${apiBaseUrl}/books/read/get/`, {
                headers: { Authorization: `JWT ${token}` }
            });
            // Filtrăm cărțile care au un `thumbnail` valid
            const booksWithThumbnail = response.data.filter(book => book.thumbnail);
            // Setăm primele 15 de cărți care au thumbnail
            setContinueReadingItems(booksWithThumbnail.data.slice(0, 15));
        } catch (error) {
            if (error.response?.status === 401) {
                const newToken = await refreshAccessToken(apiBaseUrl);
                if (newToken) {
                    const retryResponse = await axios.get(`${apiBaseUrl}/books/read/get/`, {
                        headers: { Authorization: `JWT ${newToken}` }
                    });
                    const booksWithThumbnail = retryResponse.data.filter(book => book.thumbnail);
                    setContinueReadingItems(booksWithThumbnail.data.slice(0, 15));
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
            const response = await axios.get(`${apiBaseUrl}/books/recommendation/`, {
                headers: { Authorization: `JWT ${token}` }
            });
            if (Array.isArray(response.data)) {
                const booksWithThumbnail = response.data.filter(book => book.thumbnail);
                setYouMayLikeItems(booksWithThumbnail.slice(0, 15));
            } else {
                setRead(false); 
            }
        } catch (error) {
            if (error.response?.status === 401) {
                const newToken = await refreshAccessToken(apiBaseUrl);
                if (newToken) {
                    const retryResponse = await axios.get(`${apiBaseUrl}/books/recommendation/`, {
                        headers: { Authorization: `JWT ${newToken}` }
                    });
                    if (Array.isArray(retryResponse.data)) {
                        const booksWithThumbnail = retryResponse.data.filter(book => book.thumbnail);
                        setYouMayLikeItems(booksWithThumbnail.slice(0, 15));
                    } else {
                        setRead(false); 
                    }
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
            const response = await axios.get(`${apiBaseUrl}/books/get_friends_books/`, {
                headers: { Authorization: `JWT ${token}` }
            });
            if (Array.isArray(response.data)) {
                const booksWithThumbnail = response.data.filter(book => book.thumbnail);
                setFriendsAreReadingItems(booksWithThumbnail.slice(0, 15));
            } else {
                setAreReading(false); 
            }
        } catch (error) {
            if (error.response?.status === 401) {
                const newToken = await refreshAccessToken(apiBaseUrl);
                if (newToken) {
                    const retryResponse = await axios.get(`${apiBaseUrl}/books/get_friends_books/`, {
                        headers: { Authorization: `JWT ${newToken}` }
                    });
                    if (Array.isArray(retryResponse.data)) {
                        const booksWithThumbnail = retryResponse.data.filter(book => book.thumbnail);
                        setFriendsAreReadingItems(booksWithThumbnail.slice(0, 15));
                    } else {
                        setAreReading(false); 
                    }
                } else {
                    console.error("Unable to refresh for reading items.");
                }
            } 
            else if (error.response?.status === HTTP_200_OK) {
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

    const handleBookPress = (book) => {
        navigation.navigate('BookShow', { 
            bookData: JSON.stringify(book)
        });
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

            <ScrollView contentContainerStyle={{ paddingBottom: 46 }}>

                <View style={styles.header}>

                    {
                        isReading ? (
                            <View style={styles.container}>
                                <TouchableNativeFeedback onPress={() => console.log("Apasat") /*TO DO: link catre raft*/}>
                                    <View>
                                        <Text style={styles.textContainer}> Continue Reading </Text>
                                    </View>
                                </TouchableNativeFeedback>
                                <ScrollView horizontal showsHorizontalScrollIndicator={false} style = {styles.containerImages}>
                                    {continueReadingItems.map((book, index) => (
                                        <TouchableNativeFeedback key={index} onPress={() => handleBookPress(book)}>
                                            <View>
                                                <Image
                                                    source={{ uri: book.thumbnail }}
                                                    style={styles.covers}
                                                />
                                            </View>
                                        </TouchableNativeFeedback>
                                    ))}
                                </ScrollView>
                            </View>
                        ) : null 
                    }

                    {
                        Read ? (
                            <View style={styles.container}>
                                <TouchableNativeFeedback onPress={() => handleCategoryClick('CategoryBooksPage', { category: 'Reccomendations'})}>
                                    <View>
                                        <Text style={styles.textContainer}> You May Like </Text>
                                    </View>
                                </TouchableNativeFeedback>
                                <ScrollView horizontal showsHorizontalScrollIndicator={false} style = {styles.containerImages}>
                                    {youMayLikeItems.map((book, index) => (
                                        <TouchableNativeFeedback key={index} onPress={() => handleBookPress(book)}>
                                            <View>
                                                <Image
                                                    source={{ uri: book.thumbnail }}
                                                    style={styles.covers}
                                                />
                                            </View>
                                        </TouchableNativeFeedback>
                                    ))}
                                </ScrollView>
                            </View>
                        ) : null 
                    }

                    {
                        ! Read ? (
                            <View style={styles.container}>
                                <Text style={styles.textContainer}>  You May Like </Text>
                                <Text style={styles.textAdvice}>   Start reading so you can get recommendations! </Text>
                            </View>
                        ) : null
                    }

                    {
                        areReading ? (
                            <View style={styles.container}>
                                <TouchableNativeFeedback onPress={() => handleCategoryClick('CategoryBooksPage', { category: 'Your friends are reading'})}>
                                    <View>
                                        <Text style={styles.textContainer}> Your friends are reading </Text>
                                    </View>
                                </TouchableNativeFeedback>
                                <ScrollView horizontal showsHorizontalScrollIndicator={false} style = {styles.containerImages}>
                                    {friendsAreReadingItems.map((book, index) => (
                                        <TouchableNativeFeedback key={index} onPress={() => handleBookPress(book)}>
                                            <View>
                                                <Image
                                                    source={{ uri: book.thumbnail }}
                                                    style={styles.covers}
                                                />
                                            </View>
                                        </TouchableNativeFeedback>
                                    ))}
                                </ScrollView>
                            </View>
                        ) : null
                    }

                    {
                        ! areReading ? (
                            <View style={styles.container}>
                                <Text style={styles.textContainer}>  Your friends are reading</Text>
                                <Text style={styles.textAdvice}>   Start following people to get inspired by their reads! </Text>
                            </View>
                        ) : null
                    }

                </View>
            
            </ScrollView>

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
    containerImages: {
        marginHorizontal: 12,
    },
    textAdvice: {
        fontFamily: 'Nunito_500Medium',
        color: '#613F75',
        fontSize: 16,
        marginHorizontal: 20,
    },
});

export default HomePage;