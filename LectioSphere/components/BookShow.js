import React, { useEffect, useState } from 'react';
import { View, Text, ActivityIndicator, StyleSheet, Image, ScrollView, SafeAreaView, TouchableNativeFeedback, TextInput, Modal } from 'react-native';
import axios, { all } from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { refreshAccessToken } from './refreshAccessToken';
import { useFonts, Nunito_400Regular, Nunito_500Medium, Nunito_600SemiBold, Nunito_700Bold } from '@expo-google-fonts/nunito';
import NavBar from './Partials/NavBar';
import TopBar from './Partials/TopBar';
import PostPartial from './Partials/PostPartial';
import { Alert } from 'react-native';

const purpleStarFull = require('../assets/purpleStarFull.png');
const purpleStarEmpty = require('../assets/purpleStarEmpty.png');

const BookShow = ({ navigation, route, apiBaseUrl }) => {    const [bookData, setBookData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [reviewsLoading, setReviewsLoading] = useState(false);
    const [error, setError] = useState(null);
    const [seeMorePressed, setSeeMorePressed] = useState(false);    
    const [showPagesModal, setShowPagesModal] = useState(false);
    const [pagesInput, setPagesInput] = useState('');
    const [showLibraryModal, setShowLibraryModal] = useState(false);
    // Review modal states
    const [showReviewModal, setShowReviewModal] = useState(false);
    const [reviewRating, setReviewRating] = useState(0);
    const [reviewDescription, setReviewDescription] = useState('');    // Create post modal states
    const [showCreatePostModal, setShowCreatePostModal] = useState(false);
    const [postDescription, setPostDescription] = useState('');    // Followed users' reviews state
    const [followedPosts, setFollowedPosts] = useState([]);
    // All reviews state
    const [allPosts, setAllPosts] = useState([]);

    const [shelves, setShelves] = useState([]);              
    const [showShelfModal, setShowShelfModal] = useState(false);

    const [fontsLoaded] = useFonts({
        Nunito_400Regular,
        Nunito_500Medium,
        Nunito_600SemiBold,
        Nunito_700Bold    });

    useEffect(() => {
        fetchShelves();
    }, []);
      
    // useEffect for parsing book data
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
                setReviewsLoading(false);
            }
        } else {
            setError('Book information is missing');
            setLoading(false);
            setReviewsLoading(false);
        }
    }, [route.params]);

    // Fetch functions
    const fetchShelves = async () => {
        try {
            let token = await AsyncStorage.getItem('auth_token');
            const response = await axios.get(`${apiBaseUrl}/library/shelves/`, {
                headers: { Authorization: `JWT ${token}` }
            });
            const shelves = response.data.custom_shelves.slice(2);
            setShelves(shelves);
        } catch (error) {
            if (error.response?.status === 401) {
                const newToken = await refreshAccessToken(apiBaseUrl);
                if (newToken) {
                    const retryResponse = await axios.get(`${apiBaseUrl}/library/shelves/`, {
                        headers: { Authorization: `JWT ${newToken}` }
                    });
                    const shelves = retryResponse.data.custom_shelves.slice(2);
                    setShelves(shelves);
                } else {
                    console.error(`Unable to refresh token for shelves.`);
                }
            } else {
                console.error(`Error loading shelves:`, error.message);
            }
        }
    };

    const fetchReviewFollowed = async (bookId) => {
        try {
            const token = await AsyncStorage.getItem('auth_token');
            if (!token) {
                Alert.alert('Error', 'You are not logged in.');
                return null;
            }

            const response = await axios.get(
                `${apiBaseUrl}/posts/reviews/followed/${bookData.id}/`,
                {
                    headers: {
                        Authorization: `JWT ${token}`,
                    },
                }
            );

            return response.data;        
        } catch (error) {
            console.error('Error fetching reviews from followed users:', error);
            Alert.alert('Error', 'Could not load reviews.', [{ text: 'OK' }]);
            return null;
        }
    };

    const fetchReviewAll = async (bookId) => {
        try {
            const token = await AsyncStorage.getItem('auth_token');
            if (!token) {
                Alert.alert('Error', 'You are not logged in.');
                return null;
            }

            const response = await axios.get(
                `${apiBaseUrl}/posts/reviews/${bookData.id}/`,
                {
                    headers: {
                        Authorization: `JWT ${token}`,
                    },
                }
            );

            // console.log('Reviews from all users:', response.data);
            return response.data;
        }
        catch (error) {
            console.error('Error fetching reviews from followed users:', error);
            Alert.alert('Error', 'Could not load reviews.', [{ text: 'OK' }]);
            return null;
        }    
    };

    // Fetch both types of reviews when bookData is available
    useEffect(() => {
        if (bookData && bookData.id) {
            const fetchAllReviews = async () => {
                // console.log('Starting to fetch reviews for book:', bookData.id);
                setReviewsLoading(true);
                
                try {
                    // Fetch both types of reviews in parallel
                    const [followedReviews, allReviews] = await Promise.allSettled([
                        fetchReviewFollowed(bookData.id),
                        fetchReviewAll(bookData.id)
                    ]);
                    
                    // Set the reviews data
                    if (followedReviews.status === 'fulfilled' && followedReviews.value) {
                        // console.log('Setting followed posts:', followedReviews.value);
                        setFollowedPosts(followedReviews.value);
                    } else {
                        // console.log('No followed reviews or error:', followedReviews);
                        setFollowedPosts([]);
                    }
                    
                    if (allReviews.status === 'fulfilled' && allReviews.value) {
                        // console.log('Setting all posts:', allReviews.value);
                        setAllPosts(allReviews.value);
                    } else {
                        // console.log('No all reviews or error:', allReviews);
                        setAllPosts([]);
                    }
                } catch (error) {
                    console.error('Error fetching reviews:', error);
                    setFollowedPosts([]);
                    setAllPosts([]);
                } finally {
                    // console.log('Finished fetching reviews, setting reviewsLoading to false');
                    setReviewsLoading(false);
                }
            };
            
            fetchAllReviews();
        }
    }, [bookData]);

    // Early returns after all hooks
    // if (!fontsLoaded) {
    //     return <Text>Loading fonts...</Text>;
    // }

    // console.log('Loading states - loading:', loading, 'reviewsLoading:', reviewsLoading);

    if (loading || reviewsLoading) {
        return (
            <SafeAreaView style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#613F75" />
                <Text style={styles.loadingText}>
                    {loading ? 'Loading book details...' : 'Loading reviews...'}
                </Text>
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
    
    const handleAddToLibrary = async () => {
        setShowLibraryModal(true);
    };    
    
    const handleUpdateReading = async () => {
        // Show modal for pages input
        setPagesInput('');
        setShowPagesModal(true);
    };
    
    const handlePagesSubmit = async () => {
        const pagesRead = parseInt(pagesInput) || 0;
        if (pagesRead <= 0) {
            Alert.alert('Invalid Input', 'Please enter a valid number of pages greater than 0.');
            return;
        }
        
        setShowPagesModal(false);
        await updateBookProgress(pagesRead);
        setPagesInput('');
    };
      
    const handleModalCancel = () => {
        setShowPagesModal(false);
        setPagesInput('');
    };    
    
    const handleLibraryModalCancel = () => {
        setShowLibraryModal(false);
    };

    const handleLibraryAction = (action) => {
        setShowLibraryModal(false);
          switch(action) {
            case 'update_reading':
                handleUpdateReading();
                break;
            case 'finish_reading':
                handleFinishReading();
                break;
            case 'want_to_read':
                handleWantToRead();
                break;
            case 'add_to_shelf':
                handleAddToShelf();
                break;            
            case 'create_post':
                handleCreatePost();
                break;
            case 'add_review':
                handleAddReview();
                break;        }
    };    
    
    const handleAddReview = async () => {
        // Show modal for review input
        setReviewRating(0);
        setReviewDescription('');
        setShowReviewModal(true);
    };    
    
    const handleReviewSubmit = async () => {
        if (reviewRating === 0) {
            Alert.alert('Rating Required', 'Please select a rating (1-5 stars).');
            return;
        }
          setShowReviewModal(false);
        await submitReview(reviewRating, reviewDescription);
        setReviewRating(0);
        setReviewDescription('');
    };    
    
    const handleReviewModalCancel = () => {
        setShowReviewModal(false);
        setReviewRating(0);
        setReviewDescription('');
    };
    
    const submitReview = async (rating, description) => {
        try {
            const token = await AsyncStorage.getItem('auth_token');
            if (!token) {
                Alert.alert('Error', 'You are not logged in.');
                return;
            }

            const reviewData = {
                action: 'review',
                rating: rating,
                id: bookData.id
            };

            // Only add description if it's not empty
            if (description && description.trim()) {
                reviewData.description = description.trim();
            }

            // console.log('Sending review data:', reviewData); // Debug log

            const response = await axios.post(
                `${apiBaseUrl}/posts/add/`,
                reviewData,
                {
                    headers: {
                        Authorization: `JWT ${token}`,
                        'Content-Type': 'application/json',
                    },
                }
            );            Alert.alert(
                'Success',
                'Your review has been added successfully!',
                [{ text: 'OK' }]
            );
        } catch (error) {
            console.error('Review submission error:', error); // Debug log
            let errorMessage = 'Failed to add review.';
            
            if (error.response) {
                // console.log('Error response status:', error.response.status);
                // console.log('Error response data:', error.response.data);
                
                if (error.response.data) {
                    if (typeof error.response.data === 'string') {
                        errorMessage = error.response.data;
                    } else if (error.response.data.detail) {
                        errorMessage = error.response.data.detail;
                    } else if (error.response.data.message) {
                        errorMessage = error.response.data.message;
                    } else {
                        errorMessage = `Server error: ${error.response.status}`;
                    }
                }
            } else if (error.request) {
                errorMessage = 'Network error. Please check your connection.';
            } else {
                errorMessage = error.message || 'Unknown error occurred.';
            }
            
            Alert.alert(
                'Review Failed',
                errorMessage,
                [{ text: 'OK' }]
            );
        }
    };    
    
    const handleCreatePost = async () => {
        // Show modal for create post input
        setPostDescription('');
        setShowCreatePostModal(true);
    };

    const handleCreatePostSubmit = async () => {
        if (!postDescription || !postDescription.trim()) {
            Alert.alert('Description Required', 'Please write a description for your post.');
            return;
        }
          
        setShowCreatePostModal(false);
        await submitCreatePost(postDescription);
        setPostDescription('');
    };

    const handleCreatePostModalCancel = () => {
        setShowCreatePostModal(false);
        setPostDescription('');
    };

    const submitCreatePost = async (description) => {
        try {
            const token = await AsyncStorage.getItem('auth_token');
            if (!token) {
                Alert.alert('Error', 'You are not logged in.');
                return;
            }

            const postData = {
                action: 'post',
                description: description.trim(),
                id: bookData.id
            };

            // console.log('Sending create post data:', postData); // Debug log

            const response = await axios.post(
                `${apiBaseUrl}/posts/add/`,
                postData,
                {
                    headers: {
                        Authorization: `JWT ${token}`,
                        'Content-Type': 'application/json',
                    },
                }
            );

            Alert.alert(
                'Success',
                'Your post has been created successfully!',
                [{ text: 'OK' }]
            );
        } catch (error) {
            console.error('Create post submission error:', error); // Debug log
            let errorMessage = 'Failed to create post.';
            
            if (error.response) {
                // console.log('Error response status:', error.response.status);
                // console.log('Error response data:', error.response.data);
                
                if (error.response.data) {
                    if (typeof error.response.data === 'string') {
                        errorMessage = error.response.data;
                    } else if (error.response.data.detail) {
                        errorMessage = error.response.data.detail;
                    } else if (error.response.data.message) {
                        errorMessage = error.response.data.message;
                    } else {
                        errorMessage = `Server error: ${error.response.status}`;
                    }
                }
            } else if (error.request) {
                errorMessage = 'Network error. Please check your connection.';
            } else {
                errorMessage = error.message || 'Unknown error occurred.';
            }
            
            Alert.alert(
                'Create Post Failed',
                errorMessage,
                [{ text: 'OK' }]
            );
        }
    };


    //MERGE
    const handleFinishReading = async () => {
        try {
            const token = await AsyncStorage.getItem('auth_token');
            if (!token) {
                Alert.alert('Error', 'You are not logged in.');
                return;
            }

            // Try refresh token if needed (optional, depends on your backend)
            // await refreshAccessToken();

            const responsePost = await axios.post(
                `${apiBaseUrl}/posts/add/`,
                {
                    action: 'finished_reading',
                    id: bookData.id // Most APIs expect 'book_id', not 'id'
                },
                {
                    headers: {
                        Authorization: `JWT ${token}`,
                        'Content-Type': 'application/json',
                    },
                }
            );

            const bookPayload = {
                book: {
                    ISBN: bookData.ISBN || bookData.isbn || 'ISBN-NOT-FOUND', // trebuie să existe
                    id: bookData.id, // poate fi Google ID
                    title: bookData.title ?? 'Unknown Title',
                    author: bookData.author ?? (bookData.authors?.join(', ') ?? 'Unknown Author'),
                    genre: bookData.genre ?? (bookData.categories?.[0] ?? 'General'),
                    rating: bookData.rating ?? bookData.average_rating ?? 0,
                    nr_pages: bookData.nr_pages ?? bookData.pageCount ?? 0,
                    publication_year: bookData.publication_year ?? (
                        bookData.publishedDate ? parseInt(bookData.publishedDate.slice(0, 4)) : null
                    ),
                    series: bookData.series ?? '',
                    description: bookData.description ?? '',
                    thumbnail: bookData.thumbnail ?? bookData.cover ?? 'https://default-cover.jpg',
                }
            };

            const responseShelf = await axios.post(
                `${apiBaseUrl}/books/read/add/`,
                bookPayload,
                {
                    headers: {
                        Authorization: `JWT ${token}`,
                        'Content-Type': 'application/json',
                    },
                }
            );

            Alert.alert(
                'Success',
                `You finished reading this book!`,
                [{ text: 'OK' }]
            );
        } catch (error) {
            let errorMessage = 'Failed to annotate book.';
            if (error.response && error.response.data) {
                if (typeof error.response.data === 'string') {
                    errorMessage = error.response.data;
                } else if (error.response.data.detail) {
                    errorMessage = error.response.data.detail;
                }
            }
            Alert.alert(
                'Update Failed',
                errorMessage,
                [{ text: 'OK' }]
            );
        }
    };
    
    //MERGE
    const handleWantToRead = async () => {
        try {
            const token = await AsyncStorage.getItem('auth_token');
            if (!token) {
                Alert.alert('Error', 'You are not logged in.');
                return;
            }

            // Try refresh token if needed (optional, depends on your backend)
            // await refreshAccessToken();

            const response = await axios.post(
                `${apiBaseUrl}/posts/add/`,
                {
                    action: 'want_to_read',
                    id: bookData.id // Most APIs expect 'book_id', not 'id'
                },
                {
                    headers: {
                        Authorization: `JWT ${token}`,
                        'Content-Type': 'application/json',
                    },
                }
            );

            const bookPayload = {
                book: {
                    ISBN: bookData.ISBN || bookData.isbn || 'ISBN-NOT-FOUND', // trebuie să existe
                    id: bookData.id, // poate fi Google ID
                    title: bookData.title ?? 'Unknown Title',
                    author: bookData.author ?? (bookData.authors?.join(', ') ?? 'Unknown Author'),
                    genre: bookData.genre ?? (bookData.categories?.[0] ?? 'General'),
                    rating: bookData.rating ?? bookData.average_rating ?? 0,
                    nr_pages: bookData.nr_pages ?? bookData.pageCount ?? 0,
                    publication_year: bookData.publication_year ?? (
                        bookData.publishedDate ? parseInt(bookData.publishedDate.slice(0, 4)) : null
                    ),
                    series: bookData.series ?? '',
                    description: bookData.description ?? '',
                    thumbnail: bookData.thumbnail ?? bookData.cover ?? 'https://default-cover.jpg',
                }
            };

            const responseShelf = await axios.post(
                `${apiBaseUrl}/books/read_list/add/`,
                bookPayload,
                {
                    headers: {
                        Authorization: `JWT ${token}`,
                        'Content-Type': 'application/json',
                    },
                }
            );

            Alert.alert(
                'Success',
                `Your now want to read this book!`,
                [{ text: 'OK' }]
            );
        } catch (error) {
            let errorMessage = 'Failed to annotate book.';
            if (error.response && error.response.data) {
                if (typeof error.response.data === 'string') {
                    errorMessage = error.response.data;
                } else if (error.response.data.detail) {
                    errorMessage = error.response.data.detail;
                }
            }
            Alert.alert(
                'Update Failed',
                errorMessage,
                [{ text: 'OK' }]
            );
        }
    };

    const handleAddToShelf= async (shelfName) => {
        try {
            const token = await AsyncStorage.getItem('auth_token');
            if (!token) {
                Alert.alert('Error', 'You are not logged in.');
                return;
            }

            // Try refresh token if needed (optional, depends on your backend)
            // await refreshAccessToken();

            const bookPayload = {
                book: {
                    ISBN: bookData.ISBN || bookData.isbn || 'ISBN-NOT-FOUND', // trebuie să existe
                    id: bookData.id, // poate fi Google ID
                    title: bookData.title ?? 'Unknown Title',
                    authors: bookData.authors ?? (bookData.authors?.join(', ') ?? 'Unknown Author'),
                    genre: bookData.genre ?? (bookData.categories?.[0] ?? 'General'),
                    rating: bookData.rating ?? bookData.average_rating ?? 0,
                    nr_pages: bookData.nr_pages ?? bookData.pageCount ?? 0,
                    publication_year: bookData.publication_year ?? (
                        bookData.publishedDate ? parseInt(bookData.publishedDate.slice(0, 4)) : null
                    ),
                    series: bookData.series ?? '',
                    description: bookData.description ?? '',
                    thumbnail: bookData.thumbnail ?? bookData.cover ?? 'https://default-cover.jpg',
                }
            };

            const responseShelf = await axios.post(
                `${apiBaseUrl}/library/add_book_to_shelf/${encodeURIComponent(shelfName)}/`,
                bookPayload,
                {
                    headers: {
                        Authorization: `JWT ${token}`,
                        'Content-Type': 'application/json',
                    },
                }
            );

            Alert.alert(
                'Success',
                `You can find this book in your shelf!`,
                [{ text: 'OK' }]
            );
        } catch (error) {
            let errorMessage = 'Failed to annotate book.';
            if (error.response && error.response.data) {
                if (typeof error.response.data === 'string') {
                    errorMessage = error.response.data;
                } else if (error.response.data.detail) {
                    errorMessage = error.response.data.detail;
                }
            }
            Alert.alert(
                'Update Failed',
                errorMessage,
                [{ text: 'OK' }]
            );
        }
    };
    
    //MERGE
    const updateBookProgress = async (pagesRead) => {
        try {
            const token = await AsyncStorage.getItem('auth_token');
            if (!token) {
                Alert.alert('Error', 'You are not logged in.');
                return;
            }

            // Try refresh token if needed (optional, depends on your backend)
            // await refreshAccessToken();

            const response = await axios.post(
                `${apiBaseUrl}/posts/add/`,
                {
                    action: 'made_progress',
                    pages_read: pagesRead,
                    id: bookData.id // Most APIs expect 'book_id', not 'id'
                },
                {
                    headers: {
                        Authorization: `JWT ${token}`,
                        'Content-Type': 'application/json',
                    },
                }
            );

            const bookPayload = {
                book: {
                    ISBN: bookData.ISBN || bookData.isbn || 'ISBN-NOT-FOUND', // trebuie să existe
                    id: bookData.id, // poate fi Google ID
                    title: bookData.title ?? 'Unknown Title',
                    author: bookData.author ?? (bookData.authors?.join(', ') ?? 'Unknown Author'),
                    genre: bookData.genre ?? (bookData.categories?.[0] ?? 'General'),
                    rating: bookData.rating ?? bookData.average_rating ?? 0,
                    nr_pages: bookData.nr_pages ?? bookData.pageCount ?? 0,
                    publication_year: bookData.publication_year ?? (
                        bookData.publishedDate ? parseInt(bookData.publishedDate.slice(0, 4)) : null
                    ),
                    series: bookData.series ?? '',
                    description: bookData.description ?? '',
                    thumbnail: bookData.thumbnail ?? bookData.cover ?? 'https://default-cover.jpg',
                }
            };

            const responseShelf = await axios.post(
                `${apiBaseUrl}/books/currently_reading/add/`,
                bookPayload,
                {
                    headers: {
                        Authorization: `JWT ${token}`,
                        'Content-Type': 'application/json',
                    },
                }
            );

            Alert.alert(
                'Success',
                `Your reading progress has been updated! You read ${pagesRead} pages.`,
                [{ text: 'OK' }]
            );
        } catch (error) {
            let errorMessage = 'Failed to update reading progress.';
            if (error.response && error.response.data) {
                if (typeof error.response.data === 'string') {
                    errorMessage = error.response.data;
                } else if (error.response.data.detail) {
                    errorMessage = error.response.data.detail;
                }
            }
            Alert.alert(
                'Update Failed',
                errorMessage,
                [{ text: 'OK' }]
            );
        }    
    };

    // console.log('Loading states - loading:', loading, 'reviewsLoading:', reviewsLoading);

    // console.log(allPosts[0]);

    if (loading || reviewsLoading) {
        return (
            <SafeAreaView style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#613F75" />
                <Text style={styles.loadingText}>
                    {loading ? 'Loading book details...' : 'Loading reviews...'}
                </Text>
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

    return (
        <SafeAreaView style={styles.screen}>
            <TopBar pageName="SearchPage" />

            <ScrollView 
                style={styles.scrollViewStyle} 
                contentContainerStyle={styles.scrollContainer}>

                <View style={[styles.infoContainer]}>
                        {bookData.cover && (
                            <Image 
                                source={{ uri: bookData.cover }} 
                                style={styles.coverImage} 
                                resizeMode="cover"
                            />
                        )}
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
                                onPress={() => handleAddToLibrary()}
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
                        {[1,2,3,4,5].map((star) => (
                            <Image
                                key={star}
                                style={styles.star}
                                source={
                                    bookData.average_rating && bookData.average_rating >= star
                                        ? purpleStarFull
                                        : purpleStarEmpty
                                }
                            />
                        ))}
                    </View>
                    <Text style={styles.ratingText}>
                        {bookData.average_rating ? bookData.average_rating.toFixed(2) : 'N/A'}
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
                    <View style={styles.reviews}>
                        {followedPosts.length > 0 ? (
                            followedPosts.map((post, index) => (
                                <PostPartial key={index} postData={JSON.stringify(post)} />
                            ))
                        ) : (
                            <Text style={styles.reviewsPlaceholder}>
                                Currently, there are no reviews
                            </Text>
                        )}
                    </View>
                </View>
                <View style={styles.reviewsContainer}>
                    <Text style={styles.reviewsTitle}>
                        All reviews
                    </Text>
                    <View style={styles.reviews}>
                        {allPosts.length > 0 ? (
                            allPosts.map((post, index) => (
                                <PostPartial key={index} postData={JSON.stringify(post)} />
                            ))
                        ) : (
                            <Text style={styles.reviewsPlaceholder}>
                                Currently, there are no reviews
                            </Text>
                        )}
                    </View>
                </View>
            </ScrollView>
              {/* Modal for Android pages input */}
            <Modal
                visible={showPagesModal}
                transparent={true}
                animationType="fade"
                onRequestClose={handleModalCancel}
            >
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContainer}>                        
                        <Text style={styles.modalTitle}>
                            Update Reading Progress
                        </Text>
                        <Text style={styles.modalMessage}>
                            How many pages have you read?
                        </Text>
                        
                        <TextInput
                            style={styles.modalInput}
                            value={pagesInput}
                            onChangeText={setPagesInput}
                            placeholder="Enter number of pages"
                            keyboardType="numeric"
                            autoFocus={true}
                        />
                        
                        <View style={styles.modalButtons}>
                            <TouchableNativeFeedback onPress={handleModalCancel}>
                                <View style={[styles.modalButton, styles.cancelButton]}>
                                    <Text style={styles.cancelButtonText}>
                                        Cancel
                                    </Text>
                                </View>
                            </TouchableNativeFeedback>
                            
                            <TouchableNativeFeedback onPress={handlePagesSubmit}>
                                <View style={[styles.modalButton, styles.updateButton]}>
                                    <Text style={styles.updateButtonText}>
                                        Update
                                    </Text>
                                </View>
                            </TouchableNativeFeedback>
                        </View>
                    </View>
                </View>            
            </Modal>
            
            {/* Custom Library Actions Modal */}
            <Modal
                visible={showLibraryModal}
                transparent={true}
                animationType="fade"
                onRequestClose={handleLibraryModalCancel}
            >
                <View style={styles.modalOverlay}>
                    <View style={styles.libraryModalContainer}>
                        <Text style={styles.modalTitle}>Choose an action</Text>
                        
                        <TouchableNativeFeedback onPress={() => handleLibraryAction('update_reading')}>
                            <View style={styles.libraryOption}>
                                <Text style={styles.libraryOptionText}>Start/Update Reading</Text>
                            </View>
                        </TouchableNativeFeedback>
                        
                        <TouchableNativeFeedback onPress={() => handleLibraryAction('finish_reading')}>
                            <View style={styles.libraryOption}>
                                <Text style={styles.libraryOptionText}>Finish Reading</Text>
                            </View>
                        </TouchableNativeFeedback>
                        
                        <TouchableNativeFeedback onPress={() => handleLibraryAction('want_to_read')}>
                            <View style={styles.libraryOption}>
                                <Text style={styles.libraryOptionText}>Want to Read</Text>
                            </View>
                        </TouchableNativeFeedback>
                        
                        <TouchableNativeFeedback onPress={() => setShowShelfModal(true)}>
                            <View style={styles.libraryOption}>
                                <Text style={styles.libraryOptionText}>Add to Shelf</Text>
                            </View>
                        </TouchableNativeFeedback>
                        
                        <TouchableNativeFeedback onPress={() => handleLibraryAction('create_post')}>
                            <View style={styles.libraryOption}>
                                <Text style={styles.libraryOptionText}>Create Post</Text>
                            </View>
                        </TouchableNativeFeedback>
                        
                        <TouchableNativeFeedback onPress={() => handleLibraryAction('add_review')}>
                            <View style={styles.libraryOption}>
                                <Text style={styles.libraryOptionText}>Add Review</Text>
                            </View>
                        </TouchableNativeFeedback>
                        
                        <TouchableNativeFeedback onPress={handleLibraryModalCancel}>
                            <View style={[styles.libraryOption, styles.cancelOption]}>
                                <Text style={[styles.libraryOptionText, styles.cancelOptionText]}>Cancel</Text>
                            </View>
                        </TouchableNativeFeedback>
                    </View>
                </View>
            </Modal>
            

            {/* Shelf Selection Modal */}
            <Modal
            visible={showShelfModal}
            transparent={true}
            animationType="fade"
            onRequestClose={() => setShowShelfModal(false)}
            >
            <View style={styles.modalOverlay}>
                <View style={styles.libraryModalContainer}>
                <Text style={styles.modalTitle}>Choose a Shelf</Text>
                <ScrollView>
                    {shelves.map((shelf, idx) => (
                    <TouchableNativeFeedback
                        key={idx}
                        onPress={() => {
                        setShowShelfModal(false);
                        handleAddToShelf(shelf.shelf_name);
                        }}
                    >
                        <View style={styles.libraryOption}>
                        <Text style={styles.libraryOptionText}>{shelf.shelf_name}</Text>
                        </View>
                    </TouchableNativeFeedback>
                    ))}
                </ScrollView>
                <TouchableNativeFeedback onPress={() => setShowShelfModal(false)}>
                    <View style={[styles.libraryOption, styles.cancelOption]}>
                    <Text style={[styles.libraryOptionText, styles.cancelOptionText]}>Cancel</Text>
                    </View>
                </TouchableNativeFeedback>
                </View>
            </View>
            </Modal>

            {/* Review Submission Modal */}
            <Modal
                visible={showReviewModal}
                transparent={true}
                animationType="fade"
                onRequestClose={handleReviewModalCancel}
            >
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContainer}>
                        <Text style={styles.modalTitle}>Submit a Review</Text>
                        
                        <Text style={styles.modalMessage}>
                            We value your feedback! Please rate the book and leave a comment.
                        </Text>
                        
                        <View style={styles.ratingContainer}>
                            <Text style={styles.label}>Rating:</Text>
                            <View style={styles.starsContainer}>
                                {[1, 2, 3, 4, 5].map((star) => (
                                    <TouchableNativeFeedback 
                                        key={star} 
                                        onPress={() => setReviewRating(star)}
                                    >
                                        <Image 
                                            style={styles.star} 
                                            source={star <= reviewRating ? purpleStarFull : purpleStarEmpty}
                                        />
                                    </TouchableNativeFeedback>
                                ))}
                            </View>
                        </View>
                        
                        <TextInput
                            style={styles.modalInput}
                            value={reviewDescription}
                            onChangeText={setReviewDescription}
                            placeholder="Write your review here..."
                            multiline={true}
                            numberOfLines={4}
                            textAlignVertical="top"
                        />
                        
                        <View style={styles.modalButtons}>
                            <TouchableNativeFeedback onPress={handleReviewModalCancel}>
                                <View style={[styles.modalButton, styles.cancelButton]}>
                                    <Text style={styles.cancelButtonText}>
                                        Cancel
                                    </Text>
                                </View>
                            </TouchableNativeFeedback>
                            
                            <TouchableNativeFeedback onPress={handleReviewSubmit}>
                                <View style={[styles.modalButton, styles.updateButton]}>
                                    <Text style={styles.updateButtonText}>
                                        Submit Review
                                    </Text>
                                </View>
                            </TouchableNativeFeedback>
                        </View>
                    </View>
                </View>            
            </Modal>
              {/* Create Post Modal */}
            <Modal
                visible={showCreatePostModal}
                transparent={true}
                animationType="fade"
                onRequestClose={handleCreatePostModalCancel}
            >
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContainer}>
                        <Text style={styles.modalTitle}>Create a Post</Text>
                        
                        <Text style={styles.modalMessage}>
                            Share your thoughts about this book.
                        </Text>
                        
                        <TextInput
                            style={styles.modalInput}
                            value={postDescription}
                            onChangeText={setPostDescription}
                            placeholder="Write your post here... (required)"
                            multiline={true}
                            numberOfLines={4}
                            textAlignVertical="top"
                        />
                        
                        <View style={styles.modalButtons}>
                            <TouchableNativeFeedback onPress={handleCreatePostModalCancel}>
                                <View style={[styles.modalButton, styles.cancelButton]}>
                                    <Text style={styles.cancelButtonText}>
                                        Cancel
                                    </Text>
                                </View>
                            </TouchableNativeFeedback>
                            
                            <TouchableNativeFeedback onPress={handleCreatePostSubmit}>
                                <View style={[styles.modalButton, styles.updateButton]}>
                                    <Text style={styles.updateButtonText}>
                                        Create Post
                                    </Text>
                                </View>
                            </TouchableNativeFeedback>
                        </View>
                    </View>
                </View>
            </Modal>
            
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
        width: 210
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
    },    detailRow: {
        flexDirection: 'row',
        marginBottom: 8,
        flexWrap: 'wrap',
    },
    // Modal styles
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    modalContainer: {
        backgroundColor: '#FCF8FA',
        borderRadius: 12,
        padding: 20,
        width: '80%',
        maxWidth: 300,
        elevation: 5,
        shadowColor: '#000',
        shadowOffset: {
            width: 0,
            height: 2,
        },
        shadowOpacity: 0.25,
        shadowRadius: 3.84,
    },
    modalTitle: {
        fontSize: 18,
        fontFamily: 'Nunito_600SemiBold',
        color: '#613F75',
        textAlign: 'center',
        marginBottom: 8,
    },
    modalMessage: {
        fontSize: 14,
        fontFamily: 'Nunito_400Regular',
        color: '#18101D',
        textAlign: 'center',
        marginBottom: 16,
    },
    modalInput: {
        borderWidth: 1,
        borderColor: '#E5C3D1',
        borderRadius: 8,
        padding: 12,
        fontSize: 16,
        fontFamily: 'Nunito_400Regular',
        color: '#18101D',
        backgroundColor: '#F7EDF1',
        marginBottom: 20,
        textAlign: 'center',
    },
    modalButtons: {
        flexDirection: 'row',
        justifyContent: 'space-between',
    },
    modalButton: {
        flex: 1,
        paddingVertical: 12,
        paddingHorizontal: 16,
        borderRadius: 8,
        marginHorizontal: 4,
        justifyContent: 'center',
        alignItems: 'center',
    },
    cancelButton: {
        backgroundColor: '#E5C3D1',
    },
    updateButton: {
        backgroundColor: '#613F75',
    },
    cancelButtonText: {
        color: '#613F75',
        fontSize: 14,
        fontFamily: 'Nunito_500Medium',
    },    updateButtonText: {
        color: '#FCF8FA',
        fontSize: 14,
        fontFamily: 'Nunito_500Medium',
    },
    
    // Library Modal styles
    libraryModalContainer: {
        backgroundColor: '#FCF8FA',
        borderRadius: 12,
        padding: 20,
        width: '85%',
        maxWidth: 350,
        elevation: 5,
        shadowColor: '#000',
        shadowOffset: {
            width: 0,
            height: 2,
        },
        shadowOpacity: 0.25,
        shadowRadius: 3.84,
    },
    libraryOption: {
        paddingVertical: 15,
        paddingHorizontal: 20,
        borderBottomWidth: 1,
        borderBottomColor: '#E5C3D1',
        backgroundColor: '#F7EDF1',
        marginVertical: 2,
        borderRadius: 8,
    },
    libraryOptionText: {
        fontSize: 16,
        fontFamily: 'Nunito_500Medium',
        color: '#613F75',
        textAlign: 'center',
    },
    cancelOption: {
        backgroundColor: '#E5C3D1',
        marginTop: 10,
        borderBottomWidth: 0,
    },    cancelOptionText: {
        color: '#613F75',
        fontFamily: 'Nunito_600SemiBold',
    },
    
    // Review modal specific styles
    ratingContainer: {
        alignItems: 'center',
        marginBottom: 16,
    },
    starsContainer: {
        flexDirection: 'row',
        marginTop: 8,
    },
});

export default BookShow;