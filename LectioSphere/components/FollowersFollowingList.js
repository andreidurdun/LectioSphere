import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, SafeAreaView, ScrollView, Image, TouchableOpacity, Alert, ActivityIndicator } from 'react-native';
import NavBar from './Partials/NavBar';
import TopBar from './Partials/TopBar';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import { useFonts, Nunito_400Regular, Nunito_500Medium, Nunito_600SemiBold } from '@expo-google-fonts/nunito';
import { refreshAccessToken } from './refreshAccessToken';

const FollowersFollowingList = ({ navigation, route, apiBaseUrl }) => {
    const { profileId, listType, username } = route.params; // listType: 'followers' or 'following'
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [followingStatus, setFollowingStatus] = useState({});
    const [currentUserId, setCurrentUserId] = useState(null);

    const defaultPicture = require('../assets/defaultProfilePic.jpg');

    const [fontsLoaded] = useFonts({
        Nunito_400Regular,
        Nunito_500Medium,
        Nunito_600SemiBold
    });

    useEffect(() => {
        fetchCurrentUser();
        fetchList();
    }, [profileId, listType]);

    const fetchCurrentUser = async () => {
        try {
            let token = await AsyncStorage.getItem('auth_token');
            const response = await axios.get(`${apiBaseUrl}/auth/users/me/`, {
                headers: { Authorization: `JWT ${token}` }
            });
            setCurrentUserId(response.data.id);
        } catch (error) {
            console.error('Error fetching current user:', error);
        }
    };

    const fetchList = async () => {
        try {
            setLoading(true);
            let token = await AsyncStorage.getItem('auth_token');
            
            const endpoint = listType === 'followers' 
                ? `${apiBaseUrl}/api/accounts/profile/${profileId}/followers/`
                : `${apiBaseUrl}/api/accounts/profile/${profileId}/following/`;
            
            const response = await axios.get(endpoint, {
                headers: { Authorization: `JWT ${token}` }
            });
            
            const usersList = response.data[listType] || [];
            setUsers(usersList);
            
            // Build following status map
            const statusMap = {};
            usersList.forEach(user => {
                statusMap[user.id] = listType === 'followers' 
                    ? user.is_following_back 
                    : user.is_following;
            });
            setFollowingStatus(statusMap);
            
        } catch (error) {
            if (error.response?.status === 401) {
                const newToken = await refreshAccessToken(apiBaseUrl);
                if (newToken) {
                    fetchList(); // Retry with new token
                }
            } else {
                console.error("Error fetching list:", error.message);
                Alert.alert('Error', `Failed to load ${listType}`);
            }
        } finally {
            setLoading(false);
        }
    };

    const handleFollow = async (userId) => {
        try {
            let token = await AsyncStorage.getItem('auth_token');
            
            await axios.patch(
                `${apiBaseUrl}/api/accounts/profile/${userId}/follow/`,
                {},
                {
                    headers: { Authorization: `JWT ${token}` }
                }
            );
            
            // Update local state
            setFollowingStatus(prev => ({
                ...prev,
                [userId]: true
            }));
            
        } catch (error) {
            if (error.response?.status === 401) {
                const newToken = await refreshAccessToken(apiBaseUrl);
                if (newToken) {
                    handleFollow(userId); // Retry
                }
            } else {
                console.error("Error following user:", error.message);
                Alert.alert('Error', 'Failed to follow user');
            }
        }
    };

    const handleUnfollow = async (userId) => {
        try {
            let token = await AsyncStorage.getItem('auth_token');
            
            await axios.patch(
                `${apiBaseUrl}/api/accounts/profile/${userId}/unfollow/`,
                {},
                {
                    headers: { Authorization: `JWT ${token}` }
                }
            );
            
            // Update local state
            setFollowingStatus(prev => ({
                ...prev,
                [userId]: false
            }));
            
        } catch (error) {
            if (error.response?.status === 401) {
                const newToken = await refreshAccessToken(apiBaseUrl);
                if (newToken) {
                    handleUnfollow(userId); // Retry
                }
            } else {
                console.error("Error unfollowing user:", error.message);
                Alert.alert('Error', 'Failed to unfollow user');
            }
        }
    };

    const handleProfilePress = (userId) => {
        if (userId === currentUserId) {
            navigation.navigate('ProfilePage', { apiBaseUrl });
        } else {
            navigation.push('ProfilePageOther', { userId, apiBaseUrl });
        }
    };

    if (!fontsLoaded) {
        return <Text>Loading fonts...</Text>;
    }

    const title = listType === 'followers' 
        ? `${username}'s Followers` 
        : `${username}'s Following`;

    return (
        <SafeAreaView style={styles.screen}>
            <TopBar pageName="HomePage" apiBaseUrl={apiBaseUrl} />
            
            <ScrollView 
                style={styles.scrollView}
                contentContainerStyle={styles.scrollContainer}
                showsVerticalScrollIndicator={false}
            >
                <Text style={styles.title} testID="followers-title" accessibilityLabel="followers-title">{title}</Text>
                
                {loading ? (
                    <View style={styles.loadingContainer}>
                        <ActivityIndicator size="large" color="#613F75" />
                    </View>
                ) : users.length === 0 ? (
                    <View style={styles.emptyContainer}>
                        <Text style={styles.emptyText}>
                            {listType === 'followers' ? 'No followers yet' : 'Not following anyone yet'}
                        </Text>
                    </View>
                ) : (
                    users.map((user) => (
                        <View key={user.id} style={styles.userCard}>
                            <TouchableOpacity 
                                style={styles.userInfo}
                                onPress={() => handleProfilePress(user.id)}
                                accessibilityLabel={`follower-user-${user.id}`}
                            >
                                <Image 
                                    source={
                                        user.profile_picture 
                                        ? { uri: user.profile_picture } 
                                        : defaultPicture
                                    }
                                    style={styles.profilePic}
                                    accessibilityLabel={`follower-user-image-${user.id}`}
                                />
                                <View style={styles.textInfo}>
                                    <Text style={styles.nameText} accessibilityLabel={`follower-user-name-${user.id}`}>
                                        {user.first_name} {user.last_name}
                                    </Text>
                                    <Text style={styles.usernameText} accessibilityLabel={`follower-user-username-${user.id}`}>
                                        @{user.username}
                                    </Text>
                                </View>
                            </TouchableOpacity>
                            
                            {user.id !== currentUserId && (
                                followingStatus[user.id] ? (
                                    <TouchableOpacity 
                                        style={styles.followingButton}
                                        onPress={() => handleUnfollow(user.id)}
                                        accessibilityLabel={`follower-unfollow-button-${user.id}`}
                                    >
                                        <Text style={styles.followingButtonText}>Following</Text>
                                    </TouchableOpacity>
                                ) : (
                                    <TouchableOpacity 
                                        style={styles.followButton}
                                        onPress={() => handleFollow(user.id)}
                                        accessibilityLabel={`follower-follow-button-${user.id}`}
                                    >
                                        <Text style={styles.followButtonText}>Follow</Text>
                                    </TouchableOpacity>
                                )
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
    userCard: {
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
    followButton: {
        backgroundColor: '#613F75',
        paddingHorizontal: 20,
        paddingVertical: 8,
        borderRadius: 20,
    },
    followButtonText: {
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

export default FollowersFollowingList;
