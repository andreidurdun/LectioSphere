import React, { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Alert, Image, SafeAreaView, ScrollView } from 'react-native';
import NavBar from './Partials/NavBar';
import TopBar from './Partials/TopBar';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import { useFonts, Nunito_400Regular, Nunito_500Medium, Nunito_600SemiBold } from '@expo-google-fonts/nunito';
import Postings from './Partials/Postings';

const ProfilePageOther = ({ navigation, route, removeAuthToken, apiBaseUrl }) => {
    const { userId } = route.params; // Get the user ID from navigation params
    const [userData, setUserData] = useState(null);
    const [profileData, setProfileData] = useState(null);
    const [authToken, setAuthToken] = useState(null);
    const [refreshToken, setRefreshToken] = useState(null);
    const [isFollowing, setIsFollowing] = useState(false);
    const [followLoading, setFollowLoading] = useState(false);

    const [selected, setSelected] = useState('photo');

    const defaultPicture = require('../assets/defaultProfilePic.jpg');
    const photoPurple = require('../assets/photoPurple.png');
    const photoBlack = require('../assets/photoBlack.png');
    const glassesPurple = require('../assets/glassesPurple.png');
    const glassesBlack = require('../assets/glassesBlack.png');
    const closedBookPurple = require('../assets/closedBookPurple.png');
    const closedBookBlack = require('../assets/closedBookBlack.png');

    const [fontsLoaded] = useFonts({
        Nunito_400Regular,
        Nunito_500Medium,
        Nunito_600SemiBold
    });

    const saveAuthToken = async (newToken, refreshToken) => {
        try {
            await AsyncStorage.setItem('auth_token', newToken);
            setAuthToken(`JWT ${newToken}`);
        } catch (error) {
            console.error("Error saving auth token:", error);
        }
    };

    const fetchUserData = async () => {
        try {
            const response = await axios.get(`${apiBaseUrl}/auth/users/${userId}/`, {
                headers: { Authorization: authToken }
            });
            setUserData(response.data);
        } catch (error) {
            if (error.response?.status === 401) {
                try {
                    const response = await axios.post(`${apiBaseUrl}/auth/jwt/refresh/`, {
                        refresh: refreshToken
                    });
                    const newToken = response.data.access;
                    
                    saveAuthToken(newToken, refreshToken);
                    
                    const retryResponse = await axios.get(`${apiBaseUrl}/auth/users/${userId}/`, {
                        headers: { Authorization: `JWT ${newToken}` }
                    });
                    setUserData(retryResponse.data);
                } catch (refreshError) {
                    console.error("Failed to refresh token:", refreshError);
                }
            } else {
                console.error("User fetch error:", error.message);
            }
        }
    };

    const fetchProfileData = async () => {
        if (!userId) {
            console.error("No userId provided for profile fetch.");
            return;
        }
        try {
            const response = await axios.get(`${apiBaseUrl}/api/accounts/profile/${userId}/details/`, {
                headers: { Authorization: authToken }
            });
            setProfileData(response.data);
        } catch (error) {
            if (error.response?.status === 401) {
                try {
                    const response = await axios.post(`${apiBaseUrl}/auth/jwt/refresh/`, {
                        refresh: refreshToken
                    });
                    const newToken = response.data.access;
                    
                    saveAuthToken(newToken, refreshToken);
                    
                    const retryResponse = await axios.get(`${apiBaseUrl}/api/accounts/profile/read/${userId}`, {
                        headers: { Authorization: `JWT ${newToken}` }
                    });
                    setProfileData(retryResponse.data);
                } catch (refreshError) {
                    console.error("Failed to refresh token:", refreshError);
                }
            } else {
                console.error("Profile fetch error:", error.message);
            }
        }
    };

    const checkFollowStatus = async () => {
        try {
            const response = await axios.get(`${apiBaseUrl}/api/accounts/profile/${userData.id}/is-following/`, {
                headers: { Authorization: authToken }
            });
            setIsFollowing(response.data.is_following);
            console.log(response.data);
        } catch (error) {
            console.error("Follow status check error:", error.message);
        }
    };

    const toggleFollow = async () => {
        if (followLoading) return;
        
        setFollowLoading(true);
        try {
            // const endpoint = isFollowing 
            //     ? `${apiBaseUrl}/api/accounts/${userData.id}/unfollow/` 
            //     : `${apiBaseUrl}/api/accounts/${userData.id}/follow`;
            
            const endpoint = `${apiBaseUrl}/api/accounts/profile/${userData.id}/unfollow`;

            // console.log(endpoint);

            await axios.patch(`${apiBaseUrl}/api/accounts/profile/${userData.id}/follow/`, {}, {
                headers: { Authorization: authToken }
            });
            
            setIsFollowing(!isFollowing);
            
            // Update follower count locally
            // if (profileData) {
            //     setProfileData(prev => ({
            //         ...prev,
            //         follower_count: isFollowing 
            //             ? prev.follower_count - 1 
            //             : prev.follower_count + 1
            //     }));
            // }
        } catch (error) {
            console.error("Follow toggle error:", error.message);
            if (error.response) {
                console.error("Error response data:", error.response.data);
                console.error("Error response status:", error.response.status);
            }
            Alert.alert("Error", "Failed to update follow status. Please try again.");
        } finally {
            setFollowLoading(false);
        }
    };

    useEffect(() => {
        const getTokensAndFetchData = async () => {
            try {
                const storedAuthToken = await AsyncStorage.getItem('auth_token');
                const storedRefreshToken = await AsyncStorage.getItem('refresh_token');
                
                if (storedAuthToken && storedRefreshToken) {
                    setAuthToken(`JWT ${storedAuthToken}`);
                    setRefreshToken(storedRefreshToken);
                }
            } catch (error) {
                console.error("Error retrieving tokens:", error);
            }
        };
        
        getTokensAndFetchData();
    }, []);

    useEffect(() => {
        if (authToken && userId) {
            fetchUserData();
            console.log(userData);
            // fetchProfileData();
            // console.log(profileData);
            
            // checkFollowStatus();
        }
    }, [authToken, userId]);

    if (!fontsLoaded) {
        return null; // or a loading indicator
    }

    // console.log(userData);

    return (
        <SafeAreaView style={styles.screen}>
            <TopBar pageName="HomePage" />

            <ScrollView 
                style={styles.scrollView}
                contentContainerStyle={styles.scrollContainer}
                showsVerticalScrollIndicator={false}
            >
                <View style={styles.body}>
                    <View style={styles.profileCard}>
                        <View style={styles.generalInfo}>
                            {/* <Image 
                                source={
                                    profileData?.profile_pic 
                                    ? { uri: profileData.profile_pic } 
                                    : defaultPicture
                                }
                                style={styles.profilePic}
                            /> */}
                            <View style={styles.textInfo}>
                                <View style={styles.followersInfo}>
                                    <Text style={styles.followers}>
                                        {profileData?.follower_count || 0} {'\n'}followers
                                    </Text>
                                    <View style={styles.verticalLine}></View>
                                    <Text style={styles.followers}>
                                        {profileData?.following_count || 0} {'\n'}following
                                    </Text>
                                </View>
                                <View style={styles.nameAndFollow}>
                                    <View style={styles.nameInfo}>
                                        <View style={styles.fullname}>
                                            <Text style={styles.nameText}>
                                                {userData?.first_name} {userData?.last_name}
                                            </Text>
                                        </View>
                                        <View style={styles.username}>
                                            <Text style={styles.usernameText}>
                                                @{userData?.username}
                                            </Text>
                                        </View>
                                    </View>
                                    <TouchableOpacity 
                                        onPress={toggleFollow}
                                        disabled={followLoading}
                                        style={[
                                            styles.followButton,
                                            isFollowing ? styles.followingButton : styles.notFollowingButton
                                        ]}
                                    >
                                        <Text style={[
                                            styles.followButtonText,
                                            isFollowing ? styles.followingButtonText : styles.notFollowingButtonText
                                        ]}>
                                            {followLoading ? '...' : (isFollowing ? 'Following' : 'Follow')}
                                        </Text>
                                    </TouchableOpacity>
                                </View>
                            </View>
                        </View>
                        <View style={styles.description}>
                            <Text style={styles.bioText}>
                                {profileData?.profile?.bio || "No bio available"}
                            </Text>
                        </View>
                    </View>

                    <View style={styles.selection}>
                        <TouchableOpacity 
                            onPress={() => setSelected('photo')} 
                            style={selected === 'photo' ? [styles.selected, styles.selectionItem] : styles.selectionItem}
                        >
                            <Image 
                                source={selected === 'photo' ? photoPurple : photoBlack} 
                                style={styles.photoIcon} 
                            />
                        </TouchableOpacity>

                        <TouchableOpacity 
                            onPress={() => setSelected('glasses')} 
                            style={selected === 'glasses' ? [styles.selected, styles.selectionItem] : styles.selectionItem}
                        >
                            <Image 
                                source={selected === 'glasses' ? glassesPurple : glassesBlack} 
                                style={styles.glassesIcon} 
                            />
                        </TouchableOpacity>

                        <TouchableOpacity 
                            onPress={() => setSelected('closedBook')} 
                            style={selected === 'closedBook' ? [styles.selected, styles.selectionItem] : styles.selectionItem}
                        >
                            <Image 
                                source={selected === 'closedBook' ? closedBookPurple : closedBookBlack} 
                                style={styles.closedBookIcon} 
                            />
                        </TouchableOpacity>
                    </View>
                </View>

                
                <Postings selection={selected} apiBaseUrl={apiBaseUrl} userId={userData.id} />
            </ScrollView>

            <NavBar navigation={navigation} page="FollowPage" />
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    screen: {
        flex: 1,
        backgroundColor: '#FCF8FA',
    },
    scrollView: {
        flex: 1,
        width: '100%',
    },
    scrollContainer: {
        flexGrow: 1,
        alignItems: 'center',
        paddingBottom: 100, // Space for NavBar
    },
    body: {
        marginTop: 100,
        marginLeft: 6,
        marginRight: 6,
        width: '95%',
    },
    profileCard: {
        width: '100%',
        minHeight: 200,
        backgroundColor: '#F7EDF1',
        borderRadius: 8,
        borderWidth: 1,
        borderColor: '#F3E3E9',
        padding: 16,
        flexDirection: 'column',
    },
    generalInfo: {
        flexDirection: 'row',
        marginBottom: 12,
        paddingBottom: 12,
        borderBottomWidth: 1,
        borderBottomColor: '#E5C3D1',
    },
    description: {
        padding: 8,
        borderRadius: 6,
        marginTop: 5,
    },
    textInfo: {
        flex: 1,
        marginLeft: 15,
    },
    profilePic: {
        width: 100,
        height: 100,
        borderRadius: 60,
        borderWidth: 1,
        borderColor: '#613F75',
    },
    followersInfo: {
        flexDirection: 'row',
        justifyContent: 'flex-end',
        marginBottom: 8,
    },
    followers: {
        fontSize: 14,
        color: '#18101D',
        marginRight: 15,
        fontFamily: 'Nunito_500Medium',
        paddingLeft: 12,
        textAlign: 'center',
    },
    verticalLine: {
        width: 1,
        backgroundColor: '#E5C3D1',
        height: 'auto'
    },
    nameInfo: {
        marginTop: 5,
        flex: 1,
    },
    fullname: {
        marginBottom: 3,
    },
    nameText: {
        fontSize: 18,
        fontWeight: 'semibold',
        color: '#18101D',
        fontFamily: 'Nunito_600SemiBold',
        flexWrap: 'wrap'
    },
    username: {
        marginBottom: 8,
    },
    usernameText: {
        fontSize: 12,
        color: '#613F75',
        fontFamily: 'Nunito_400Regular',
        flexWrap: 'wrap',
    },
    nameAndFollow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center'
    },
    followButton: {
        paddingVertical: 8,
        paddingHorizontal: 16,
        borderRadius: 20,
        borderWidth: 1,
        marginRight: 10,
        minWidth: 80,
        alignItems: 'center',
    },
    notFollowingButton: {
        backgroundColor: '#613F75',
        borderColor: '#613F75',
    },
    followingButton: {
        backgroundColor: 'transparent',
        borderColor: '#613F75',
    },
    followButtonText: {
        fontSize: 14,
        fontFamily: 'Nunito_600SemiBold',
    },
    notFollowingButtonText: {
        color: '#FFFFFF',
    },
    followingButtonText: {
        color: '#613F75',
    },
    bioText: {
        fontSize: 16,
        lineHeight: 20,
        color: '#18101D',
        fontFamily: 'Nunito_600SemiBold',
        textAlign: 'center',
        flexWrap: 'wrap'
    },
    selection: {
        marginTop: 16,
        marginBottom: 16,
        backgroundColor: '#F7EDF1',
        borderRadius: 8,
        borderWidth: 1,
        borderColor: '#F3E3E9',
        flexDirection: 'row',
        justifyContent: 'space-around',
        padding: 12,
        alignItems: 'center',
    },
    selectionItem: {
        width: 40,
        height: 30,
        justifyContent: 'center',
    },
    selected: {
        borderBottomWidth: 1,
        borderBottomColor: '#613F75',
    },
    photoIcon: {
        width: 32,
        height: 24,
        alignSelf: 'center'
    },
    glassesIcon: {
        width: 31,
        height: 24,
        alignSelf: 'center'
    },
    closedBookIcon: {
        width: 21,
        height: 24,
        alignSelf: 'center'
    },
});

export default ProfilePageOther;