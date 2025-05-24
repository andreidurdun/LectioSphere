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
const readingSheetsItem = require('../assets/readingSheets.png');

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

    //ReadingSheets
    const [sheets, setSheets] = useState([]); 


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
            setCurrentBooks(data.books_read);
            setTotalBooks(data.goal_books);
            setProgressBooks(data.progress_books_percent);
            setCurrentPages(data.pages_read);
            setTotalPages(data.goal_pages);
            setProgressPages(data.progress_pages_percent);
        } catch (error) {
            if (error.response?.status === 401) {
                const newToken = await refreshAccessToken(apiBaseUrl);
                if (newToken) {
                    const retryResponse = await axios.get(`${apiBaseUrl}/library/reading_challenge/`, {
                        headers: { Authorization: `JWT ${newToken}` }
                    });
                    const data = response.data;
                    setCurrentBooks(data.books_read);
                    setTotalBooks(data.goal_books);
                    setProgressBooks(data.progress_books_percent);
                    setCurrentPages(data.pages_read);
                    setTotalPages(data.goal_pages);
                    setProgressPages(data.progress_pages_percent);
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
            setShelf(books.slice(0, numberOfBooks));
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

    const fetchSheets = async () => {
        try {
            let token = await AsyncStorage.getItem('auth_token');
            const response = await axios.get(`${apiBaseUrl}/decompletat`, {
                headers: { Authorization: `JWT ${token}` }
            });
            setSheets(response);
        } catch (error) {
            if (error.response?.status === 401) {
                const newToken = await refreshAccessToken(apiBaseUrl);
                if (newToken) {
                    const retryResponse = await axios.get(`${apiBaseUrl}/decompletat`, {
                        headers: { Authorization: `JWT ${newToken}` }
                    });
                    setSheets(retryResponse);
                } else {
                    console.error(`Unable to refresh token for reading sheets items.`);
                }
            } else {
                console.error(`Error loading reading sheets:`, error.message);
            }
        }
    };

    const renderSheet = ({ item }) => (
        <TouchableWithoutFeedback onPress={() => console.log("Apasat")}>
            <View style={styles.bookContainer}>
                <Image source={{ uri: item.thumbnail }} style={styles.covers} />
                <View style={styles.infoContainer}>
                    <Text onPress={() => console.log("Apasat")} style={styles.textInfoTitle}>{item.title}</Text>
                    <Text onPress={() => console.log("Apasat")} style={styles.textInfoAuthor}>{item.author}</Text>
                </View>
            </View>
        </TouchableWithoutFeedback>
      );
    
    useEffect(() => {
        if (isAuthenticated) {
            fetchUserData();
            fetchReadingChallenge();
            fetchShelf("Read", setRead, 6);
            fetchShelf("Reading", setReading, 4);
            fetchShelf("Readlist", setReadlist, 4);
            fetchShelf("Favourites", setFavourites, 4);
            fetchSheets();
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
                    <View style={styles.container}>
                        <Text style={styles.textTitleChallenges}> Reading Challenges </Text>
                        <View style={styles.challengeContainer}>
                            <View style={{ width: '47.5%' }}>
                                <TouchableNativeFeedback onPress={() => handleShelfClick('BooksChallenge')}>
                                    <View style={styles.challengeBooks}>
                                        <Text style={styles.textChallenge}>Number of Books </Text>
                                        <View style={styles.counterBox}>
                                            <Text style={styles.currentB}>{currentBooks}</Text>
                                            <Text style={styles.separator}>/</Text>
                                            <Text style={styles.totalB}>{totalBooks}</Text>
                                        </View>
                                        <View style={styles.progressContainer}>
                                            <ProgressBar progress={progressBooks} color="#613F75" style={styles.progressBarChallenge} />
                                            <Text style={styles.percentage}>{Math.round(progressBooks * 100)}%</Text>
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
                                            <Image
                                                source={calendarItem}
                                                style={{ width: 30, height: 34 }}
                                            />
                                            <Text style={styles.currentB}>{currentPages}</Text>
                                        </View>
                                        <View style={styles.progressContainer}>
                                            <ProgressBar progress={progressPages} color="#613F75" style={styles.progressBarChallenge} />
                                            <Text style={styles.percentage}>{Math.round(progressPages * 100)}%</Text>
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
                                {read[0] && read[1] && (
                                    <Image source={{ uri: read[0].thumbnail }} style={styles.coversBig} />
                                )}
                                {read[2] && read[3] && (
                                    <Image source={{ uri: read[2].thumbnail }} style={styles.coversMedium} />
                                )}
                                {read[4] && read[5] && (
                                    <Image source={{ uri: read[4].thumbnail }} style={styles.coversSmall} />
                                )}
                                <Text style={styles.textShelf}>Read</Text>
                                {read[5] && (
                                    <Image source={{ uri: read[5].thumbnail }} style={styles.coversSmall} />
                                )}
                                {read[3] && (
                                    <Image source={{ uri: read[3].thumbnail }} style={styles.coversMedium} />
                                )}
                                {read[1] && (
                                    <Image source={{ uri: read[1].thumbnail }} style={styles.coversBig} />
                                )}
                            </View>
                        </TouchableNativeFeedback>
                        <View style={styles.shelfBar} />
                        <TouchableNativeFeedback onPress={() => handleShelfClick('ShelfPage', { shelfName: 'Reading'})}>
                            <View style={styles.shelf}>
                                {reading[0] && reading[1] && (
                                    <Image source={{ uri: reading[0].thumbnail }} style={styles.coversBig} />
                                )}
                                {reading[2] && reading[3] && (
                                    <Image source={{ uri: reading[2].thumbnail }} style={styles.coversMedium} />
                                )}
                                <Text style={styles.textShelf}>Reading</Text>
                                {reading[3] && (
                                    <Image source={{ uri: reading[3].thumbnail }} style={styles.coversMedium} />
                                )}
                                {reading[1] && (
                                    <Image source={{ uri: reading[1].thumbnail }} style={styles.coversBig} />
                                )}
                            </View>
                        </TouchableNativeFeedback>
                        <View style={styles.shelfBar} />
                        <TouchableNativeFeedback onPress={() => handleShelfClick('ShelfPage', { shelfName: 'Readlist'})}>
                            <View style={styles.shelf}>
                                {readlist[0] && readlist[1] && (
                                    <Image source={{ uri: readlist[0].thumbnail }} style={styles.coversBig} />
                                )}
                                {readlist[2] && readlist[3] && (
                                    <Image source={{ uri: readlist[2].thumbnail }} style={styles.coversMedium} />
                                )}
                                <Text style={styles.textShelf}>Readlist</Text>
                                {readlist[3] && (
                                    <Image source={{ uri: readlist[3].thumbnail }} style={styles.coversMedium} />
                                )}
                                {readlist[1] && (
                                    <Image source={{ uri: readlist[1].thumbnail }} style={styles.coversBig} />
                                )}
                            </View>
                        </TouchableNativeFeedback>
                        <View style={styles.shelfBar} />
                        <TouchableNativeFeedback onPress={() => handleShelfClick('ShelfPage', {shelfName: 'Favourites'})}>
                            <View style={styles.shelf}>
                                {favourites[0] && favourites[1] && (
                                    <Image source={{ uri: favourites[0].thumbnail }} style={styles.coversBig} />
                                )}
                                {favourites[2] && favourites[3] && (
                                    <Image source={{ uri: favourites[2].thumbnail }} style={styles.coversMedium} />
                                )}
                                <Text style={styles.textShelf}>Favourites</Text>
                                {favourites[3] && (
                                    <Image source={{ uri: favourites[3].thumbnail }} style={styles.coversMedium} />
                                )}
                                {favourites[1] && (
                                    <Image source={{ uri: favourites[1].thumbnail }} style={styles.coversBig} />
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

                    <View style={styles.shelvesTitleContainer}>
                        <Image
                            source={readingSheetsItem}
                            style={{ width: 80, height: 80, }}
                        />
                        <View style={styles.categoryContainer}>
                            <Text style={styles.textCategory}> Reading Sheets </Text>
                            <View style={styles.horizontalBar} />
                        </View>
                    </View>

                    <View style={styles.shelvesContainer}>
                        {sheets.slice(0, 5).map((item) => (
                        <View key={item.id}>
                            {renderSheet({ item })}
                            <View style={styles.shelfBar} />
                        </View>
                        ))}
                        <TouchableNativeFeedback onPress={() => console.log("Apasat")}>
                            <View style={styles.shelf}>
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
        paddingTop: 14,
        paddingHorizontal: 10,
        marginBottom: 10,
        marginTop: 8,
        marginLeft: 8,
        width: '85%',
        height: 88,
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
        height: 106,
        justifyContent: 'center',
    },
    textShelf: {
        fontFamily: 'Nunito_500Medium',
        fontSize: 32,
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
        height: 72,
        width: 48,
        borderRadius: 4,
        marginRight: 12,
    },
    coversMedium: {
        height: 60,
        width: 40,
        borderRadius: 4,
        marginRight: 12,
    },
    coversSmall: {
        height: 42,
        width: 28,
        borderRadius: 4,
        marginRight: 12,
    },
    textShelfMore: {
        fontFamily: 'Nunito_500Medium',
        fontSize: 32,
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
});

export default LibraryPage;