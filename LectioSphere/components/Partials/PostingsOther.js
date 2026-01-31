import React, { useEffect, useState } from 'react';
import { StyleSheet, Text, View, Image, TouchableNativeFeedback, ScrollView } from "react-native";
import { useFonts, Nunito_400Regular, Nunito_500Medium, Nunito_600SemiBold } from '@expo-google-fonts/nunito';
import axios from 'axios';
import PostPartial from './PostPartial';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { refreshAccessToken } from '../refreshAccessToken';


export default function Postings ({ navigation, apiBaseUrl, selection, userId }) {

    const [fontsLoaded] = useFonts({
        Nunito_400Regular,
        Nunito_500Medium,
        Nunito_600SemiBold
    });

    const [posts, setPosts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [shelves, setShelves] = useState([]);
    const [shelfRead, setShelfRead] = useState([]);
    const [shelfReading, setShelfReading] = useState([]);
    const [shelfReadlist, setShelfReadlist] = useState([]);

    const defaultPicture = require('../../assets/defaultProfilePic.jpg');

    const handleBookPress = (book) => {
        navigation.navigate('BookShow', { bookData: JSON.stringify(book) });
    };

    const handleShelfClick = (page, params = {}) => {
        navigation.navigate(page, params);
    };

    const fetchShelves = async () => {
        try {
            let token = await AsyncStorage.getItem('auth_token');
            const response = await axios.get(`${apiBaseUrl}/library/user-shelves/${userId}/`, {
                headers: { Authorization: `JWT ${token}` }
            });
            setShelves(response.data);
        } catch (error) {
            if (error.response?.status === 401) {
                const newToken = await refreshAccessToken(apiBaseUrl);
                if (newToken) {
                    const retryResponse = await axios.get(`${apiBaseUrl}/library/user-shelves/${userId}/`, {
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
            const response = await axios.get(`${apiBaseUrl}/library/user-shelf/${userId}/${shelfName}/`, {
                headers: { Authorization: `JWT ${token}` }
            });
            const {shelf_name, books} = response.data;
            setShelfRead(books);
        } catch (error) {
            if (error.response?.status === 401) {
                const newToken = await refreshAccessToken(apiBaseUrl);
                if (newToken) {
                    const retryResponse = await axios.get(`${apiBaseUrl}/library/user-shelf/${userId}/${shelfName}/`, {
                        headers: { Authorization: `JWT ${newToken}` }
                    });
                    const {shelf_name, books} = retryResponse.data;
                    setShelfRead(books);
                } else {
                    console.error(`Unable to refresh token for shelf.`);
                }
            } else {
                // console.error(`Error loading shelf:`, error.message);
            }
        }
    };

    const fetchShelfReading = async () => {
        try {
            let token = await AsyncStorage.getItem('auth_token');
            const response = await axios.get(`${apiBaseUrl}/library/user-shelf/${userId}/Reading/`, {
                headers: { Authorization: `JWT ${token}` }
            });
            const books = response.data.books || [];
            setShelfReading(books);
        } catch (error) {
            if (error.response?.status === 401) {
                const newToken = await refreshAccessToken(apiBaseUrl);
                if (newToken) {
                    const retryResponse = await axios.get(`${apiBaseUrl}/library/user-shelf/${userId}/Reading/`, {
                        headers: { Authorization: `JWT ${newToken}` }
                    });
                    const books = retryResponse.data.books || [];
                    setShelfReading(books);
                } else {
                    console.error(`Unable to refresh token for shelf.`);
                }
            } else {
                // console.error(`Error loading shelf:`, error.message);
            }
        }
    };

    const fetchShelfReadlist = async () => {
        try {
            let token = await AsyncStorage.getItem('auth_token');
            const response = await axios.get(`${apiBaseUrl}/library/user-shelf/${userId}/Readlist/`, {
                headers: { Authorization: `JWT ${token}` }
            });
            const books = response.data.books || [];
            setShelfReadlist(books);
        } catch (error) {
            if (error.response?.status === 401) {
                const newToken = await refreshAccessToken(apiBaseUrl);
                if (newToken) {
                    const retryResponse = await axios.get(`${apiBaseUrl}/library/user-shelf/${userId}/Readlist/`, {
                        headers: { Authorization: `JWT ${newToken}` }
                    });
                    const books = retryResponse.data.books || [];
                    setShelfReadlist(books);
                } else {
                    console.error(`Unable to refresh token for shelf.`);
                }
            } else {
                // console.error(`Error loading shelf:`, error.message);
            }
        }
    };

    useEffect(() => {
        setLoading(true);
        setPosts([]);
        
        if (selection === 'closedBook') {
            const fetchLibraryData = async () => {
                await Promise.all([
                    fetchShelves(),
                    fetchShelf('Read'),
                    fetchShelfReading(),
                    fetchShelfReadlist()
                ]);
                setLoading(false);
            };
            fetchLibraryData();
            return;
        }
        
        let endpoint = '';
        
        if (selection === 'photo') {
            endpoint = `${apiBaseUrl}/posts/post_type/${userId}/`;
        } else if (selection === 'glasses') {
            endpoint = `${apiBaseUrl}/posts/non_post_type/${userId}/`;
        }

        console.log(endpoint);

        if (endpoint && userId) {
            axios.get(endpoint)
                .then(res => {
                    // Sortează postările după data descrescător
                    const sortedPosts = res.data.sort((a, b) => new Date(b.date) - new Date(a.date));
                    setPosts(sortedPosts);
                    setLoading(false);
                })
                .catch(err => {
                    console.error(err);
                    setLoading(false);
                });
        }
    }, [selection, apiBaseUrl, userId]); // Re-run when selection, apiBaseUrl, or userId changes

    // console.log('Current selection:', selection);
    // console.log('Posts:', posts);

    if (loading) {
        return (
            <View style={styles.card}>
                <View style={styles.notFoundContainer}>
                    <Text style={styles.notFoundText}>
                        Loading...
                    </Text>
                </View>
            </View>
        );
    }

    if (selection === 'closedBook') {
        return (
            <View style={styles.card}>
                {shelfRead.length === 0 ? (
                    <View style={styles.box}>
                        <View style={styles.titleShelf}>
                            <Text style={styles.textContainer}>Read</Text>
                            <View style={styles.shelfBar} />
                        </View>
                        <View style={styles.noBooksContainer}>
                            <Text style={styles.noBooksText}>No books yet</Text>
                        </View>
                    </View>
                ) : (
                    <View style={styles.box}>
                        <View style={styles.titleShelf}>
                            <Text style={styles.textContainer}>{shelfRead.length} Read</Text>
                            <View style={styles.shelfBar} />
                        </View>
                        <View style={styles.container}>
                            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.containerImages}>
                                {shelfRead.slice(0, 15).map((book, idx) => (
                                    <TouchableNativeFeedback key={idx} onPress={() => handleBookPress(book)}>
                                        <View>
                                            <Image source={{ uri: book.cover }} style={styles.covers} />
                                        </View>
                                    </TouchableNativeFeedback>
                                ))}
                            </ScrollView>
                        </View>
                    </View>
                )}

                {shelfReading.length === 0 ? (
                    <View style={styles.box}>
                        <View style={styles.titleShelf}>
                            <Text style={styles.textContainer}>Reading</Text>
                            <View style={styles.shelfBar} />
                        </View>
                        <View style={styles.noBooksContainer}>
                            <Text style={styles.noBooksText}>No books yet</Text>
                        </View>
                    </View>
                ) : (
                    <View style={styles.box}>
                        <View style={styles.titleShelf}>
                            <Text style={styles.textContainer}>{shelfReading.length} Reading</Text>
                            <View style={styles.shelfBar} />
                        </View>
                        <View style={styles.container}>
                            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.containerImages}>
                                {shelfReading.slice(0, 15).map((book, idx) => (
                                    <TouchableNativeFeedback key={idx} onPress={() => handleBookPress(book)}>
                                        <View>
                                            <Image source={{ uri: book.cover }} style={styles.covers} />
                                        </View>
                                    </TouchableNativeFeedback>
                                ))}
                            </ScrollView>
                        </View>
                    </View>
                )}

                {shelfReadlist.length === 0 ? (
                    <View style={styles.box}>
                        <View style={styles.titleShelf}>
                            <Text style={styles.textContainer}>Readlist</Text>
                            <View style={styles.shelfBar} />
                        </View>
                        <View style={styles.noBooksContainer}>
                            <Text style={styles.noBooksText}>No books yet</Text>
                        </View>
                    </View>
                ) : (
                    <View style={styles.box}>
                        <View style={styles.titleShelf}>
                            <Text style={styles.textContainer}>{shelfReadlist.length} Readlist</Text>
                            <View style={styles.shelfBar} />
                        </View>
                        <View style={styles.container}>
                            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.containerImages}>
                                {shelfReadlist.slice(0, 15).map((book, idx) => (
                                    <TouchableNativeFeedback key={idx} onPress={() => handleBookPress(book)}>
                                        <View>
                                            <Image source={{ uri: book.cover }} style={styles.covers} />
                                        </View>
                                    </TouchableNativeFeedback>
                                ))}
                            </ScrollView>
                        </View>
                    </View>
                )}

                {/* Custom Shelves */}
                {(shelves.custom_shelves || []).slice(2).map((shelf, index) => (
                    <View key={`custom-${index}`}>
                        {shelf.books.length === 0 ? (
                            <View style={styles.box}>
                                <TouchableNativeFeedback onPress={() => handleShelfClick('ShelfPage', { shelfName: shelf.shelf_name })}>
                                    <View style={styles.titleShelf}>
                                        <Text style={styles.textContainer}>{shelf.shelf_name}</Text>
                                        <View style={styles.shelfBar} />
                                    </View>
                                </TouchableNativeFeedback>
                                <View style={styles.noBooksContainer}>
                                    <Text style={styles.noBooksText}>No books yet</Text>
                                </View>
                            </View>
                        ) : (
                            <View style={styles.box}>
                                <TouchableNativeFeedback onPress={() => handleShelfClick('ShelfPage', { shelfName: shelf.shelf_name })}>
                                    <View>
                                        <Text style={styles.textContainer}>{shelf.books.length} {shelf.shelf_name}</Text>
                                        <View style={styles.shelfBar} />
                                    </View>
                                </TouchableNativeFeedback>
                                <View style={styles.container}>
                                    <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.containerImages}>
                                        {shelf.books.slice(0, 15).map((book, idx) => (
                                            <TouchableNativeFeedback key={idx} onPress={() => handleBookPress(book)}>
                                                <View>
                                                    <Image source={{ uri: book.cover }} style={styles.covers} />
                                                </View>
                                            </TouchableNativeFeedback>
                                        ))}
                                    </ScrollView>
                                </View>
                            </View>
                        )}
                    </View>
                ))}
            </View>
        );
    }

    if (posts.length === 0) {
        const message = selection === 'photo' 
            ? "This user didn't post anything yet"
            : "This user doesn't have any interactions yet";
            
        return (
            <View style={styles.card}>
                <View style={styles.notFoundContainer}>
                    <Text style={styles.notFoundText}>
                        {message}
                    </Text>
                </View>
            </View>
        );
    }    
    
    return (
        <View style={styles.card}>
            {posts.map((post, index) => (
                <PostPartial navigation={navigation} postData={JSON.stringify(post)} apiBaseUrl={apiBaseUrl} key={`${selection}-${post.id || index}`} />
            ))}
        </View>
    );
}

const styles = StyleSheet.create({
    card: {
        width: '95%',
        marginLeft: 6,
        marginRight: 6,
        alignSelf: 'center',
        alignItems: 'center',
    },
    notFoundContainer: {
        minHeight: 100,
        width: '100%', 
        backgroundColor: '#F7EDF1',
        borderRadius: 8,
        alignItems: 'center',
        justifyContent: 'center'
    },
    notFoundText: {
        fontSize: 32,
        fontWeight: 'semibold',
        color: '#E5C3D1',
        fontFamily: 'Nunito_600SemiBold',
        flexWrap: 'wrap',
        textAlign: 'center',
        padding: 12,
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
        fontSize: 22,
        color: '#18101D',
        fontFamily: 'Nunito_600SemiBold',
        marginBottom: 8,
        marginHorizontal: 2,
    },
    noBooksContainer: {
        alignItems: 'center',
    },
    noBooksText: {
        fontFamily: 'Nunito_500Medium',
        color: '#613F75',
        fontSize: 20, 
        marginTop: 10,
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
    shelfBar: {
        height: 2,
        width: 280,
        alignItems: 'center',
        backgroundColor: '#E5C3D1', 
        marginTop: 4,
    },
    titleShelf: {
        alignItems: 'center',
        height: 42,
        marginBottom: 10,
    },
    box: {
        marginBottom: 30,
    },
});
