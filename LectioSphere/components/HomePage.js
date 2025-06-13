import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, Alert, SafeAreaView, TouchableNativeFeedback, ScrollView, Image } from 'react-native';
import NavBar from './Partials/NavBar';
import TopBar from './Partials/TopBar';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import { useFonts, Nunito_400Regular, Nunito_500Medium, Nunito_600SemiBold } from '@expo-google-fonts/nunito';
import { refreshAccessToken } from './refreshAccessToken'; 

const HomePage = ({ navigation, page, removeAuthToken, isAuthenticated, apiBaseUrl }) => {
    const [userData, setUserData] = useState(null);
    const [active, setActive] = useState(page);
    const [continueReadingItems, setContinueReadingItems] = useState([]);
    const [isReading, setIsReading] = useState(true);
    const [youMayLikeItems, setYouMayLikeItems] = useState([]);
    const [Read, setRead] = useState(true);
    const [friendsAreReadingItems, setFriendsAreReadingItems] = useState([]);
    const [areReading, setAreReading] = useState(true);
    const [freeItems, setFreeItems] = useState([]);
    const [free, setFree] = useState(true);
    const [eventsItems, setEventsItems] = useState([]);
    const [events, setEvents] = useState(false);


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
            const response = await axios.get(`${apiBaseUrl}/books/currently_reading/get/`, {
                headers: { Authorization: `JWT ${token}` }
            });
            if (Array.isArray(response.data)) {
                // Filtrăm cărțile care au un `thumbnail` valid
                const books = response.data;
                // Setăm primele 15 de cărți care au thumbnail
                setContinueReadingItems(books);
            } else {
                setIsReading(false); 
            }
        } catch (error) {
            if (error.response?.status === 401) {
                const newToken = await refreshAccessToken(apiBaseUrl);
                if (newToken) {
                    const retryResponse = await axios.get(`${apiBaseUrl}/books/currently_reading/get/`, {
                        headers: { Authorization: `JWT ${newToken}` }
                    });
                    if (Array.isArray(retryResponse.data)) {
                        const books = retryResponse.data
                        setContinueReadingItems(books);
                    } else {
                        setIsReading(false); 
                    }
                } else {
                    console.error("Unable to refresh for reading items.");
                }
            } 
            else if (error.response?.status === 404) {
                setIsReading(false);
            }
            else if (error.response?.status === HTTP_200_OK) {
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
            if (Array.isArray(response.data.recommendations)) {
                const books = response.data.recommendations;
                setYouMayLikeItems(books);
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
                    if (Array.isArray(retryResponse.data.recommendations)) {
                        const books = retryResponse.data.recommendations;
                        setYouMayLikeItems(books);
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
                // console.error("You May Like error:", error.message);
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
                const books = response.data;
                setFriendsAreReadingItems(books.slice(0, 15));
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
                        const books = retryResponse.data;
                        setFriendsAreReadingItems(books.slice(0, 15));
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

    const fetchFreeNow = async () => {
        try {
            let token = await AsyncStorage.getItem('auth_token');
            const response = await axios.get(`${apiBaseUrl}/scrape-books/`, {
                headers: { Authorization: `JWT ${token}` }
            });
            console.log('FreeItems:', response.data);
            let books = [];

            if (Array.isArray(response.data)) {
                // Dacă API trimite direct o listă de cărți
                books = response.data;
            } else if (response.data.books) {
                // Dacă API trimite { books: [...] }
                books = response.data.books;
            } else if (response.data.amazon || response.data.freebooksy) {
                // Dacă totuși are amazon/freebooksy
                books = [...(response.data.amazon||[]), ...(response.data.freebooksy||[])];
            } else {
                // fallback generic
                console.warn('scrape-books returned unexpected format');
                books = [];
                setFree(false);
            }
            setFreeItems(books);
        } catch (error) {
            if (error.response?.status === 401) {
                const newToken = await refreshAccessToken(apiBaseUrl);
                if (newToken) {
                    const retryResponse = await axios.get(`${apiBaseUrl}/scrape-books/`, {
                        headers: { Authorization: `JWT ${newToken}` }
                    });
                    let books = [];

                    if (Array.isArray(retryResponse.data)) {
                        // Dacă API trimite direct o listă de cărți
                        books = retryResponse.data;
                    } else if (retryResponse.data.books) {
                        // Dacă API trimite { books: [...] }
                        books = retryResponse.data.books;
                    } else if (retryResponse.data.amazon || retryResponse.data.freebooksy) {
                        // Dacă totuși are amazon/freebooksy
                        books = [...(retryResponse.data.amazon||[]), ...(retryResponse.data.freebooksy||[])];
                    } else {
                        // fallback generic
                        console.warn('scrape-books returned unexpected format');
                        books = [];
                        setFree(false);
                    }
                    setFreeItems(books);
                } else {
                    console.error("Unable to refresh for free items.");
                }
            } 
            else if(error.message === "Request failed with status code 500") {
                console.log("500");
            }
            else {
                console.error("Free now error:", error.message);
            }
        }
    };

    const fetchEvents = async () => {
        try {
            let token = await AsyncStorage.getItem('auth_token');
            const response = await axios.get(`${apiBaseUrl}/scrape-events/`, {
                headers: { Authorization: `JWT ${token}` }
            });
            if (Array.isArray(response.data)) {
                const normalizedEvents = response.data.map(event => ({
                    title: event.title ?? 'Untitled Event',
                    data: event.data ?? 'Unknown date',
                    locatie: event.locatie ?? 'Unknown location',
                    descriere: event.descriere ?? '',
                    imagine: event.imagine ?? null,
                    link: event.link ?? '',
                    source: event.source ?? '',
                }));
                setEventsItems(normalizedEvents);
                setEvents(true);
            }
        } catch (error) {
            if (error.response?.status === 401) {
                const newToken = await refreshAccessToken(apiBaseUrl);
                if (newToken) {
                    const retryResponse = await axios.get(`${apiBaseUrl}/scrape-events/`, {
                        headers: { Authorization: `JWT ${newToken}` }
                    });
                    if (Array.isArray(retryResponse.data)) {
                        const normalizedEvents = retryResponse.data.map(event => ({
                            title: event.title ?? 'Untitled Event',
                            data: event.data ?? 'Unknown date',
                            locatie: event.locatie ?? 'Unknown location',
                            descriere: event.descriere ?? '',
                            imagine: event.imagine ?? null,
                            link: event.link ?? '',
                            source: event.source ?? '',
                        }));
                        setEventsItems(normalizedEvents);
                        setEvents(true);
                    }
                } else {
                    console.error("Unable to refresh for events items.");
                    setEvents(false);
                }
            } 
            else if (error.response?.status === HTTP_200_OK) {
                setEvents(false);
            }
            else {
                console.error("Events error:", error.message);
                setEvents(false);
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

    const handleShelfClick = (page, params = {}) => {
        setActive(page);
        navigation.navigate(page, params); 
    };

    const handleCategoryClick = (page, params = {}) => {
        setActive(page);
        navigation.navigate(page, params); 
    };

    useEffect(() => {
        if (isAuthenticated) {
            fetchUserData();
            fetchContinueReading();
            fetchYouMayLike();
            fetchFriendsAreReading();
            fetchFreeNow();
            fetchEvents();
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
                                <TouchableNativeFeedback onPress={() => handleShelfClick('ShelfPage', { shelfName: 'Reading'})}>
                                    <View>
                                        <Text style={styles.textContainer}>  Continue Reading </Text>
                                    </View>
                                </TouchableNativeFeedback>
                                <ScrollView horizontal showsHorizontalScrollIndicator={false} style = {styles.containerImages}>
                                    {continueReadingItems.map((book, index) => (
                                        <TouchableNativeFeedback key={index} onPress={() => handleBookPress(book)}>
                                            <View>
                                                <Image
                                                    source={{ uri: book.cover }}
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
                                <View>
                                    <View>
                                        <Text style={styles.textContainer}>  You May Like </Text>
                                    </View>
                                </View>
                                {youMayLikeItems.length > 0 ? (
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
                                ) : (
                                    <Text style={styles.textAdvice}>   Read more to give us an idea about your favourite books</Text>
                                )}
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
                                                    source={{ uri: book.cover }}
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
                                <Text style={styles.textAdvice}>   Start following more people to get inspired by their reads! </Text>
                            </View>
                        ) : null
                    }


                    {/* {
                        free ? (
                            <View style={styles.container}>
                                <View>
                                    <Text style={styles.textContainer}> Free now </Text>
                                </View>
                                <ScrollView horizontal showsHorizontalScrollIndicator={false} style = {styles.containerImages}>
                                    {freeItems.map((book, index) => (
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
                        ! free ? (
                            <View style={styles.container}>
                                <Text style={styles.textContainer}> Free now </Text>
                                <Text style={styles.textAdvice}>   No books available right now — check back soon! </Text>
                            </View>
                        ) : null
                    } */}

                    <View style={styles.container}>
                        <Text style={styles.textContainer}>  Free now </Text>

                        {freeItems.length > 0 ? (
                            <ScrollView
                                horizontal
                                showsHorizontalScrollIndicator={false}
                                style={styles.containerImages}
                            >
                                {freeItems.map((book, index) => (
                                    <TouchableNativeFeedback
                                        key={index}
                                        onPress={() => handleBookPress(book)}
                                    >
                                        <View>
                                            <Image
                                                source={{ uri: book.thumbnail }}
                                                style={styles.covers}
                                            />
                                        </View>
                                    </TouchableNativeFeedback>
                                ))}
                            </ScrollView>
                        ) : (
                            <Text style={styles.textAdvice}>   No free books available right now — check back soon!</Text>
                        )}
                    </View>



                    {/* {
                        events ? (
                            <View style={styles.container}>
                                <View>
                                    <Text style={styles.textContainer}> Events </Text>
                                </View>
                            </View>
                        ) : null 
                    }

                    {
                        ! events ? (
                            <View style={styles.container}>
                                <Text style={styles.textContainer}> Events </Text>
                                <Text style={styles.textAdvice}>   No future events right now — check back soon! </Text>
                            </View>
                        ) : null
                    }        */}

                    <View style={styles.container}>
                        <Text style={styles.textContainer}>  Events </Text>

                        {events && eventsItems.length > 0 ? (
                            eventsItems.map((event, index) => (
                                <View key={index} style={styles.eventCard}>
                                    {event.imagine && (
                                        <Image
                                            source={{ uri: event.imagine }}
                                            style={styles.eventImage}
                                        />
                                    )}
                                    <View style={styles.eventTextContent}>
                                        <Text style={styles.eventTitle}>{event.title}</Text>
                                        <Text style={styles.eventMeta}>
                                            📅 {event.data || 'Date unknown'} ‧ 📍 {event.locatie || 'Unknown location'}
                                        </Text>
                                        <Text style={styles.eventDescription} numberOfLines={4}>
                                            {event.descriere}
                                        </Text>
                                    </View>
                                </View>
                            ))
                        ) : (
                            <Text style={styles.textAdvice}>   No upcoming events right now — check back soon!</Text>
                        )}
                    </View>




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
        marginBottom: 8,
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
    eventCard: {
        flexDirection: 'row',
        backgroundColor: '#FCF8FA',
        borderRadius: 10,
        marginHorizontal: 10,
        marginVertical: 8,
        padding: 10,
        borderColor: '#E5C3D1',
        borderWidth: 1,
        elevation: 2,
    },
    eventImage: {
        width: 80,
        height: 80,
        borderRadius: 6,
        marginRight: 12,
        backgroundColor: '#E5C3D1',
    },
    eventTextContent: {
        flex: 1,
        justifyContent: 'center',
    },
    eventTitle: {
        fontFamily: 'Nunito_700Bold',
        fontSize: 16,
        color: '#18101D',
        marginBottom: 4,
    },
    eventMeta: {
        fontFamily: 'Nunito_500Medium',
        fontSize: 14,
        color: '#613F75',
        marginBottom: 6,
    },
    eventDescription: {
        fontFamily: 'Nunito_400Regular',
        fontSize: 14,
        color: '#18101D',
        lineHeight: 18,
    },
});

export default HomePage;