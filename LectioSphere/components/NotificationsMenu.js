import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, SafeAreaView, ScrollView, Image, TouchableOpacity, Alert, ActivityIndicator } from 'react-native';
import NavBar from './Partials/NavBar';
import TopBar from './Partials/TopBar';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import { useFonts, Nunito_400Regular, Nunito_500Medium, Nunito_600SemiBold } from '@expo-google-fonts/nunito';
import { refreshAccessToken } from './refreshAccessToken';

const NotificationsMenu = ({ navigation, apiBaseUrl }) => {
    const [followers, setFollowers] = useState([]);
    const [bookShareNotifications, setBookShareNotifications] = useState([]);
    const [loading, setLoading] = useState(true);
    const [followingStatus, setFollowingStatus] = useState({});

    const defaultPicture = require('../assets/defaultProfilePic.jpg');

    const [fontsLoaded] = useFonts({
        Nunito_400Regular,
        Nunito_500Medium,
        Nunito_600SemiBold
    });

    useEffect(() => {
        fetchFollowers();
        fetchNotifications();
    }, []);

    const fetchNotifications = async () => {
        try {
            let token = await AsyncStorage.getItem('auth_token');
            
            // Get last 20 notifications
            const response = await axios.get(`${apiBaseUrl}/notifications/`, {
                headers: { Authorization: `JWT ${token}` }
            });
            
            // Get last 20 notifications, newest to oldest (already sorted by backend)
            const lastNotifications = response.data.slice(0, 20);
            
            // Filter to get only book share notifications
            const bookShares = lastNotifications.filter(notif => notif.notification_type === 'book_share');
            setBookShareNotifications(bookShares);
            
        } catch (error) {
            if (error.response?.status === 401) {
                const newToken = await refreshAccessToken(apiBaseUrl);
                if (newToken) {
                    fetchNotifications(); // Retry with new token
                }
            } else {
                console.error("Error fetching notifications:", error.response?.status, error.message);
                Alert.alert('Error', 'Failed to load notifications');
            }
        }
    };

    const fetchFollowers = async () => {
        try {
            setLoading(true);
            let token = await AsyncStorage.getItem('auth_token');
            
            // Get followers from the new endpoint
            const response = await axios.get(`${apiBaseUrl}/api/accounts/profile/followers/`, {
                headers: { Authorization: `JWT ${token}` }
            });
            
            const followersList = response.data.followers || [];
            
            // Build following status map
            const statusMap = {};
            followersList.forEach(follower => {
                statusMap[follower.id] = follower.is_following_back || false;
            });
            
            setFollowers(followersList);
            setFollowingStatus(statusMap);
            
        } catch (error) {
            if (error.response?.status === 401) {
                const newToken = await refreshAccessToken(apiBaseUrl);
                if (newToken) {
                    fetchFollowers(); // Retry with new token
                }
            } else {
                console.error("Error fetching followers:", error.message);
                Alert.alert('Error', 'Failed to load notifications');
            }
        } finally {
            setLoading(false);
        }
    };

    const handleFollowBack = async (profileId) => {
        try {
            let token = await AsyncStorage.getItem('auth_token');
            
            await axios.patch(
                `${apiBaseUrl}/api/accounts/profile/${profileId}/follow/`,
                {},
                {
                    headers: { Authorization: `JWT ${token}` }
                }
            );
            
            // Update local state
            setFollowingStatus(prev => ({
                ...prev,
                [profileId]: true
            }));
            
        } catch (error) {
            if (error.response?.status === 401) {
                const newToken = await refreshAccessToken(apiBaseUrl);
                if (newToken) {
                    handleFollowBack(profileId); // Retry
                }
            } else {
                console.error("Error following user:", error.message);
                Alert.alert('Error', 'Failed to follow user');
            }
        }
    };

    const handleUnfollow = async (profileId) => {
        try {
            let token = await AsyncStorage.getItem('auth_token');
            
            await axios.patch(
                `${apiBaseUrl}/api/accounts/profile/${profileId}/unfollow/`,
                {},
                {
                    headers: { Authorization: `JWT ${token}` }
                }
            );
            
            // Update local state
            setFollowingStatus(prev => ({
                ...prev,
                [profileId]: false
            }));
            
        } catch (error) {
            if (error.response?.status === 401) {
                const newToken = await refreshAccessToken(apiBaseUrl);
                if (newToken) {
                    handleUnfollow(profileId); // Retry
                }
            } else {
                console.error("Error unfollowing user:", error.message);
                Alert.alert('Error', 'Failed to unfollow user');
            }
        }
    };

    const handleProfilePress = (profileId) => {
        navigation.navigate('ProfilePageOther', { profileId, apiBaseUrl });
    };

    if (!fontsLoaded) {
        return <Text>Loading fonts...</Text>;
    }

    return (
        <SafeAreaView style={styles.screen}>
            <TopBar pageName="HomePage" apiBaseUrl={apiBaseUrl} />
            
            <ScrollView 
                style={styles.scrollView}
                contentContainerStyle={styles.scrollContainer}
                showsVerticalScrollIndicator={false}
            >
                <Text style={styles.title}>Notifications</Text>
                
                {/* Book Share Notifications */}
                {bookShareNotifications.length > 0 && (
                    <>
                        <Text style={styles.subtitle}>Shared Books</Text>
                        {bookShareNotifications.map((notification) => (
                            <View key={notification.id} style={styles.notificationCard}>
                                {/* Book Cover */}
                                <TouchableOpacity 
                                        testID={`notif-book-${notification.id}`}
                                        onPress={() => {
                                            const bookData = JSON.stringify({
                                                id: notification.book_id,
                                                title: notification.book_title,
                                                thumbnail: notification.book_cover
                                            });
                                            navigation.navigate('BookShow', { bookData, apiBaseUrl });
                                        }}
                                    >
                                    {notification.book_cover ? (
                                        <Image 
                                            source={{ uri: notification.book_cover }}
                                            style={styles.bookCover}
                                        />
                                    ) : (
                                        <View style={[styles.bookCover, styles.bookCoverPlaceholder]}>
                                            <Text style={styles.bookCoverPlaceholderText}>📖</Text>
                                        </View>
                                    )}
                                </TouchableOpacity>
                                
                                {/* Book Share Info */}
                                <View style={styles.bookShareContent}>
                                    <TouchableOpacity 
                                        testID={`notif-sender-${notification.id}`}
                                        onPress={() => navigation.navigate('ProfilePageOther', { 
                                            userId: notification.sender_id,
                                            apiBaseUrl 
                                        })}
                                    >
                                        <Text style={styles.bookShareText}>
                                            <Text style={styles.linkText}>{notification.sender_username}</Text>
                                            {' sent you'}
                                        </Text>
                                    </TouchableOpacity>
                                    <TouchableOpacity 
                                        testID={`notif-booktitle-${notification.id}`}
                                        onPress={() => {
                                            const bookData = JSON.stringify({
                                                id: notification.book_id,
                                                title: notification.book_title,
                                                thumbnail: notification.book_cover
                                            });
                                            navigation.navigate('BookShow', { bookData, apiBaseUrl });
                                        }}
                                    >
                                        <Text style={styles.bookTitleText}>
                                            {notification.book_title}
                                        </Text>
                                        {notification.book_author && (
                                            <Text style={styles.bookAuthorText}>
                                                {notification.book_author}
                                            </Text>
                                        )}
                                    </TouchableOpacity>
                                </View>
                            </View>
                        ))}
                    </>
                )}
                
                {/* Follower Notifications */}
                <Text style={styles.subtitle}>New followers</Text>
                
                {loading ? (
                    <View style={styles.loadingContainer}>
                        <ActivityIndicator size="large" color="#613F75" />
                    </View>
                ) : followers.length === 0 ? (
                    <View style={styles.emptyContainer}>
                        <Text style={styles.emptyText}>No new followers</Text>
                    </View>
                ) : (
                    followers.map((follower) => (
                        <View key={follower.id} style={styles.notificationCard}>
                            <TouchableOpacity 
                                testID={`notif-user-${follower.id}`}
                                style={styles.userInfo}
                                onPress={() => handleProfilePress(follower.id)}
                            >
                                <Image 
                                    source={
                                        follower.profile_picture 
                                        ? { uri: follower.profile_picture } 
                                        : defaultPicture
                                    }
                                    style={styles.profilePic}
                                />
                                <View style={styles.textInfo}>
                                    <Text style={styles.nameText}>
                                        {follower.first_name} {follower.last_name}
                                    </Text>
                                    <Text style={styles.usernameText}>
                                        @{follower.username}
                                    </Text>
                                    <Text style={styles.notificationText}>
                                        started following you
                                    </Text>
                                </View>
                            </TouchableOpacity>
                            
                            {followingStatus[follower.id] ? (
                                <TouchableOpacity 
                                    testID={`notif-following-${follower.id}`}
                                    style={styles.followingButton}
                                    onPress={() => handleUnfollow(follower.id)}
                                >
                                    <Text style={styles.followingButtonText}>Following</Text>
                                </TouchableOpacity>
                            ) : (
                                <TouchableOpacity 
                                    testID={`notif-followback-${follower.id}`}
                                    style={styles.followBackButton}
                                    onPress={() => handleFollowBack(follower.id)}
                                >
                                    <Text style={styles.followBackButtonText}>Follow Back</Text>
                                </TouchableOpacity>
                            )}
                        </View>
                    ))
                )}
            </ScrollView>
            
            <NavBar navigation={navigation} page="ProfilePage" />
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    screen: {
        flex: 1,
        backgroundColor: '#FFFFFF',
    },
    scrollView: {
        flex: 1,
        marginTop: 84,
    },
    scrollContainer: {
        padding: 20,
        paddingBottom: 100,
    },
    title: {
        fontFamily: 'Nunito_600SemiBold',
        fontSize: 28,
        color: '#613F75',
        marginBottom: 10,
    },
    subtitle: {
        fontFamily: 'Nunito_500Medium',
        fontSize: 16,
        color: '#18101D',
        marginBottom: 20,
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        marginTop: 50,
    },
    emptyContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        marginTop: 50,
    },
    emptyText: {
        fontFamily: 'Nunito_400Regular',
        fontSize: 16,
        color: '#999',
    },
    notificationCard: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: 15,
        marginBottom: 10,
        backgroundColor: '#F7EDF1',
        borderRadius: 10,
    },
    userInfo: {
        flexDirection: 'row',
        alignItems: 'center',
        flex: 1,
    },
    profilePic: {
        width: 50,
        height: 50,
        borderRadius: 25,
        marginRight: 12,
    },
    textInfo: {
        flex: 1,
    },
    nameText: {
        fontFamily: 'Nunito_600SemiBold',
        fontSize: 16,
        color: '#18101D',
    },
    usernameText: {
        fontFamily: 'Nunito_400Regular',
        fontSize: 14,
        color: '#666',
    },
    notificationText: {
        fontFamily: 'Nunito_400Regular',
        fontSize: 12,
        color: '#999',
        marginTop: 2,
    },
    bookShareContent: {
        flex: 1,
        flexDirection: 'column',
        marginLeft: 12,
    },
    bookCover: {
        width: 60,
        height: 90,
        borderRadius: 6,
    },
    bookCoverPlaceholder: {
        backgroundColor: '#E5C3D1',
        justifyContent: 'center',
        alignItems: 'center',
    },
    bookCoverPlaceholderText: {
        fontSize: 30,
    },
    bookTitleText: {
        fontFamily: 'Nunito_700Bold',
        fontSize: 15,
        color: '#613F75',
        marginTop: 4,
    },
    bookAuthorText: {
        fontFamily: 'Nunito_400Regular',
        fontSize: 13,
        color: '#666',
        marginTop: 2,
    },
    bookShareText: {
        fontFamily: 'Nunito_400Regular',
        fontSize: 14,
        color: '#18101D',
    },
    linkText: {
        fontFamily: 'Nunito_600SemiBold',
        fontSize: 14,
        color: '#613F75',
        textDecorationLine: 'underline',
    },
    followBackButton: {
        backgroundColor: '#613F75',
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 20,
    },
    followBackButtonText: {
        fontFamily: 'Nunito_600SemiBold',
        fontSize: 14,
        color: '#FFFFFF',
    },
    followingButton: {
        backgroundColor: '#E5C3D1',
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 20,
    },
    followingButtonText: {
        fontFamily: 'Nunito_600SemiBold',
        fontSize: 14,
        color: '#613F75',
    },
});

export default NotificationsMenu;
