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
    const [eventsLoading, setEventsLoading] = useState(true);
    const [failedImages, setFailedImages] = useState(new Set());


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
            let books = [];

            if (Array.isArray(response.data)) {
                books = response.data;
            } else if (response.data.books) {
                books = response.data.books;
            } else if (response.data.amazon || response.data.freebooksy) {
                books = [...(response.data.amazon||[]), ...(response.data.freebooksy||[])];
            } else {
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
                        books = retryResponse.data;
                    } else if (retryResponse.data.books) {
                        books = retryResponse.data.books;
                    } else if (retryResponse.data.amazon || retryResponse.data.freebooksy) {
                        books = [...(retryResponse.data.amazon||[]), ...(retryResponse.data.freebooksy||[])];
                    } else {
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
            // Check if we have cached events
            const cachedEvents = await AsyncStorage.getItem('cached_events');
            const cachedTimestamp = await AsyncStorage.getItem('cached_events_timestamp');
            
            if (cachedEvents && cachedTimestamp) {
                const now = Date.now();
                const lastFetch = parseInt(cachedTimestamp);
                const hoursSinceLastFetch = (now - lastFetch) / (1000 * 60 * 60);
                
                // If less than 24 hours, use cached data
                if (hoursSinceLastFetch < 12) {
                    console.log('Using cached events (fetched', hoursSinceLastFetch.toFixed(1), 'hours ago)');
                    const parsedEvents = JSON.parse(cachedEvents);
                    setEventsItems(parsedEvents);
                    setEvents(true);
                    setEventsLoading(false);
                    return;
                }
            }
            
            // Otherwise, fetch fresh data
            console.log('Fetching fresh events from server...');
            let token = await AsyncStorage.getItem('auth_token');
            const response = await axios.get(`${apiBaseUrl}/scrape-events/`, {
                headers: { Authorization: `JWT ${token}` }
            });
            if (Array.isArray(response.data) && response.data.length > 0) {
                const normalizedEvents = response.data.map(event => ({
                    title: event.title ?? 'Untitled Event',
                    date: (event.date && event.date !== 'Necunoscută') ? event.date : 'Unknown',
                    location: (event.location && event.location !== 'Necunoscută') ? event.location : 'Unknown',
                    description: event.description ?? '',
                    image: event.image ?? null,
                    link: event.link ?? '',
                    source: event.source ?? '',
                }));
                
                // Sort events: those with images first
                normalizedEvents.sort((a, b) => {
                    const aHasImage = a.image && a.image.trim() !== '';
                    const bHasImage = b.image && b.image.trim() !== '';
                    if (aHasImage && !bHasImage) return -1;
                    if (!aHasImage && bHasImage) return 1;
                    return 0;
                });
                
                // Cache the events
                await AsyncStorage.setItem('cached_events', JSON.stringify(normalizedEvents));
                await AsyncStorage.setItem('cached_events_timestamp', Date.now().toString());
                
                setEventsItems(normalizedEvents);
                setEvents(true);
            } else {
                console.log('Events response is not an array or empty');
                setEvents(false);
            }
            setEventsLoading(false);
        } catch (error) {
            console.error('Events fetch error:', error.message, error.response?.status);
            // Don't set events to false if we already have events loaded
            if (eventsItems.length === 0) {
                if (error.response?.status === 500) {
                    console.log('Events scraping service unavailable (500)');
                    setEvents(false);
                    setEventsLoading(false);
                    return;
                }
                if (error.response?.status === 401) {
                    const newToken = await refreshAccessToken(apiBaseUrl);
                    if (newToken) {
                        try {
                            const retryResponse = await axios.get(`${apiBaseUrl}/scrape-events/`, {
                                headers: { Authorization: `JWT ${newToken}` }
                            });
                            if (Array.isArray(retryResponse.data) && retryResponse.data.length > 0) {
                                const normalizedEvents = retryResponse.data.map(event => ({
                                    title: event.title ?? 'Untitled Event',
                                    date: (event.date && event.date !== 'Necunoscută') ? event.date : 'Unknown',
                                    location: (event.location && event.location !== 'Necunoscută') ? event.location : 'Unknown',
                                    description: event.description ?? '',
                                    image: event.image ?? null,
                                    link: event.link ?? '',
                                    source: event.source ?? '',
                                }));
                                
                                // Sort events: those with images first
                                normalizedEvents.sort((a, b) => {
                                    const aHasImage = a.image && a.image.trim() !== '';
                                    const bHasImage = b.image && b.image.trim() !== '';
                                    if (aHasImage && !bHasImage) return -1;
                                    if (!aHasImage && bHasImage) return 1;
                                    return 0;
                                });
                                
                                // Cache the events
                                await AsyncStorage.setItem('cached_events', JSON.stringify(normalizedEvents));
                                await AsyncStorage.setItem('cached_events_timestamp', Date.now().toString());
                                
                                setEventsItems(normalizedEvents);
                                setEvents(true);
                            }
                            setEventsLoading(false);
                        } catch (retryError) {
                            console.error("Events retry error:", retryError.message);
                            setEvents(false);
                            setEventsLoading(false);
                        }
                    } else {
                        setEvents(false);
                        setEventsLoading(false);
                    }
                } 
                else {
                    setEvents(false);
                    setEventsLoading(false);
                }
            } else {
                console.log('Error occurred but events already loaded, keeping existing events');
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

    const handleEventPress = (event) => {
        navigation.navigate('EventPage', { 
            eventData: JSON.stringify(event)
        });
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
                                    <View testID="home-continue-reading" accessibilityLabel="home-continue-reading">
                                        <Text style={styles.textContainer}>  Continue Reading </Text>
                                    </View>
                                </TouchableNativeFeedback>
                                <ScrollView horizontal showsHorizontalScrollIndicator={false} style = {styles.containerImages}>
                                    {continueReadingItems.map((book, index) => (
                                                <TouchableNativeFeedback key={index} onPress={() => handleBookPress(book)}>
                                                    <View accessibilityLabel={`home-continue-book-${index}`}>
                                                        <Image
                                                            source={{ uri: book.cover }}
                                                            style={styles.covers}
                                                            accessibilityLabel={`home-continue-book-image-${index}`}
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
                                    <View testID="home-you-may-like" accessibilityLabel="home-you-may-like">
                                        <Text style={styles.textContainer}>  You May Like </Text>
                                    </View>
                                </View>
                                {youMayLikeItems.length > 0 ? (
                                    <ScrollView horizontal showsHorizontalScrollIndicator={false} style = {styles.containerImages}>
                                        {youMayLikeItems.map((book, index) => (
                                                <TouchableNativeFeedback key={index} onPress={() => handleBookPress(book)}>
                                                <View accessibilityLabel={`home-youmaylike-book-${index}`}>
                                                    <Image
                                                        source={{ uri: book.thumbnail }}
                                                        style={styles.covers}
                                                        accessibilityLabel={`home-youmaylike-book-image-${index}`}
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
                                    <View accessibilityLabel="home-friends-reading">
                                        <Text style={styles.textContainer}> Your friends are reading </Text>
                                    </View>
                                </TouchableNativeFeedback>
                                <ScrollView horizontal showsHorizontalScrollIndicator={false} style = {styles.containerImages}>
                                    {friendsAreReadingItems.map((book, index) => (
                                            <TouchableNativeFeedback key={index} onPress={() => handleBookPress(book)}>
                                            <View accessibilityLabel={`home-friends-book-${index}`}>
                                                <Image
                                                    source={{ uri: book.cover }}
                                                    style={styles.covers}
                                                    accessibilityLabel={`home-friends-book-image-${index}`}
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



                    {/* EVENTS */}
                    <View style={styles.container}>
                        <Text style={styles.textContainer} accessibilityLabel="home-events-header">  Events </Text>

                        {eventsLoading ? (
                            <Text style={styles.textAdvice}>   Loading events... ✨</Text>
                        ) : events && eventsItems.length > 0 ? (
                            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.containerImages}>
                                {(() => {
                                    // Sort events dynamically based on which images have loaded successfully
                                    const sortedEvents = eventsItems.map((event, originalIndex) => ({ event, originalIndex }))
                                        .sort((a, b) => {
                                            const aHasImage = a.event.image && a.event.image.trim() !== '' && !failedImages.has(a.originalIndex);
                                            const bHasImage = b.event.image && b.event.image.trim() !== '' && !failedImages.has(b.originalIndex);
                                            if (aHasImage && !bHasImage) return -1;
                                            if (!aHasImage && bHasImage) return 1;
                                            return 0;
                                        });
                                    
                                    return sortedEvents.map(({ event, originalIndex }) => {
                                        const hasValidImage = event.image && event.image.trim() !== '' && !failedImages.has(originalIndex);
                                        return (
                                                <TouchableNativeFeedback 
                                                key={originalIndex} 
                                                onPress={() => handleEventPress(event)}
                                            >
                                                <View style={styles.eventCard} accessibilityLabel={`home-event-${originalIndex}`}>
                                                    {hasValidImage && (
                                                        <Image
                                                            source={{ uri: event.image }}
                                                            style={styles.eventImage}
                                                            onError={() => {
                                                                setFailedImages(prev => new Set([...prev, originalIndex]));
                                                            }}
                                                            accessibilityLabel={`home-event-image-${originalIndex}`}
                                                        />
                                                    )}
                                                    <View style={[styles.eventTextContent, !hasValidImage && styles.eventTextContentNoImage]}>
                                                        <Text style={styles.eventTitle} numberOfLines={2} accessibilityLabel={`home-event-title-${originalIndex}`}>{event.title}</Text>
                                                        <Text style={styles.eventMeta} numberOfLines={1}>
                                                            📅 {event.date || 'Unknown'}
                                                        </Text>
                                                        <Text style={styles.eventMeta} numberOfLines={1}>
                                                            📍 {event.location || 'Unknown'}
                                                        </Text>
                                                        <Text style={styles.eventDescription}>
                                                            {event.description}
                                                        </Text>
                                                    </View>
                                                </View>
                                            </TouchableNativeFeedback>
                                        );
                                    });
                                })()}
                            </ScrollView>
                        ) : (
                            <Text style={styles.textAdvice}>   No upcoming events right now — check back soon!</Text>
                        )}
                    </View>



                    <View style={styles.container}>
                        <Text style={styles.textContainer} accessibilityLabel="home-free-now">  Free now </Text>

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
                                        <View accessibilityLabel={`home-free-book-${index}`}>
                                            <Image
                                                source={{ uri: book.thumbnail }}
                                                style={styles.covers}
                                                accessibilityLabel={`home-free-book-image-${index}`}
                                            />
                                        </View>
                                    </TouchableNativeFeedback>
                                ))}
                            </ScrollView>
                        ) : (
                            <Text style={styles.textAdvice}>   No free books available right now — check back soon!</Text>
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
        flexDirection: 'column',
        backgroundColor: '#FCF8FA',
        borderRadius: 10,
        marginRight: 12,
        padding: 10,
        borderColor: '#E5C3D1',
        borderWidth: 1,
        elevation: 2,
        width: 180,
        height: 255,
    },
    eventImage: {
        width: 160,
        height: 100,
        borderRadius: 6,
        marginBottom: 8,
    },
    eventTextContent: {
        flex: 1,
        justifyContent: 'space-between',
    },
    eventTextContentNoImage: {
        marginTop: 0,
    },
    eventTitle: {
        fontFamily: 'Nunito_600SemiBold',
        fontSize: 15,
        color: '#18101D',
        marginBottom: 4,
        lineHeight: 18,
    },
    eventMeta: {
        fontFamily: 'Nunito_500Medium',
        fontSize: 12,
        color: '#613F75',
        marginBottom: 3,
    },
    eventDescription: {
        fontFamily: 'Nunito_400Regular',
        fontSize: 13,
        color: '#18101D',
        lineHeight: 16,
        marginTop: 4,
        flex: 1,
    },
});

export default HomePage;