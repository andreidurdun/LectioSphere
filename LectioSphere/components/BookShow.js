import React, { useEffect, useState } from 'react';
import { View, Text, ActivityIndicator, StyleSheet, Image, ScrollView, SafeAreaView, TouchableNativeFeedback } from 'react-native';
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { refreshAccessToken } from './refreshAccessToken';
import { useFonts, Nunito_400Regular, Nunito_500Medium, Nunito_600SemiBold, Nunito_700Bold } from '@expo-google-fonts/nunito';
import NavBar from './Partials/NavBar';
import TopBar from './Partials/TopBar';

const purpleStarFull = require('../assets/purpleStarFull.png');
const purpleStarEmpty = require('../assets/purpleStarEmpty.png');

const BookShow = ({ navigation, route, apiBaseUrl }) => {

    const [bookData, setBookData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [seeMorePressed, setSeeMorePressed] = useState(false);

    const [fontsLoaded] = useFonts({
        Nunito_400Regular,
        Nunito_500Medium,
        Nunito_600SemiBold,
        Nunito_700Bold
    });

    useEffect(() => {
        if (route.params?.bookData) {
            try {
                const parsedBook = JSON.parse(route.params.bookData);
                setBookData(parsedBook);
                setLoading(false);
            } catch (err) {
                console.error('Error parsing book data:', err);
                setError('Failed to load book details. Invalid data format.');
                setLoading(false);
            }
        } else {
            setError('Book information is missing');
            setLoading(false);
        }
    }, [route.params]);

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

    if (!bookData) {
        return (
            <SafeAreaView style={styles.errorContainer}>
                <Text style={styles.errorText}>Book not found</Text>
            </SafeAreaView>
        );
    }


    // TODO: redirectionare catre o categorie la apasarea ei, completare cu postari

    return (
        <SafeAreaView style={styles.screen}>
            <TopBar pageName="SearchPage" />

            <ScrollView 
                style={styles.scrollViewStyle} 
                contentContainerStyle={styles.scrollContainer}>

                <View style={[styles.infoContainer]}>
                        {bookData.thumbnail && (
                            <Image 
                                source={{ uri: bookData.thumbnail }} 
                                style={styles.coverImage} 
                                resizeMode="cover"
                            />
                        )}

                        <View style={[styles.titleAuthors]}>
                            <Text style={styles.title}>
                                {bookData.title}
                            </Text>

                            {bookData.authors && bookData.authors.length > 0 && (
                                <View style={[styles.authorsContainer, { alignItems: 'center' }]}>
                                    {bookData.authors.map((author, index) => (
                                        <Text key={index} style={styles.author}>
                                            {author}
                                        </Text>
                                    ))}
                                </View>
                            )}

                            <TouchableNativeFeedback 
                                onPress={() => {
                                    // Logic to add the book to the library
                                    console.log(`${bookData.title} added to library`);
                                }}
                            >
                                <View style={styles.addButtonTouchable}>
                                    <Text style={styles.addButtonText}>
                                        Add to Library
                                    </Text>
                                </View>
                            </TouchableNativeFeedback>
                    </View>

                </View>
                
                <View style={styles.ratingContainer}>
                    <View style={styles.ratingStars}>
                        <Image style={styles.star} source={purpleStarFull}/>
                        <Image style={styles.star} source={purpleStarFull}/>
                        <Image style={styles.star} source={purpleStarFull}/>
                        <Image style={styles.star} source={purpleStarFull}/>
                        <Image style={styles.star} source={purpleStarEmpty}/>
                    </View>
                    <Text style={styles.ratingText}>
                        4.25
                    </Text>
                </View>

                {bookData.description && (
                    <View style={styles.descriptionContainer}>
                        <Text style={styles.descriptionTitle}>Description</Text>
                        <View style={styles.horizontalLine}></View>
                        <Text 
                            style={styles.description} 
                            numberOfLines={seeMorePressed ? undefined : 12} 
                            ellipsizeMode={seeMorePressed ? undefined : "tail"}
                        >
                            {bookData.description}
                        </Text>
                        <TouchableNativeFeedback 
                            onPress={() => setSeeMorePressed(!seeMorePressed)}
                        >
                            <Text style={styles.showMoreDescription}>
                                {seeMorePressed ? "Show Less" : "Show More"}
                            </Text>
                        </TouchableNativeFeedback>
                    </View>
                )}

                <View style={styles.moreInfoContainer}>
                    <Text style={styles.moreInfoTitle}>More Info</Text>
                    {bookData.pageCount && (
                        <View style={styles.detailRow}>
                            <Text style={styles.label}>Pages:</Text>
                            <Text style={styles.value}>{bookData.pageCount}</Text>
                        </View>
                    )}
                    {bookData.categories && bookData.categories.length > 0 && (
                        <View style={styles.detailRow}>
                            <Text style={styles.label}>Genres:</Text>
                            <Text style={styles.value}>
                                {bookData.categories.join(', ')}
                            </Text>
                        </View>
                    )}
                    {bookData.isbn && (
                        <View style={styles.detailRow}>
                            <Text style={styles.label}>ISBN:</Text>
                            <Text style={styles.value}>{bookData.isbn}</Text>
                        </View>
                    )}
                    {bookData.publishedDate && (
                        <View style={styles.detailRow}>
                            <Text style={styles.label}>Publishing Date:</Text>
                            <Text style={styles.value}>{bookData.publishedDate}</Text>
                        </View>
                    )}
                    {bookData.publisher && (
                        <View style={styles.detailRow}>
                            <Text style={styles.label}>Publisher:</Text>
                            <Text style={styles.value}>{bookData.publisher}</Text>
                        </View>
                    )}
                </View>

                <View style={styles.reviewsContainer}>
                    <Text style={styles.reviewsTitle}>
                        Reviews from people you follow
                    </Text>
                    {/* Aici o sa vina apelul catre review-urile cartii cand sunt gata postarile */}
                    <View style={styles.reviews}>
                        <Text style={styles.reviewsPlaceholder}>
                            Currently, there are no reviews
                        </Text>
                    </View>
                </View>

                <View style={styles.reviewsContainer}>
                    <Text style={styles.reviewsTitle}>
                        All reviews
                    </Text>
                    {/* Aici o sa vina apelul catre review-urile cartii cand sunt gata postarile */}
                    <View style={styles.reviews}>
                        <Text style={styles.reviewsPlaceholder}>
                            Currently, there are no reviews
                        </Text>
                    </View>
                </View>

            </ScrollView>
            
            <NavBar navigation={navigation} page="SearchPage" />
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    screen: {
        flex: 1,
        backgroundColor: '#FCF8FA',
    },
    scrollViewStyle: {
        marginTop: 72,
        flex: 1,
    },
    scrollContainer: {
        padding: 6,
        marginTop: 10,
        paddingBottom: 80, // Spațiu pentru NavBar
    },
    infoContainer: {
        backgroundColor: '#F7EDF1',
        borderColor: '#F3E3E9',
        borderWidth: 1,
        borderRadius: 8,
        padding: 18,
        marginVertical: 8,
        marginLeft: 6,
        marginRight: 6,
        flexDirection: 'row',
        alignItems: 'center'
    },
    titleAuthors: {
        flexDirection: 'column',
        alignContent: 'center',
        alignItems: 'center',
        justifyContent: 'center',
        width: 192,
        maxHeight: 192,
        paddingLeft: 16,
    },
    coverImage: {
        height: 192,
        width: 128,
        alignSelf: 'center',
        borderRadius: 8,
    },
    title: {
        fontSize: 18,
        fontWeight: 'bold',
        marginBottom: 16,
        fontFamily: 'Nunito_700Bold',
        flexWrap: 'wrap',
        color: '#18101D',
        textAlign: 'center',
        width: 220
    },
    author: {
        fontFamily: 'Nunito_500Medium',
        fontSize: 16,
        color: '#613F75',
        textAlign: 'center'
    },
    addButtonTouchable: {
        backgroundColor: '#613F75',
        width: 120,
        height: 30,
        borderRadius: 15,
        justifyContent: 'center',
        alignItems: 'center',
        marginTop: 16,
    },
    addButtonText: {
        color: '#FCF8FA',
    },
    ratingContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        marginVertical: 8,
        alignSelf: 'center'
    },
    ratingStars: {
        flexDirection: 'row',
        marginRight: 8
    },
    star: {
        width: 24,
        height: 24,
        margin: 6
    },
    descriptionContainer: {
        marginVertical: 8,
        padding: 12,
        backgroundColor: '#F9F0F4',
        marginHorizontal: 6,
        borderRadius: 8,
    },
    descriptionTitle: {
        fontFamily: 'Nunito_600SemiBold',
        fontSize: 20,
        color: '#613F75',
        alignSelf: 'center',
        justifyContent: 'center',
        padding: 6,
    },
    horizontalLine: {
        height: 1,
        width: 236,
        backgroundColor: '#E5C3D1',
        alignSelf: 'center',
    },
    description: {
        fontFamily: 'Nunito_400Regular',
        fontSize: 16,
        color: '#18101D',
        marginTop: 8,
        lineHeight: 24,
        flexWrap: 'wrap',
    },
    showMoreDescription: {
        color: '#613F75',
        fontFamily: 'Nunito_500Medium',
        fontSize: 16,
        alignSelf: 'flex-end',
        marginTop: 8,
        paddingRight: 6,
        paddingBottom: 4,
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#FCF8FA',
    },
    moreInfoContainer: {
        marginVertical: 8,
        padding: 12,
        marginHorizontal: 6,
    },
    moreInfoTitle: {
        fontFamily: 'Nunito_600SemiBold',
        fontSize: 20,
        color: '#613F75',
        alignSelf: 'center',
        textAlign: 'center',
        justifyContent: 'center',
        padding: 6,
        width: 236,
        borderBottomColor: '#E5C3D1',
        borderBottomWidth: 1,
        marginBottom: 16
    },
    label: {
        fontFamily: 'Nunito_600SemiBold',
        fontSize: 16,
        color: '#18101D',
        marginRight: 8,
        flexWrap: 'wrap',
    },
    value: {
        fontFamily: 'Nunito_400Regular',
        fontSize: 16,
        color: '#18101D',
        flex: 1,
        flexWrap: 'wrap',
    },
    reviewsContainer: {
        marginVertical: 8,
        padding: 12,
        marginHorizontal: 6,
        borderRadius: 8,
    },
    reviewsTitle: {
        fontFamily: 'Nunito_600SemiBold',
        fontSize: 20,
        color: '#613F75',
        alignSelf: 'center',
        textAlign: 'center',
        justifyContent: 'center',
        padding: 6,
        width: 340,
        borderBottomColor: '#E5C3D1',
        borderBottomWidth: 1,
        marginBottom: 16
    },
    reviews: {
        
    },
    reviewsPlaceholder: {
        fontFamily: 'Nunito_600SemiBold',
        fontSize: 20,
        color: '#E5C3D1',
        alignSelf: 'center',
        textAlign: 'center',
        justifyContent: 'center',
    },



    loadingText: {
        marginTop: 10,
        fontSize: 16,
        fontFamily: 'Nunito_500Medium',
        color: '#613F75',
        textAlign: 'center',
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
    detailRow: {
        flexDirection: 'row',
        marginBottom: 8,
        flexWrap: 'wrap',
    },
    
    
    
});

export default BookShow;