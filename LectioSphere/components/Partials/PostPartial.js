import React, { useEffect, useState } from 'react';
import { View, Text, ActivityIndicator, StyleSheet, Image, TouchableNativeFeedback } from 'react-native';
import { useFonts, Nunito_400Regular, Nunito_500Medium, Nunito_600SemiBold } from '@expo-google-fonts/nunito';
import { Alert } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';

const PostPartial = ({ apiBaseUrl, postData }) => {
    const [post, setPost] = useState(null);
    const [loading, setLoading] = useState(true);
    const defaultPicture = require('../../assets/defaultProfilePic.jpg');


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
    
    const handleAddToLibrary = async (bookId) => {
        Alert.alert(
            'Choose an action',
            '',
            [
                { text: 'Start/Update Reading', onPress: () => handleUpdateReading(bookId) },
                { text: 'Finish Reading', onPress: () => console.log('Finish Reading') },
                { text: 'Want to Read', onPress: () => console.log('Want to Read') },
                { text: 'Add to Shelf', onPress: () => console.log('Add to Shelf') },
                { text: 'Create Post', onPress: () => console.log('Create Post') },
                { text: 'Add Review', onPress: () => console.log('Add Review') },
                { text: 'Cancel', style: 'cancel' }
            ],
            { cancelable: true }
        );
    };

    const handleUpdateReading = async (bookId) => {
        try {
            const token = await AsyncStorage.getItem('auth_token');
            if (!token) {
                console.error('No token found');
                return;
            }

            const response = await axios.post(
                `${apiBaseUrl}/posts/add/`,
                {
                    action: 'made_progress',
                    pages_read: 10,
                    id: bookId
                },
                {
                    headers: {
                        Authorization: `JWT ${token}`,
                        'Content-Type': 'application/json',
                    },
                }
            );

            console.log('Book updated successfully:', response.data);
            Alert.alert(
                'Success',
                'Your reading progress has been updated!',
                [{ text: 'OK' }]
            );
        } catch (error) {
            console.error('Error updating book:', error);

            let errorMessage = 'Failed to update reading progress.';
            if (error.response) {
                if (error.response.data) {
                    errorMessage = typeof error.response.data === 'string'
                        ? error.response.data
                        : JSON.stringify(error.response.data);
                }
                console.log('Error status:', error.response.status);
                console.log('Error data:', error.response.data);
            }

            Alert.alert(
                'Update Failed',
                errorMessage,
                [{ text: 'OK' }]
            );
        }
    };

    
    const handleLikePress = async (id) => {
        try {
            const token = await AsyncStorage.getItem('auth_token');
            if (!token) {
                console.error('No token found');
                return;
            }

            const response = await axios.post(
                `${apiBaseUrl}/posts/like/`,
                { id },
                {
                    headers: {
                        Authorization: `JWT ${token}`,
                        'Content-Type': 'application/json',
                    },
                }
            );

            console.log('Post liked successfully:', response.data);
            Alert.alert('Success', 'You liked the post!', [{ text: 'OK' }]);
        } catch (error) {
            console.error('Error liking post:', error);
            let errorMessage = 'Failed to like post.';
            if (error.response && error.response.data) {
                errorMessage = typeof error.response.data === 'string'
                    ? error.response.data
                    : JSON.stringify(error.response.data);
            }
            Alert.alert('Like Failed', errorMessage, [{ text: 'OK' }]);
        }
    }



    if (post.action == 'made_progress') 
    {

        // console.log(post);

        return (
            <View style={styles.container}>
            <View style={styles.headerContainer}>
                <View style={styles.headerInfo}>
                <View style={styles.profileInfo}>
                    <Image 
                    source={
                    // post?.profile_pic 
                    // ? { uri: profileData.profile_pic } 
                    // : defaultPicture
                    defaultPicture
                    }
                    style={styles.profilePic}
                    />

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

            <View>
                <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 8 }}>
                <TouchableNativeFeedback onPress={handleLikePress}>
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
            </View>
        );
    }
};

const styles = StyleSheet.create({
    container: 
    { 
        marginTop: 16,
        padding: 16,
        borderRadius: 8,
        backgroundColor: '#F7EDF1',
        borderWidth: 1,
        borderColor: '#F3E3E9',
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
    },
    headerContainer: 
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
    },
    bookTitle: 
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
    },
    addButtonTouchable: {
        backgroundColor: '#613F75',
        width: 120,
        height: 30,
        borderRadius: 15,
        justifyContent: 'center',
        alignItems: 'center',
        alignSelf: 'flex-end',
        marginRight: 8,
        marginTop: 16,
    },
    addButtonText: {
        color: '#FCF8FA',
    },
});

export default PostPartial;