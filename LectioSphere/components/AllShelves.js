import React, { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Alert, SafeAreaView, TouchableNativeFeedback, ScrollView, Image } from 'react-native';
import NavBar from './Partials/NavBar';
import TopBar from './Partials/TopBar';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import { useFonts, Nunito_400Regular, Nunito_500Medium, Nunito_600SemiBold } from '@expo-google-fonts/nunito';
import { refreshAccessToken } from './refreshAccessToken'; 

const AllShelves = ({ navigation, page, removeAuthToken, isAuthenticated, apiBaseUrl }) => {
    const [userData, setUserData] = useState(null);
    const [active, setActive] = useState(page);

    const [shelves, setShelves] = useState([]);
    const [shelfRead, setShelfRead] = useState([]);
    const [shelfReading, setShelfReading] = useState([]);
    const [shelfReadlist, setShelfReadlist] = useState([]);



    const handleShelfClick = (page, params = {}) => {
        setActive(page);
        navigation.navigate(page, params); 
    };

    const handleBookPress = (book) => {
        navigation.navigate('BookShow', { 
            bookData: JSON.stringify(book)
        });
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

    const fetchShelves = async () => {
        try {
            let token = await AsyncStorage.getItem('auth_token');
            const response = await axios.get(`${apiBaseUrl}/library/shelves/`, {
                headers: { Authorization: `JWT ${token}` }
            });
            setShelves(response.data);
        } catch (error) {
            if (error.response?.status === 401) {
                const newToken = await refreshAccessToken(apiBaseUrl);
                if (newToken) {
                    const retryResponse = await axios.get(`${apiBaseUrl}/library/shelves/`, {
                        headers: { Authorization: `JWT ${newToken}` }
                    });
                    setShelves(retryResponse.data);
                } else {
                    console.error(`Unable to refresh token for shelves.`);
                }
            } else {
                console.error(`Error loading shelves:`, error.message);
            }
        }
    };

    const fetchShelf = async (shelfName) => {
        try {
            let token = await AsyncStorage.getItem('auth_token');
            const response = await axios.get(`${apiBaseUrl}/library/shelf/${shelfName}/`, {
                headers: { Authorization: `JWT ${token}` }
            });
            const {shelf_name, books} = response.data;
            setShelfRead(books);
        } catch (error) {
            if (error.response?.status === 401) {
                const newToken = await refreshAccessToken(apiBaseUrl);
                if (newToken) {
                    const retryResponse = await axios.get(`${apiBaseUrl}/library/shelf/${shelfName}/`, {
                        headers: { Authorization: `JWT ${newToken}` }
                    });
                    const {shelf_name, books} = retryResponse.data;
                    setShelfBooks(books);
                } else {
                    console.error(`Unable to refresh token for shelf.`);
                }
            } else {
                console.error(`Error loading shelf:`, error.message);
            }
        }
    };

    const fetchShelfReading = async () => {
        try {
            let token = await AsyncStorage.getItem('auth_token');
            const response = await axios.get(`${apiBaseUrl}/books/currently_reading/get/`, {
                headers: { Authorization: `JWT ${token}` }
            });
            const books = response.data;
            setShelfReading(books);
        } catch (error) {
            if (error.response?.status === 401) {
                const newToken = await refreshAccessToken(apiBaseUrl);
                if (newToken) {
                    const retryResponse = await axios.get(`${apiBaseUrl}/books/currently_reading/get/`, {
                        headers: { Authorization: `JWT ${newToken}` }
                    });
                    const books = retryResponse.data;
                    setShelfReading(books);
                } else {
                    console.error(`Unable to refresh token for shelf.`);
                }
            } else {
                console.error(`Error loading shelf:`, error.message);
            }
        }
    };

    const fetchShelfReadlist = async () => {
        try {
            let token = await AsyncStorage.getItem('auth_token');
            const response = await axios.get(`${apiBaseUrl}/books/read_list/get/`, {
                headers: { Authorization: `JWT ${token}` }
            });
            const books = response.data;
            setShelfReadlist(books);
        } catch (error) {
            if (error.response?.status === 401) {
                const newToken = await refreshAccessToken(apiBaseUrl);
                if (newToken) {
                    const retryResponse = await axios.get(`${apiBaseUrl}/books/read_list/get/`, {
                        headers: { Authorization: `JWT ${newToken}` }
                    });
                    const books = retryResponse.data;
                    setShelfReadlist(books);
                } else {
                    console.error(`Unable to refresh token for shelf.`);
                }
            } else {
                console.error(`Error loading shelf:`, error.message);
            }
        }
    };
    
    useEffect(() => {
        if (isAuthenticated) {
            fetchUserData();
            fetchShelves();
            fetchShelf('Read');
            fetchShelfReading();
            fetchShelfReadlist();
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
                        <Text style={styles.textCategory}> Your Shelves </Text>
                        <View style={styles.horizontalBar} />
                    </View>

                    {/* Standard Shelves (dictionary-based) */}
                    {/* {Object.entries(shelves.standard_shelves || {}).map(([shelfName, books], index) => (
                        <View key={`standard-${index}`} style={styles.container}>
                            <TouchableNativeFeedback onPress={() => handleShelfClick('ShelfPage', { shelfName })}>
                                <View>
                                    <Text style={styles.textContainer}>  {shelfName}</Text>
                                </View>
                            </TouchableNativeFeedback>
                            {books.length === 0 ? (
                                <View style={styles.noBooksContainer}>
                                    <Text style={styles.noBooksText}>No books yet</Text>
                                </View>
                            ) : (
                                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.containerImages}>
                                    {books.slice(0, 15).map((book, idx) => (
                                        <TouchableNativeFeedback key={idx} onPress={() => handleBookPress(book)}>
                                            <View>
                                                <Image source={{ uri: book.thumbnail }} style={styles.covers} />
                                            </View>
                                        </TouchableNativeFeedback>
                                    ))}
                                </ScrollView>
                            )}
                        </View>
                    ))} */}




                    <View style={styles.container}>
                        <View>
                            <View>
                                <Text style={styles.textContainer}>  Read</Text>
                            </View>
                        </View>
                            {shelfRead.length === 0 ? (
                                <View style={styles.noBooksContainer}>
                                    <Text style={styles.noBooksText}>No books yet</Text>
                                </View>
                            ) : (
                                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.containerImages}>
                                    {shelfRead.slice(0, 15).map((book, idx) => (
                                        <TouchableNativeFeedback key={idx} onPress={() => handleBookPress(book)}>
                                            <View>
                                                <Image source={{ uri: book.cover }} style={styles.covers} />
                                            </View>
                                        </TouchableNativeFeedback>
                                    ))}
                                </ScrollView>
                            )}
                    </View>

                    <View style={styles.container}>
                        <View>
                            <View>
                                <Text style={styles.textContainer}>  Reading </Text>
                            </View>
                        </View>
                            {shelfReading.length === 0 ? (
                                <View style={styles.noBooksContainer}>
                                    <Text style={styles.noBooksText}>No books yet</Text>
                                </View>
                            ) : (
                                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.containerImages}>
                                    {shelfReading.slice(0, 15).map((book, idx) => (
                                        <TouchableNativeFeedback key={idx} onPress={() => handleBookPress(book)}>
                                            <View>
                                                <Image source={{ uri: book.cover }} style={styles.covers} />
                                            </View>
                                        </TouchableNativeFeedback>
                                    ))}
                                </ScrollView>
                            )}
                    </View>

                    <View style={styles.container}>
                        <View>
                            <View>
                                <Text style={styles.textContainer}>  Readlist</Text>
                            </View>
                        </View>
                            {shelfReadlist.length === 0 ? (
                                <View style={styles.noBooksContainer}>
                                    <Text style={styles.noBooksText}>No books yet</Text>
                                </View>
                            ) : (
                                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.containerImages}>
                                    {shelfReadlist.slice(0, 15).map((book, idx) => (
                                        <TouchableNativeFeedback key={idx} onPress={() => handleBookPress(book)}>
                                            <View>
                                                <Image source={{ uri: book.cover }} style={styles.covers} />
                                            </View>
                                        </TouchableNativeFeedback>
                                    ))}
                                </ScrollView>
                            )}
                    </View>

                    {/* Custom Shelves (list-based) */}
                    {(shelves.custom_shelves || []).slice(2).map((shelf, index) => (
                        <View key={`custom-${index}`} style={styles.container}>
                            <TouchableNativeFeedback onPress={() => handleShelfClick('ShelfPage', { shelfName: shelf.shelf_name })}>
                                <View>
                                    <Text style={styles.textContainer}>  {shelf.shelf_name}</Text>
                                </View>
                            </TouchableNativeFeedback>
                            {shelf.books.length === 0 ? (
                                <View style={styles.noBooksContainer}>
                                    <Text style={styles.noBooksText}>No books yet</Text>
                                </View>
                            ) : (
                                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.containerImages}>
                                    {shelf.books.slice(0, 15).map((book, idx) => (
                                        <TouchableNativeFeedback key={idx} onPress={() => handleBookPress(book)}>
                                            <View>
                                                <Image source={{ uri: book.cover }} style={styles.covers} />
                                            </View>
                                        </TouchableNativeFeedback>
                                    ))}
                                </ScrollView>
                            )}
                        </View>
                    ))}

                        

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
    shelf: {
        height: 106,
        justifyContent: 'center',
    },
    textShelf: {
        fontFamily: 'Nunito_500Medium',
        fontSize: 32,
        color: '#18101D',
    },
    noBooksContainer: {
        alignItems: 'center',
    },
    noBooksText: {
        fontFamily: 'Nunito_500Medium',
        color: '#613F75',
        fontSize: 20, 
    },
    covers: {
        height: 148,
        width: 98,
        borderRadius: 4,
        marginRight: 12,
    },
    containerImages: {
        marginHorizontal: 12,
    },
});

export default AllShelves;