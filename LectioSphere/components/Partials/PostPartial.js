import React, { useEffect, useState } from 'react';
import { View, Text, ActivityIndicator, StyleSheet, Image, TouchableNativeFeedback, Modal, TextInput } from 'react-native';
import { ProgressBar } from 'react-native-paper';
import { useFonts, Nunito_400Regular, Nunito_500Medium, Nunito_600SemiBold } from '@expo-google-fonts/nunito';
import { Alert } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';

const purpleStarFull = require('../../assets/purpleStarFull.png');
const purpleStarEmpty = require('../../assets/purpleStarEmpty.png');

const PostPartial = ({ apiBaseUrl, postData }) => {
    const [post, setPost] = useState(null);
    const [loading, setLoading] = useState(true);
    const defaultPicture = require('../../assets/defaultProfilePic.jpg');

    const [showPagesModal, setShowPagesModal] = useState(false);
    const [pagesInput, setPagesInput] = useState('');
    const [showLibraryModal, setShowLibraryModal] = useState(false);
    // Review modal states
    const [showReviewModal, setShowReviewModal] = useState(false);
    const [reviewRating, setReviewRating] = useState(0);
    const [reviewDescription, setReviewDescription] = useState('');    // Create post modal states
    const [showCreatePostModal, setShowCreatePostModal] = useState(false);
    const [postDescription, setPostDescription] = useState('');
    


    const [fontsLoaded] = useFonts({
        Nunito_400Regular,
        Nunito_500Medium,
        Nunito_600SemiBold
    });
        


    useEffect(() => {
        if (postData) {
            try {
                const parsedPost = JSON.parse(postData);
                setPost(parsedPost);
                setLoading(false);
            } catch (err) {
                console.error('Error parsing post data:', err);
                setPost(null);
                setLoading(false);
            }
        } else {
            setPost(null);
            setLoading(false);
        }

    }, [postData]);

    if (loading) return <ActivityIndicator size="large" style={styles.centered} />;
    if (!post) return <Text style={styles.centered}>Post not found.</Text>;

    // console.log('Post data:', post)


      const handleLikePress = async (id) => {
        try {
            const token = await AsyncStorage.getItem('auth_token');
            if (!token) {
                console.error('No token found');
                return;
            }

            const response = await axios.post(
                `${apiBaseUrl}/api/posts/${id}/toggle_like/`,
                {},
                {
                    headers: {
                        Authorization: `JWT ${token}`,
                        'Content-Type': 'application/json',
                    },
                }
            );

            console.log('Post like toggled successfully:', response.data);
            // Alert.alert('Success', 'You liked the post!', [{ text: 'OK' }]);
        } catch (error) {
            console.error('Error toggling like:', error);
            let errorMessage = 'Failed to toggle like.';
            if (error.response && error.response.data) {
                errorMessage = typeof error.response.data === 'string'
                    ? error.response.data
                    : JSON.stringify(error.response.data);
            }
            Alert.alert('Like Failed', errorMessage, [{ text: 'OK' }]);
        }
    }


    // Handlere pentru butonul de add to library

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
                console.log('Add to Shelf'); // AICI ANDREEA
                break;            case 'create_post':
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
                id: post.book.id
            };

            // Only add description if it's not empty
            if (description && description.trim()) {
                reviewData.description = description.trim();
            }

            console.log('Sending review data:', reviewData); // Debug log

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
                console.log('Error response status:', error.response.status);
                console.log('Error response data:', error.response.data);
                
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
                id: post.book.id
            };

            console.log('Sending create post data:', postData); // Debug log

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
                console.log('Error response status:', error.response.status);
                console.log('Error response data:', error.response.data);
                
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

    const handleFinishReading = async () => {
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
                    action: 'finished_reading',
                    id: post.book.id // Most APIs expect 'book_id', not 'id'
                },
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
                    id: post.book.id // Most APIs expect 'book_id', not 'id'
                },
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
                    id: post.book.id // Most APIs expect 'book_id', not 'id'
                },
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


    const modalAddToLibrary = () => {
        return (
            <>
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
                            
                            <TouchableNativeFeedback onPress={() => handleLibraryAction('add_to_shelf')}>
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
            </>
        );
    }



    if (post.action == "finished_reading" || post.progress >= post.book.nr_pages)
    {
        return (
            <View style={styles.container}>
                <View style={styles.headerContainer}>
                    <View style={styles.headerInfo}>
                        <View style={styles.profileInfo}>
                            {/* <Image 
                            source={
                            // post?.profile_pic 
                            // ? { uri: profileData.profile_pic } 
                            // : defaultPicture
                            defaultPicture
                            }
                            style={styles.profilePic}
                            /> */}

                            <View style={styles.profileText}>
                            <Text style={styles.username}>
                                @{post?.user?.username || 'Unknown User'}
                            </Text>
                            <Text style={styles.normalText}>
                                finished reading 
                            </Text>
                            </View>
                        </View>

                        <Text style={styles.bookTitle}>
                            {post?.book?.title || 'Unknown Book'}
                        </Text>

                        <Text style={styles.author}>
                            {post?.book?.author || 'Unknown Author'}
                        </Text>

                        <TouchableNativeFeedback 
                            onPress={() => handleAddToLibrary(post.book.id)}
                        >
                            <View style={styles.addButtonTouchable}>
                            <Text style={styles.addButtonText}>
                                Add to Library
                            </Text>
                            </View>
                        </TouchableNativeFeedback>
                    </View>                
                    
                    <View style={styles.headerBookContainer}>
                        {post.book.cover && (
                        <Image 
                            source={{ uri: post.book.cover}} 
                            style={styles.coverImage} 
                            resizeMode="cover"
                        />
                        )}
                    </View>
                </View>                <View>
                    <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 8 }}>
                    <TouchableNativeFeedback onPress={() => handleLikePress(post.id)}>
                        <Image
                        source={require('../../assets/heartFull.png')}
                        style={{ width: 25, height: 22, marginRight: 6 }}
                        />
                    </TouchableNativeFeedback>
                    <Text style={{ fontFamily: 'Nunito_500Medium', fontSize: 14, color: '#613F75' }}>
                        {post.like_count || 0} 
                    </Text>
                    </View>
                </View>
                {modalAddToLibrary()}
            </View>
        );
    }

    // console.log(post);

    if (post.action == 'made_progress')
    {

        // console.log(post);

        return (
            <View style={styles.container}>
                <View style={styles.headerContainer}>
                    <View style={styles.headerInfo}>
                    <View style={styles.profileInfo}>
                        {/* <Image 
                        source={
                        // post?.profile_pic 
                        // ? { uri: profileData.profile_pic } 
                        // : defaultPicture
                        defaultPicture
                        }
                        style={styles.profilePic}
                        /> */}

                        <View style={styles.profileText}>
                            <Text style={styles.username}>
                                @{post?.user?.username || 'Unknown User'}
                            </Text>
                            <Text style={styles.normalText}>
                                made progress 
                            </Text>
                        </View>
                    </View>

                    <Text style={styles.bookTitle}>
                        {post?.book?.title || 'Unknown Book'}
                    </Text>

                    <Text style={styles.author}>
                        {post?.book?.author || 'Unknown Author'}
                    </Text>

                    <TouchableNativeFeedback 
                        onPress={() => handleAddToLibrary(post.book.id)}
                    >
                        <View style={styles.addButtonTouchable}>
                        <Text style={styles.addButtonText}>
                            Add to Library
                        </Text>
                        </View>
                    </TouchableNativeFeedback>

                    </View>                <View style={styles.headerBookContainer}>
                        {post.book.cover && (
                        <Image 
                            source={{ uri: post.book.cover}} 
                            style={styles.coverImage} 
                            resizeMode="cover"
                        />
                        )}
                    </View>
                </View>            
                {/* Progress Bar Section */}
                {post.progress !== undefined && post.progress !== null && post.book.nr_pages && post.book.nr_pages > 0 && (
                    <View style={styles.progressContainer}>
                        <ProgressBar 
                            progress={Math.min(post.progress / post.book.nr_pages, 1)}
                            color="#613F75"
                            style={styles.progressBar}
                        />
                        <Text style={styles.progressText}>
                            {post.progress} / {post.book.nr_pages} pages ({Math.round((post.progress / post.book.nr_pages) * 100)}%)
                        </Text>
                    </View>
                )}                <View>
                    <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 8 }}>
                        <TouchableNativeFeedback onPress={() => handleLikePress(post.id)}>
                            <Image
                            source={require('../../assets/heartFull.png')}
                            style={{ width: 25, height: 22, marginRight: 6 }}
                            />
                        </TouchableNativeFeedback>
                        <Text style={{ fontFamily: 'Nunito_500Medium', fontSize: 14, color: '#613F75' }}>
                            {post.like_count || 0} 
                        </Text>
                    </View>
                </View>
                {modalAddToLibrary()}
            </View>
        );
    }

    if (post.action == "want_to_read")
    {
        return (
            <View style={styles.container}>
                <View style={styles.headerContainer}>
                    <View style={styles.headerInfo}>
                        <View style={styles.profileInfo}>
                            {/* <Image 
                            source={
                            // post?.profile_pic 
                            // ? { uri: profileData.profile_pic } 
                            // : defaultPicture
                            defaultPicture
                            }
                            style={styles.profilePic}
                            /> */}

                            <View style={styles.profileText}>
                            <Text style={styles.username}>
                                @{post?.user?.username || 'Unknown User'}
                            </Text>
                            <Text style={styles.normalText}>
                                wants to read 
                            </Text>
                            </View>
                        </View>

                        <Text style={styles.bookTitle}>
                            {post?.book?.title || 'Unknown Book'}
                        </Text>

                        <Text style={styles.author}>
                            {post?.book?.author || 'Unknown Author'}
                        </Text>

                        <TouchableNativeFeedback 
                            onPress={() => handleAddToLibrary(post.book.id)}
                        >
                            <View style={styles.addButtonTouchable}>
                            <Text style={styles.addButtonText}>
                                Add to Library
                            </Text>
                            </View>
                        </TouchableNativeFeedback>
                    </View>                
                    
                    <View style={styles.headerBookContainer}>
                        {post.book.cover && (
                        <Image 
                            source={{ uri: post.book.cover}} 
                            style={styles.coverImage} 
                            resizeMode="cover"
                        />
                        )}
                    </View>
                </View>                <View>
                    <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 8 }}>
                    <TouchableNativeFeedback onPress={() => handleLikePress(post.id)}>
                        <Image
                        source={require('../../assets/heartFull.png')}
                        style={{ width: 25, height: 22, marginRight: 6 }}
                        />
                    </TouchableNativeFeedback>
                    <Text style={{ fontFamily: 'Nunito_500Medium', fontSize: 14, color: '#613F75' }}>
                        {post.like_count || 0} 
                    </Text>
                    </View>
                </View>
                {modalAddToLibrary()}
            </View>
        );
    }    
    
    if (post.action == "review")
    {
        const renderStars = (rating) => {
            const stars = [];
            for (let i = 1; i <= 5; i++) {
                stars.push(
                    <Image
                        key={i}
                        source={i <= rating ? require('../../assets/purpleStarFull.png') : require('../../assets/purpleStarEmpty.png')}
                        style={{ width: 20, height: 20, marginRight: 2 }}
                    />
                );
            }
            return stars;
        };

        if (post.description)
        {
            return (
                <View style={styles.container}>
                    <View style={styles.headerContainer}>
                        <View style={styles.headerInfo}>
                            <View style={styles.profileInfo}>
                                {/* <Image 
                                source={defaultPicture}
                                style={styles.profilePic}
                                /> */}

                                <View style={styles.profileText}>
                                <Text style={styles.username}>
                                    @{post?.user?.username || 'Unknown User'}
                                </Text>
                                <Text style={styles.normalText}>
                                    reviewed 
                                </Text>
                                </View>
                            </View>

                            <Text style={styles.bookTitle}>
                                {post?.book?.title || 'Unknown Book'}
                            </Text>

                            <Text style={styles.author}>
                                {post?.book?.author || 'Unknown Author'}
                            </Text>

                            <TouchableNativeFeedback 
                                onPress={() => handleAddToLibrary(post.book.id)}
                            >
                                <View style={styles.addButtonTouchable}>
                                <Text style={styles.addButtonText}>
                                    Add to Library
                                </Text>
                                </View>
                            </TouchableNativeFeedback>
                        </View>                
                        
                        <View style={styles.headerBookContainer}>
                            {post.book.cover && (
                            <Image 
                                source={{ uri: post.book.cover}} 
                                style={styles.coverImage} 
                                resizeMode="cover"
                            />
                            )}
                        </View>                    </View>

                    {/* Description Section */}
                    {post.description && (
                        <View style={styles.reviewContainer}>
                            <Text style={styles.reviewDescription}>
                                {post.description}
                            </Text>
                        </View>
                    )}

                    <View>
                        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 8 }}>
                            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                                <TouchableNativeFeedback onPress={() => handleLikePress(post.id)}>
                                    <Image
                                    source={require('../../assets/heartFull.png')}
                                    style={{ width: 25, height: 22, marginRight: 6 }}
                                    />
                                </TouchableNativeFeedback>
                                <Text style={{ fontFamily: 'Nunito_500Medium', fontSize: 14, color: '#613F75' }}>
                                    {post.like_count || 0} 
                                </Text>
                            </View>
                            
                            <View style={styles.starsContainer}>
                                {renderStars(post.rating || 0)}
                            </View>
                        </View>
                    </View>
                    {modalAddToLibrary()}
                </View>
            );
        }
        else
        {
            return (
                <View style={styles.container}>
                    <View style={styles.headerContainer}>
                        <View style={styles.headerInfo}>
                            <View style={styles.profileInfo}>
                                {/* <Image 
                                source={defaultPicture}
                                style={styles.profilePic}
                                /> */}

                                <View style={styles.profileText}>
                                <Text style={styles.username}>
                                    @{post?.user?.username || 'Unknown User'}
                                </Text>
                                <Text style={styles.normalText}>
                                    rated 
                                </Text>
                                </View>
                            </View>

                            <Text style={styles.bookTitle}>
                                {post?.book?.title || 'Unknown Book'}
                            </Text>

                            <Text style={styles.author}>
                                {post?.book?.author || 'Unknown Author'}
                            </Text>

                            <TouchableNativeFeedback 
                                onPress={() => handleAddToLibrary(post.book.id)}
                            >
                                <View style={styles.addButtonTouchable}>
                                <Text style={styles.addButtonText}>
                                    Add to Library
                                </Text>
                                </View>
                            </TouchableNativeFeedback>
                        </View>                
                        
                        <View style={styles.headerBookContainer}>
                            {post.book.cover && (
                            <Image 
                                source={{ uri: post.book.cover}} 
                                style={styles.coverImage} 
                                resizeMode="cover"
                            />
                            )}
                        </View>                    </View>

                    <View>
                        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 8 }}>
                            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                                <TouchableNativeFeedback onPress={() => handleLikePress(post.id)}>
                                    <Image
                                    source={require('../../assets/heartFull.png')}
                                    style={{ width: 25, height: 22, marginRight: 6 }}
                                    />
                                </TouchableNativeFeedback>
                                <Text style={{ fontFamily: 'Nunito_500Medium', fontSize: 14, color: '#613F75' }}>
                                    {post.like_count || 0} 
                                </Text>
                            </View>
                            
                            <View style={styles.starsContainer}>
                                {renderStars(post.rating || 0)}
                            </View>
                        </View>
                    </View>
                    {modalAddToLibrary()}
                </View>
            );        }
    }

    if (post.action == "post")
    {
        return (
            <View style={styles.container}>
                <View style={styles.headerContainer}>
                    <View style={styles.headerInfo}>
                        <View style={styles.profileInfo}>
                            {/* <Image 
                            source={defaultPicture}
                            style={styles.profilePic}
                            /> */}

                            <View style={styles.profileText}>
                            <Text style={styles.username}>
                                @{post?.user?.username || 'Unknown User'}
                            </Text>
                            <Text style={styles.normalText}>
                                posted about 
                            </Text>
                            </View>
                        </View>

                        <Text style={styles.bookTitle}>
                            {post?.book?.title || 'Unknown Book'}
                        </Text>

                        <Text style={styles.author}>
                            {post?.book?.author || 'Unknown Author'}
                        </Text>

                        <TouchableNativeFeedback 
                            onPress={() => handleAddToLibrary(post.book.id)}
                        >
                            <View style={styles.addButtonTouchable}>
                            <Text style={styles.addButtonText}>
                                Add to Library
                            </Text>
                            </View>
                        </TouchableNativeFeedback>
                    </View>                
                    
                    <View style={styles.headerBookContainer}>
                        {post.book.cover && (
                        <Image 
                            source={{ uri: post.book.cover}} 
                            style={styles.coverImage} 
                            resizeMode="cover"
                        />
                        )}
                    </View>
                </View>

                {/* Description Section */}
                <View style={styles.reviewContainer}>
                    <Text style={styles.reviewDescription}>
                        {post.description}
                    </Text>
                </View>

                <View>
                    <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 8 }}>
                        <TouchableNativeFeedback onPress={() => handleLikePress(post.id)}>
                            <Image
                            source={require('../../assets/heartFull.png')}
                            style={{ width: 25, height: 22, marginRight: 6 }}
                            />
                        </TouchableNativeFeedback>
                        <Text style={{ fontFamily: 'Nunito_500Medium', fontSize: 14, color: '#613F75' }}>
                            {post.like_count || 0} 
                        </Text>
                    </View>
                </View>
                {modalAddToLibrary()}
            </View>
        );
    }


    // Default return for other post types
    return (
        <View style={styles.container}>
            <Text style={styles.centered}>Post type "{post.action}" not supported yet.</Text>
        </View>
    );
};

