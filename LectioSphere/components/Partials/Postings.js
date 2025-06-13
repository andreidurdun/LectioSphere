import React, { useEffect, useState } from 'react';
import { StyleSheet, Text, View, FlatList, TouchableWithoutFeedback, Image, TouchableNativeFeedback, ScrollView } from "react-native";
import { useFonts, Nunito_400Regular, Nunito_500Medium, Nunito_600SemiBold } from '@expo-google-fonts/nunito';
import axios from 'axios';
import PostPartial from './PostPartial'; // Adjust the import path as necessary
import AsyncStorage from '@react-native-async-storage/async-storage';


export default function Postings ({ navigation, apiBaseUrl, selection }) {

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
                // console.error(`Error loading shelf:`, error.message);
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
                // console.error(`Error loading shelf:`, error.message);
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
                // console.error(`Error loading shelf:`, error.message);
            }
        }
    };

    useEffect(() => {
        setLoading(true);
        setPosts([]);
        fetchShelves();
        fetchShelf('Read');
        fetchShelfReading();
        fetchShelfReadlist();
        
        
        let endpoint = '';
        
        if (selection === 'photo') {
            endpoint = `${apiBaseUrl}/posts/post_type`;
        } else if (selection === 'glasses') {
            endpoint = `${apiBaseUrl}/posts/non_post_type`;
        } else if (selection === 'closedBook') {
            // Pentru closedBook, nu facem cerere API încă
            setLoading(false);
            return;
        }

        if (endpoint) {
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
    }, [selection, apiBaseUrl]); // Re-run when selection or apiBaseUrl changes

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
                {/* {Object.entries(shelves).map(([shelfName, books]) => (
                <View key={shelfName} style={styles.shelfBlock}>
                    <Text style={styles.shelfHeader}>
                    {books.length} {shelfName.toUpperCase()}
                    </Text>
                    <FlatList
                    horizontal
                    data={books}
                    keyExtractor={(item, i) => item.id?.toString() || i.toString()}
                    renderItem={({ item }) => (
                        <TouchableWithoutFeedback
                        onPress={() => navigation.navigate('BookShow', { bookData: JSON.stringify(item) })}
                        >
                        <Image source={{ uri: item.thumbnail }} style={styles.cover} />
                        </TouchableWithoutFeedback>
                    )}
                    showsHorizontalScrollIndicator={false}
                    />
                </View>
                ))} */}
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
                    
                
                    {/* Custom Shelves (list-based) */}
                    {(shelves.custom_shelves || []).slice(2).map((shelf, index) => (
                        <View key={`custom-${index}`} >
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
            ? "You didn't post anything yet"
            : "You don't have any interactions yet";
            
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
    shelfBlock: {
        marginBottom: 24,
    },
    shelfHeader: {
        fontFamily: 'Nunito_600SemiBold',
        fontSize: 20,
        marginBottom: 8,
        color: '#18101D',
    },
    cover: {
        width: 80,
        height: 120,
        borderRadius: 4,
        marginRight: 12,
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
