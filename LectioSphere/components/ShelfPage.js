import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, Alert, SafeAreaView, TouchableWithoutFeedback, ScrollView, Image, FlatList } from 'react-native';
import NavBar from './Partials/NavBar';
import TopBar from './Partials/TopBar';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import { useFonts, Nunito_400Regular, Nunito_500Medium, Nunito_600SemiBold } from '@expo-google-fonts/nunito';
import { refreshAccessToken } from './refreshAccessToken'; 

const ShelfPage = ({ route, navigation, page, removeAuthToken, isAuthenticated, apiBaseUrl }) => {
    const [userData, setUserData] = useState(null);
    const [active, setActive] = useState(page);

    const { shelfName } = route.params;
    const [shelfBooks, setShelfBooks] = useState([]);

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

    const fetchShelf = async (shelfName) => {
        try {
            let token = await AsyncStorage.getItem('auth_token');
            const response = await axios.get(`${apiBaseUrl}/library/shelf/${shelfName}/`, {
                headers: { Authorization: `JWT ${token}` }
            });
            const {shelf_name, books} = response.data;
            setShelfBooks(books);
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
            setShelfBooks(books);
        } catch (error) {
            if (error.response?.status === 401) {
                const newToken = await refreshAccessToken(apiBaseUrl);
                if (newToken) {
                    const retryResponse = await axios.get(`${apiBaseUrl}/books/currently_reading/get/`, {
                        headers: { Authorization: `JWT ${newToken}` }
                    });
                    const books = retryResponse.data;
                    setShelfBooks(books);
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
            setShelfBooks(books);
        } catch (error) {
            if (error.response?.status === 401) {
                const newToken = await refreshAccessToken(apiBaseUrl);
                if (newToken) {
                    const retryResponse = await axios.get(`${apiBaseUrl}/books/read_list/get/`, {
                        headers: { Authorization: `JWT ${newToken}` }
                    });
                    const books = retryResponse.data;
                    setShelfBooks(books);
                } else {
                    console.error(`Unable to refresh token for shelf.`);
                }
            } else {
                console.error(`Error loading shelf:`, error.message);
            }
        }
    };

    const renderBook = ({ item }) => (
        <TouchableWithoutFeedback onPress={() => handleBookPress(item)}>
            <View style={styles.bookContainer}>
                <Image source={{ uri: item.thumbnail || item.cover}} style={styles.covers} />
                <View style={styles.infoContainer}>
                    <Text style={styles.textInfoTitle}>{item.title}</Text>
                    <Text style={styles.textInfoAuthor}>{item.author}</Text>
                    <Text style={styles.textInfo}>
                        {item.average_rating !== null && item.average_rating !== undefined
                            ? `${item.average_rating}`
                            : 'No rating'}
                    </Text>
                </View>
            </View>
        </TouchableWithoutFeedback>
        );
    
    useEffect(() => {
        if (isAuthenticated) {
            fetchUserData();
            if (shelfName === 'Reading' || shelfName === 'reading') {
                fetchShelfReading();
            }
            else if (shelfName === 'Readlist' || shelfName === 'readlist') {
                fetchShelfReadlist();
            }
            else {
                fetchShelf(shelfName);
            }
        }
    }, [isAuthenticated]);

    if (!fontsLoaded) {
        return <Text>Loading fonts...</Text>;
    }

    return (
        <SafeAreaView style={styles.screen}>
            <TopBar pageName="LibraryPage" />

            {/* <ScrollView contentContainerStyle={{ paddingBottom: 46 }} showsVerticalScrollIndicator={false}> */}

                {/* {/* <View style={styles.header}> */}
                    <View style={styles.categoryContainer}>
                        <Text style={styles.textCategory}> {shelfName} </Text>
                            <View style={styles.horizontalBar} />
                    </View>

                    {shelfBooks.length === 0 ? (
                        <View>
                            <View style={styles.categoryContainer}>
                                <Text style={styles.textCategory}> {shelfName} </Text>
                                <View style={styles.horizontalBar} />
                            </View>
                            <View style={styles.noBooksContainer}>
                                <Text style={styles.noBooksText}>No books yet</Text>
                            </View>
                        </View>
                    ) : 
                        <FlatList
                            data={shelfBooks}
                            renderItem={renderBook}
                            keyExtractor={(item) => item.id}
                            showsVerticalScrollIndicator={false} 
                            ListHeaderComponent={
                                <View style={styles.categoryContainer}>
                                    <Text style={styles.textCategory}> {shelfName} </Text>
                                    <View style={styles.horizontalBar} />
                                </View>
                            }
                            contentContainerStyle={{
                                alignItems: 'center',
                                paddingTop: 10,
                                paddingBottom: 65,
                            }}
                        />
                    }
                    {/*de completat dupa ce primesc formatul*/}
                        

                {/* </View> */}

            {/* </ScrollView> */}

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
    covers: {
        height: 148,
        width: 98,
        borderRadius: 4,
        marginRight: 12,
    },
    noBooksContainer: {
        alignItems: 'center',
        marginTop: 30,
    },
    noBooksText: {
        fontFamily: 'Nunito_500Medium',
        color: '#613F75',
        fontSize: 20, 
    },
    bookContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 10,
        backgroundColor: '#F7EDF1',
        borderColor: '#F3E3E9',
        borderWidth: 1,
        borderRadius: 8,
        paddingVertical: 10,
        marginTop: 16,
        //marginHorizontal: 16,
    },
    infoContainer: {    
        backgroundColor: '#F7EDF1',  
        width: '65%',
        marginLeft: 10,
    },
    textInfo: {
        flexWrap: 'wrap', 
        fontFamily: 'Nunito_500Medium',
        color: '#18101D',
    },
    textInfoTitle: {
        flexWrap: 'wrap', 
        fontFamily: 'Nunito_500Medium',
        color: '#613F75',
        fontSize: 18,
    },
    textInfoAuthor: {
        flexWrap: 'wrap', 
        fontFamily: 'Nunito_600SemiBold',
        color: '#18101D',
        marginBottom: 8,
    },
});

export default ShelfPage;