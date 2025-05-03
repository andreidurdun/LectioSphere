import React, { useEffect, useState } from 'react';
import { View, Text, ActivityIndicator, StyleSheet, Image, ScrollView, SafeAreaView } from 'react-native';
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { refreshAccessToken } from './refreshAccessToken';
import { useFonts, Nunito_400Regular, Nunito_500Medium, Nunito_600SemiBold } from '@expo-google-fonts/nunito';

const BookShow = ({ book, navigation, apiBaseUrl }) => {
    const [rBook, setRBook] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const [fontsLoaded] = useFonts({
        Nunito_400Regular,
        Nunito_500Medium,
        Nunito_600SemiBold
    });

    useEffect(() => {
        const fetchBook = async () => {
            try {
                setLoading(true);
                let token = await AsyncStorage.getItem('auth_token');
                
                if (book && book.title) {
                    const response = await axios.get(`${apiBaseUrl}/books/search/${encodeURIComponent(book.title)}`, {
                        headers: { Authorization: `JWT ${token}` }
                    });
                    setRBook(response.data);
                } else {
                    setError('Book information is missing');
                }
                setLoading(false);
            } catch (error) {
                if (error.response?.status === 401) {
                    const newToken = await refreshAccessToken(apiBaseUrl);
                    if (newToken) {
                        try {
                            if (book && book.title) {
                                const retryResponse = await axios.get(`${apiBaseUrl}/books/search/?name=${book.title}`, {
                                    headers: { Authorization: `JWT ${newToken}` }
                                });
                                setRBook(retryResponse.data);
                            } else {
                                setError('Book information is missing');
                            }
                        } catch (retryError) {
                            console.error('Error fetching book after token refresh:', retryError);
                            setError('Failed to load book details.');
                        }
                    } else {
                        setError('Authentication failed. Please login again.');
                    }
                } else {
                    console.error('Error fetching book:', error);
                    setError('Failed to load book details. Please try again later.');
                }
                setLoading(false);
            }
        };

        if (apiBaseUrl) {
            fetchBook();
        }
    }, [book, apiBaseUrl]); // Changed to depend on the entire book object instead of book.title

    if (!fontsLoaded) {
        return <Text>Loading fonts...</Text>;
    }

    if (loading) {
        return (
            <SafeAreaView style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#613F75" />
                <Text style={styles.loadingText}>Loading book details...</Text>
            </SafeAreaView>
        );
    }

    if (error) {
        return (
            <SafeAreaView style={styles.errorContainer}>
                <Text style={styles.errorText}>{error}</Text>
            </SafeAreaView>
        );
    }

    // Use the fetched book data (rBook) or fall back to the prop (book)
    const displayBook = rBook || book;

    if (!displayBook) {
        return (
            <SafeAreaView style={styles.errorContainer}>
                <Text style={styles.errorText}>Book not found</Text>
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView style={styles.screen}>
            <ScrollView contentContainerStyle={styles.scrollContainer}>
                <View style={styles.container}>
                    {displayBook.thumbnail && (
                        <Image 
                            source={{ uri: displayBook.thumbnail }} 
                            style={styles.coverImage} 
                            resizeMode="cover"
                        />
                    )}
                    <Text style={styles.title}>{displayBook.title}</Text>
                    <View style={styles.detailRow}>
                        <Text style={styles.label}>Author:</Text>
                        <Text style={styles.value}>{displayBook.author}</Text>
                    </View>
                    {displayBook.isbn && (
                        <View style={styles.detailRow}>
                            <Text style={styles.label}>ISBN:</Text>
                            <Text style={styles.value}>{displayBook.isbn}</Text>
                        </View>
                    )}
                    {displayBook.publisher && (
                        <View style={styles.detailRow}>
                            <Text style={styles.label}>Publisher:</Text>
                            <Text style={styles.value}>{displayBook.publisher}</Text>
                        </View>
                    )}
                    {displayBook.published_date && (
                        <View style={styles.detailRow}>
                            <Text style={styles.label}>Published:</Text>
                            <Text style={styles.value}>{displayBook.published_date}</Text>
                        </View>
                    )}
                    {displayBook.description && (
                        <View style={styles.descriptionContainer}>
                            <Text style={styles.label}>Description:</Text>
                            <Text style={styles.description}>{displayBook.description}</Text>
                        </View>
                    )}
                </View>
            </ScrollView>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    screen: {
        flex: 1,
        backgroundColor: '#FCF8FA',
    },
    scrollContainer: {
        padding: 16,
    },
    container: {
        backgroundColor: '#F7EDF1',
        borderColor: '#F3E3E9',
        borderWidth: 1,
        borderRadius: 8,
        padding: 16,
        marginVertical: 8,
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#FCF8FA',
    },
    loadingText: {
        marginTop: 10,
        fontSize: 16,
        fontFamily: 'Nunito_500Medium',
        color: '#613F75',
    },
    errorContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#FCF8FA',
    },
    errorText: {
        fontSize: 16,
        fontFamily: 'Nunito_500Medium',
        color: '#E63946',
        textAlign: 'center',
    },
    coverImage: {
        width: 150,
        height: 220,
        alignSelf: 'center',
        borderRadius: 8,
        marginBottom: 16,
    },
    title: {
        fontSize: 24,
        fontWeight: 'bold',
        marginBottom: 16,
        fontFamily: 'Nunito_600SemiBold',
        color: '#18101D',
        textAlign: 'center',
    },
    detailRow: {
        flexDirection: 'row',
        marginBottom: 8,
    },
    label: {
        fontFamily: 'Nunito_600SemiBold',
        fontSize: 16,
        color: '#613F75',
        marginRight: 8,
    },
    value: {
        fontFamily: 'Nunito_400Regular',
        fontSize: 16,
        color: '#18101D',
        flex: 1,
    },
    descriptionContainer: {
        marginTop: 8,
    },
    description: {
        fontFamily: 'Nunito_400Regular',
        fontSize: 16,
        color: '#18101D',
        marginTop: 8,
        lineHeight: 24,
    },
});

export default BookShow;