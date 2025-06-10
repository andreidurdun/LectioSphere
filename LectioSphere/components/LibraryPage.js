import React, { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Alert, SafeAreaView, TouchableNativeFeedback, ScrollView, Image, FlatList } from 'react-native';
import { ProgressBar } from 'react-native-paper';
import NavBar from './Partials/NavBar';
import TopBar from './Partials/TopBar';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import { useFonts, Nunito_400Regular, Nunito_500Medium, Nunito_600SemiBold } from '@expo-google-fonts/nunito';
import { refreshAccessToken } from './refreshAccessToken'; 
import AllShelves from './AllShelves';

const calendarItem = require('../assets/calendarIcon.png');
const shelfItem = require('../assets/shelf.png');

const LibraryPage = ({ navigation, page, removeAuthToken, isAuthenticated, apiBaseUrl }) => {
    const [userData, setUserData] = useState(null);
    const [active, setActive] = useState(page);

    //BookChallenge
    const [currentBooks, setCurrentBooks] = useState(0);
    const [totalBooks, setTotalBooks] = useState(0);
    const [progressBooks, setProgressBooks] = useState(0);

    //PagesChallenge
    const [currentPages, setCurrentPages] = useState(0);
    const [totalPages, setTotalPages] = useState(0);
    const [progressPages, setProgressPages] = useState(0);

    //Shelves
    const [read, setRead] = useState([]); 
    const [reading, setReading] = useState([]); 
    const [readlist, setReadlist] = useState([]); 
    const [favourites, setFavourites] = useState([]); 
 


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

    const fetchReadingChallenge = async () => {
        try {
            let token = await AsyncStorage.getItem('auth_token');
            const response = await axios.get(`${apiBaseUrl}/library/reading_challenge/`, {
                headers: { Authorization: `JWT ${token}` }
            });
            const data = response.data;
            if (data.books_read > data.goal_books) {
                setTotalBooks(data.goal_books);
                setCurrentBooks(data.goal_books);
                setProgressBooks(100);
            }
            else {
                setCurrentBooks(data.books_read);
                setTotalBooks(data.goal_books);
                setProgressBooks(data.progress_books_percent);
            }
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
        } catch (error) {
            if (error.response?.status === 401) {
                const newToken = await refreshAccessToken(apiBaseUrl);
                if (newToken) {
                    const retryResponse = await axios.get(`${apiBaseUrl}/library/reading_challenge/`, {
                        headers: { Authorization: `JWT ${newToken}` }
                    });
                    const data = retryResponse.data;
                    if (data.books_read > data.goal_books) {
                        setTotalBooks(data.goal_books);
                        setCurrentBooks(totalBooks);
                        setProgressBooks(100);
                    }
                    else {
                        setCurrentBooks(data.books_read);
                        setTotalBooks(data.goal_books);
                        setProgressBooks(data.progress_books_percent);
                    }
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
                } else {
                    console.error(`Unable to refresh token for reading sheets items.`);
                }
            } else {
                console.error("Error fetching reading challenge:", error.message);
            }
        }
    };

    const fetchShelf = async (shelfName, setShelf, numberOfBooks) => {
        try {
            let token = await AsyncStorage.getItem('auth_token');
            const response = await axios.get(`${apiBaseUrl}/library/shelves/`, {
                headers: { Authorization: `JWT ${token}` }
            });
            const books = response.data.standard_shelves[shelfName];
            const normalizedBooks = books.slice(0, numberOfBooks);
            setShelf(normalizedBooks);
        } catch (error) {
            if (error.response?.status === 401) {
                const newToken = await refreshAccessToken(apiBaseUrl);
                if (newToken) {
                    const retryResponse = await axios.get(`${apiBaseUrl}/library/shelves/`, {
                        headers: { Authorization: `JWT ${newToken}` }
                    });
                    const books = retryResponse.data.standard_shelves[shelfName];
                    setShelf(books.slice(0, numberOfBooks));
                } else {
                    console.error(`Unable to refresh token for ${shelfName}.`);
                }
            } else {
                console.error(`Error loading ${shelfName}:`, error.message);
            }
        }
    };

    const fetchShelfReading = async (setShelf) => {
        try {
            let token = await AsyncStorage.getItem('auth_token');
            const response = await axios.get(`${apiBaseUrl}/books/currently_reading/get/`, {
                headers: { Authorization: `JWT ${token}` }
            });
            const books = response.data;
            const normalizedBooks = books.slice(0, 4);
            setShelf(normalizedBooks);
        } catch (error) {
            if (error.response?.status === 401) {
                const newToken = await refreshAccessToken(apiBaseUrl);
                if (newToken) {
                    const retryResponse = await axios.get(`${apiBaseUrl}/books/currently_reading/get/`, {
                        headers: { Authorization: `JWT ${newToken}` }
                    });
                    const books = retryResponse.data;
                    const normalizedBooks = books.slice(0, 4);
                    setShelf(normalizedBooks);
                } else {
                    console.error(`Unable to refresh token for shelf.`);
                }
            } else {
                console.error(`Error loading shelf:`, error.message);
            }
        }
    };

    const fetchShelfReadlist = async (setShelf) => {
        try {
            let token = await AsyncStorage.getItem('auth_token');
            const response = await axios.get(`${apiBaseUrl}/books/read_list/get/`, {
                headers: { Authorization: `JWT ${token}` }
            });
            const books = response.data;
            const normalizedBooks = books.slice(0, 4);
            setShelf(normalizedBooks);
        } catch (error) {
            if (error.response?.status === 401) {
                const newToken = await refreshAccessToken(apiBaseUrl);
                if (newToken) {
                    const retryResponse = await axios.get(`${apiBaseUrl}/books/read_list/get/`, {
                        headers: { Authorization: `JWT ${newToken}` }
                    });
                    const books = retryResponse.data;
                    const normalizedBooks = books.slice(0, 4);
                    setShelf(normalizedBooks);
                } else {
                    console.error(`Unable to refresh token for shelf.`);
                }
            } else {
                console.error(`Error loading shelf:`, error.message);
            }
        }
    };

    const [loading, setLoading] = useState(true);

    const fetchData = async () => {
        setLoading(true);
        await fetchUserData();
        await fetchReadingChallenge();
        await fetchShelf("Read", setRead, 6);
        await fetchShelfReading(setReading);
        await fetchShelfReadlist(setReadlist);
        await fetchShelf("Favourites", setFavourites, 4);
        setLoading(false);
    };

    useEffect(() => {
        if (isAuthenticated) {
            fetchData();
        }
    }, [isAuthenticated]);
      
      
    if (loading) {
        return <Text>Loading data...</Text>;
    }
    
    // useEffect(() => {
    //     if (isAuthenticated) {
    //         fetchUserData();
    //         fetchReadingChallenge();
    //         fetchShelf("Read", setRead, 6);
    //         fetchShelf("Reading", setReading, 4);
    //         fetchShelf("Readlist", setReadlist, 4);
    //         fetchShelf("Favourites", setFavourites, 4);
    //     }
    // }, [isAuthenticated]);

    if (!fontsLoaded) {
        return <Text>Loading fonts...</Text>;
    }

    return (
        <SafeAreaView style={styles.screen}>
            <TopBar pageName="LibraryPage" />

            <ScrollView contentContainerStyle={{ paddingBottom: 46 }} showsVerticalScrollIndicator={false}>

                <View style={styles.header}>
                    <View style={styles.container}>
                        <Text style={styles.textTitleChallenges}> Reading Challenges </Text>
                        <View style={styles.challengeContainer}>
                            <View style={{ width: '47.5%' }}>
                                <TouchableNativeFeedback onPress={() => handleShelfClick('BooksChallenge')}>
                                    <View style={styles.challengeBooks}>
                                        <Text style={styles.textChallenge}>Number of Books </Text>
                                        {/* <View style={styles.counterBox}>
                                            <Text style={styles.currentB}>{currentBooks}</Text>
                                            <Text style={styles.separator}>/</Text>
                                            <Text style={styles.totalB}>{totalBooks}</Text>
                                        </View> */}
                                        <View style={styles.counterBoxPages}>
                                            <View style={styles.numbersPages}>
                                                <Text style={styles.currentB}>{currentBooks}</Text>
                                                <Text style={styles.separator}> /</Text>
                                            </View>
                                            <Text style={styles.totalB}>{totalBooks}</Text>
                                        </View>
                                        <View style={styles.progressContainer}>
                                            <ProgressBar progress={progressBooks} color="#613F75" style={styles.progressBarChallenge} />
                                            <Text style={styles.percentage}>{Math.round(progressBooks)}%</Text>
                                        </View>
                                    </View>
                                </TouchableNativeFeedback>
                            </View>
                            <View style={styles.verticalBar} />
                            <View style={{ width: '47.5%' }}>
                                <TouchableNativeFeedback onPress={() => handleShelfClick('PagesChallenge')}>
                                    <View style={styles.challengePages}>
                                        <Text style={styles.textChallenge}>  Number of Pages </Text>
                                        <View style={styles.counterBoxPages}>
                                            <View style={styles.numbersPages}>
                                                <Text style={styles.currentB}>{currentPages}</Text>
                                                <Text style={styles.separator}> /</Text>
                                            </View>
                                            <Text style={styles.totalB}>{totalPages}</Text>
                                        </View>
                                        <View style={styles.progressContainer}>
                                            <ProgressBar progress={progressPages} color="#613F75" style={styles.progressBarChallenge} />
                                            <Text style={styles.percentage}>{Math.round(progressPages)}%</Text>
                                        </View>
                                    </View>
                                </TouchableNativeFeedback>
                            </View>
                        </View>
                    </View>

                    <View style={styles.shelvesTitleContainer}>
                        <Image
                            source={shelfItem}
                            style={{ width: 80, height: 80 }}
                        />
                        <View style={styles.categoryContainer}>
                            <Text style={styles.textCategory}> Shelves </Text>
                            <View style={styles.horizontalBar} />
                        </View>
                    </View>

                    <View style={styles.shelvesContainer}>
                        <TouchableNativeFeedback onPress={() => handleShelfClick('ShelfPage', { shelfName: 'Read'})}>
                            <View style={styles.shelf}>
                                {read[0] && read[1] ? (
                                    <Image source={{ uri: read[0].cover }} style={styles.coversBig} />
                                ) : (
                                    <View style={styles.coversBig} />
                                )}
                                {read[2] && read[3] ? (
                                    <Image source={{ uri: read[2].cover }} style={styles.coversMedium} />
                                ): (
                                    <View style={styles.coversMedium} />
                                )}
                                {read[4] && read[5] ? (
                                    <Image source={{ uri: read[4].cover }} style={styles.coversSmall} />
                                ): (
                                    <View style={styles.coversSmall} />
                                )}
                                <Text style={styles.textShelf}>Read</Text>
                                {read[5] ? (
                                    <Image source={{ uri: read[5].cover }} style={styles.coversSmall} />
                                ): (
                                    <View style={styles.coversSmall} />
                                )}
                                {read[3] ? (
                                    <Image source={{ uri: read[3].cover }} style={styles.coversMedium} />
                                ): (
                                    <View style={styles.coversMedium} />
                                )}
                                {read[1] ? (
                                    <Image source={{ uri: read[1].cover }} style={styles.coversBig} />
                                ): (
                                    <View style={styles.coversBig} />
                                )}
                            </View>
                        </TouchableNativeFeedback>
                        <View style={styles.shelfBar} />
                        <TouchableNativeFeedback onPress={() => handleShelfClick('ShelfPage', { shelfName: 'Reading'})}>
                            <View style={styles.shelf}>
                                {reading[0] && reading[1] ? (
                                    <Image source={{ uri: reading[0].cover }} style={styles.coversBig} />
                                ) : (
                                    <View style={styles.coversBig} />
                                )}
                                {reading[2] && reading[3] ? (
                                    <Image source={{ uri: reading[2].cover }} style={styles.coversMedium} />
                                ): (
                                    <View style={styles.coversMedium} />
                                )}
                                <Text style={styles.textShelf}>Reading</Text>
                                {reading[3] ? (
                                    <Image source={{ uri: reading[3].cover }} style={styles.coversMedium} />
                                ): (
                                    <View style={styles.coversMedium} />
                                )}
                                {reading[1] ? (
                                    <Image source={{ uri: reading[1].cover }} style={styles.coversBig} />
                                ): (
                                    <View style={styles.coversBig} />
                                )}
                            </View>
                        </TouchableNativeFeedback>
                        <View style={styles.shelfBar} />
                        <TouchableNativeFeedback onPress={() => handleShelfClick('ShelfPage', { shelfName: 'Readlist'})}>
                            <View style={styles.shelf}>
                                {readlist[0] && readlist[1] ? (
                                    <Image source={{ uri: readlist[0].cover }} style={styles.coversBig} />
                                ): (
                                    <View style={styles.coversBig} />
                                )}
                                {readlist[2] && readlist[3] ? (
                                    <Image source={{ uri: readlist[2].cover }} style={styles.coversMedium} />
                                ): (
                                    <View style={styles.coversMedium} />
                                )}
                                <Text style={styles.textShelf}>Readlist</Text>
                                {readlist[3] ? (
                                    <Image source={{ uri: readlist[3].cover }} style={styles.coversMedium} />
                                ): (
                                    <View style={styles.coversMedium} />
                                )}
                                {readlist[1] ? (
                                    <Image source={{ uri: readlist[1].cover }} style={styles.coversBig} />
                                ): (
                                    <View style={styles.coversBig} />
                                )}
                            </View>
                        </TouchableNativeFeedback>
                        <View style={styles.shelfBar} />
                        <TouchableNativeFeedback onPress={() => handleShelfClick('AllShelves')}>
                            <View style={styles.sheet}>
                                <Text style={styles.textShelfMore}>See More</Text>
                            </View>
                        </TouchableNativeFeedback>
                    </View>
                        


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
    currentB: {
        fontSize: 26,
        fontFamily: 'Nunito_600SemiBold',
        color: '#18101D',
    },
    separator: {
        fontSize: 32,
        marginHorizontal: 5,
        color: '#18101D',
    },
    totalB: {
        fontSize: 26,
        fontFamily: 'Nunito_600SemiBold',
        color: '#613F75',
    },
    progressBarChallenge: {
        width: 90,
        height: 8,
        backgroundColor: '#E5C3D1',
        borderRadius: 5,
        //marginLeft: 10,
        //marginRight: 60.5,
    },
    progressContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        alignSelf: 'center',
        //width: '100%',
    },
    challengePages: {
        alignItems: 'center',
        justifyContent: 'center',
        width: '100%',
        flex: 1,
    },
    counterBoxPages: {
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 1,
        borderColor: '#E5C3D1',
        borderRadius: 10,
        paddingBottom: 10,
        paddingTop: 10,
        paddingHorizontal: 10,
        marginBottom: 10,
        marginTop: 8,
        //marginLeft: 8,
        width: '85%',
        height: 90,
    },
    verticalBar: {
        width: 1,
        alignItems: 'center',
        backgroundColor: '#E5C3D1', 
        height: 150,
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
    categoryContainer: {
        backgroundColor: '#FCF8FA',
        alignItems: 'center',
        paddingVertical: 10,
        marginTop: 16,
        marginLeft: 24,
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
        width: 240,
        alignItems: 'center',
        backgroundColor: '#613F75', 
        marginTop: 4, 
      },
    shelvesContainer: {
        width: '95%',
        backgroundColor: '#F7EDF1',
        borderColor: '#F3E3E9',
        borderWidth: 1,
        borderRadius: 8,
        paddingVertical: 10,
        marginTop: 16,
        marginHorizontal: 16,
        alignItems: 'center',
    },
    shelf: {
        flexDirection: 'row',
        height: 106,
        justifyContent: 'center',
        alignItems: 'center',
    },
    textShelf: {
        fontFamily: 'Nunito_500Medium',
        fontSize: 28,
        color: '#18101D',
    },
    shelfBar: {
        height: 2,
        width: '90%',
        alignItems: 'center',
        backgroundColor: '#E5C3D1', 
        marginTop: 4,
    },
    coversBig: {
        height: 60,
        width: 40,
        borderRadius: 4,
        marginRight: 6,
        marginLeft: 6,
    },
    coversMedium: {
        height: 42,
        width: 28,
        borderRadius: 4,
        marginRight: 6,
        marginLeft: 6,
    },
    coversSmall: {
        height: 30,
        width: 18,
        borderRadius: 4,
        marginRight: 6,
        marginLeft: 6,
    },
    textShelfMore: {
        fontFamily: 'Nunito_500Medium',
        fontSize: 28,
        color: '#E5C3D1',
    },
    sheet: {
        height: 88,
        justifyContent: 'center',
    },
    coverSheetsContainer: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    coversSheets: {
        height: 60,
        width: 40,
        borderRadius: 4,
        marginRight: 12,
    },
    textInfoTitle: {
        flexWrap: 'wrap', 
        fontFamily: 'Nunito_600SemiBold',
        color: '#18101D',
        fontSize: 18,
    },
    textInfoAuthor: {
        flexWrap: 'wrap', 
        fontFamily: 'Nunito_500Medium',
        color: '#613F75',
        fontSize: 16,
    },
    numbersPages: {
        flexDirection: 'row',
        alignItems: 'center',
    },
});

export default LibraryPage;