const styles = StyleSheet.create({    container: 
    { 
        width: '95%',
        marginHorizontal: 'auto',
        marginTop: 16,
        padding: 16,
        borderRadius: 8,
        backgroundColor: '#F7EDF1',
        borderWidth: 1,
        borderColor: '#F3E3E9',
        alignSelf: 'center',
    },
    centered: 
    { 
        textAlign: 'center', 
        marginTop: 20 
    },
    profileInfo: 
    { 
        flexDirection: 'row', 
        alignItems: 'center', 
        marginBottom: 10
    },
    profilePic: 
    { 
        width: 52, 
        height: 52, 
        borderRadius: 25, 
        borderWidth: 1,
        borderColor: '#613F75',
    },
    profileText: 
    { 
        marginLeft: 10, 
        flex: 1 
    },
    username: 
    { 
        fontSize: 14,
        fontFamily: 'Nunito_600SemiBold',
        color: '#613F75' 
    },
    normalText: 
    { 
        fontSize: 14, 
        fontFamily: 'Nunito_400Regular', 
        color: '#18101D' 
    },    headerContainer: 
    { 
        flexDirection: 'row', 
        alignItems: 'flex-start',
        marginBottom: 10 
    },
    headerInfo: 
    { 
        flex: 1, 
        flexDirection: 'column', 
        alignItems: 'center' 
    },
    headerBookContainer: 
    { 
        flexDirection: 'row', 
        alignItems: 'center', 
        marginBottom: 10 
    },
    coverImage: 
    { 
        width: 100, 
        height: 152, 
        borderRadius: 4, 
        marginRight: 10 
    },    bookTitle: 
    { 
        fontSize: 18,
        fontWeight: 'bold',
        fontFamily: 'Nunito_600SemiBold',
        marginBottom: 0,
        marginRight: 8,
        color: '#613F75',
        justifyContent: 'flex-end',
        alignSelf: 'flex-end',
        textAlign: 'right',
    },
    author:
    { 
        fontSize: 14, 
        fontFamily: 'Nunito_400Regular', 
        color: '#18101D',
        marginBottom: 4,
        marginRight: 8,
        textAlign: 'right',
        alignSelf: 'flex-end',
    },    addButtonTouchable: {
        backgroundColor: '#613F75',
        width: 120,
        height: 30,
        borderRadius: 15,
        justifyContent: 'center',
        alignItems: 'center',
        alignSelf: 'flex-end',
        marginRight: 8,
        marginTop: 16,
    },addButtonText: {
        color: '#FCF8FA',
    },
      // Progress Bar Styles
    progressContainer: {
        marginVertical: 0,
        paddingHorizontal: 10,
    },
    progressText: {
        fontSize: 12,
        fontFamily: 'Nunito_500Medium',
        color: '#18101D',
        textAlign: 'center',
        marginTop: 4,
    },    progressBar: {
        height: 6,
        borderRadius: 3,
        backgroundColor: '#E5C3D1',
    },
    // Review Styles
    reviewContainer: {
        marginVertical: 8,
        paddingHorizontal: 10,
    },
    ratingContainer: {
        alignItems: 'center',
        marginBottom: 8,
    },    starsContainer: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    reviewDescription: {
        fontSize: 14,
        fontFamily: 'Nunito_400Regular',
        color: '#18101D',
        textAlign: 'center',
        lineHeight: 20,
        marginTop: 8,
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
    star: {
        width: 24,
        height: 24,
        margin: 6
    },
});

export default PostPartial;