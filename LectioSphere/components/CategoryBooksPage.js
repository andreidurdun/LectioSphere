import React, { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Alert, SafeAreaView, Image, FlatList, TouchableWithoutFeedback, TouchableNativeFeedback } from 'react-native';
import NavBar from './Partials/NavBar';
import TopBar from './Partials/TopBar';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import { useFonts, Nunito_400Regular, Nunito_500Medium, Nunito_600SemiBold } from '@expo-google-fonts/nunito';
import { refreshAccessToken } from './refreshAccessToken'; 

//TO DO: completat cu informatii dupa ce termina Dani postarile

const CategoryBooksPage = ({ route, navigation, removeAuthToken, isAuthenticated, apiBaseUrl }) => {
    const [userData, setUserData] = useState(null);
    const { category } = route.params; // primeste titlul paginii (categoria)
    const categoryMap = {
        'Recently Published': 'recent',
        'Popular Now': 'popular',
        'Adventure': 'adventure', 
        'Fantasy': 'fantasy',
        'Romance': 'romance', 
        'Thriller': 'thriller', 
        'Science Fiction': 'science fiction', 
        'Biography': 'biography', 
        'History': 'history', 
        'Psychology': 'psychology', 
        'Business': 'business', 
        'Economics': 'economics', 
        'Technology': 'technology', 
        'Health': 'health', 
        'Nutrition': 'nutrition', 
        'Travel': 'travel', 
        'Reccomendations': 'reccomendations',
        'Your friends are reading': 'your friends are reading',
    };
    const categoryName = categoryMap[category]; 
    const [books, setBooks] = useState([]); 

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

    const fetchBooks = async () => {
        try {
            let token = await AsyncStorage.getItem('auth_token');
            let response;
            if ( categoryName === 'reccomendations' ) {
                response = await axios.get(`${apiBaseUrl}/books/recommendation/`, {
                    headers: { Authorization: `JWT ${token}` }
                });
            }
            else {
                if ( categoryName === 'your friends are reading') {
                    response = await axios.get(`${apiBaseUrl}/books/get_friends_books/`, {
                        headers: { Authorization: `JWT ${token}` }
                    });
                }
                else {
                    response = await axios.get(`${apiBaseUrl}/books/category/?name=${categoryName}`, {
                        headers: { Authorization: `JWT ${token}` }
                    });
                }
            }
            // Filtrăm cărțile care au un `thumbnail` valid
            const booksWithThumbnail = response.data.filter(book => book.thumbnail).map(book => ({
                ...book,
                title: book.title ?? 'Unknown title',
                author: book.author ?? (book.authors?.join(', ') ?? 'Unknown author'),
                rating: book.rating ?? book.average_rating ?? 'N/A',
                genre: book.genre ?? 'General',
            }));
            setBooks(booksWithThumbnail);
        } catch (error) {
            if (error.response?.status === 401) {
                const newToken = await refreshAccessToken(apiBaseUrl);
                if (newToken) {
                    let retryResponse;
                    if ( categoryName === 'reccomendations' ) {
                        retryResponse = await axios.get(`${apiBaseUrl}/books/recommendation/`, {
                            headers: { Authorization: `JWT ${token}` }
                        });
                    }
                    else {
                        if ( categoryName === 'your friends are reading') {
                            retryResponse = await axios.get(`${apiBaseUrl}/books/get_friends_books/`, {
                                headers: { Authorization: `JWT ${token}` }
                            });
                        }
                        else {
                            retryResponse = await axios.get(`${apiBaseUrl}/books/category/?name=${categoryName}`, {
                                headers: { Authorization: `JWT ${token}` }
                            });
                        }
                    }
                    const booksWithThumbnail = retryResponse.data.filter(book => book.thumbnail).map(book => ({
                        ...book,
                        title: book.title ?? 'Unknown title',
                        author: book.author ?? (book.authors?.join(', ') ?? 'Unknown author'),
                        rating: book.rating ?? book.average_rating ?? 'N/A',
                        genre: book.genre ?? 'General',
                    }));
                    setBooks(booksWithThumbnail);
                } else {
                    console.error(`Unable to refresh token for ${categoryName}.`);
                }
            } else {
                console.error(`Error loading ${categoryName}:`, error.message);
            }
        }
    };

    const renderBook = ({ item }) => (
        <TouchableWithoutFeedback onPress={() => handleBookPress(item)}>
            <View style={styles.bookContainer}>
                <Image source={{ uri: item.thumbnail }} style={styles.covers} />
                <View style={styles.infoContainer}>
                    <Text style={styles.textInfoTitle}>{item.title}</Text>
                    <Text style={styles.textInfoAuthor}>{item.author}</Text>
                    <Text style={styles.textInfo}>{item.rating}</Text>
                </View>
            </View>
        </TouchableWithoutFeedback>
    );

    const handleBookPress = (book) => {
        navigation.navigate('BookShow', { 
            bookData: JSON.stringify(book)
        });
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
            fetchBooks();
        }
    }, [isAuthenticated]);

    if (!fontsLoaded) {
        return <Text>Loading fonts...</Text>;
    }

    

    return (
        <SafeAreaView style={styles.screen}>
            <TopBar pageName="SearchPage" />

            <FlatList
                data={books}
                renderItem={renderBook}
                keyExtractor={(item) => item.id}
                showsVerticalScrollIndicator={false} 
                ListHeaderComponent={
                    <View style={styles.categoryContainer}>
                        <Text style={styles.textCategory}> {category} </Text>
                        <View style={styles.horizontalBar} />
                    </View>
                }
                contentContainerStyle={{
                    alignItems: 'center',
                    paddingTop: 75,
                    paddingBottom: 65,
                }}
            />
            


            <NavBar navigation={navigation} page="SearchPage" />
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    screen: {
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
    textCategory: {
        fontFamily: 'Nunito_600SemiBold',
        fontSize: 20,
        color: '#18101D',
    },
    horizontalBar: {
        height: 2,
        width: 240,
        alignItems: 'center',
        backgroundColor: '#613F75', 
        marginTop: 4, 
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

export default CategoryBooksPage;