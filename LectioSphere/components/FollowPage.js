import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, Alert, SafeAreaView, TouchableNativeFeedback, ScrollView } from 'react-native';
import NavBar from './Partials/NavBar';
import TopBar from './Partials/TopBar';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import { useFonts, Nunito_400Regular, Nunito_500Medium, Nunito_600SemiBold } from '@expo-google-fonts/nunito';
import { refreshAccessToken } from './refreshAccessToken';
import UserSearchResult from './UserSearchResult';
import PostPartial from './Partials/PostPartial';

const FollowPage = ({ navigation, removeAuthToken, isAuthenticated, apiBaseUrl }) => {
    const [userData, setUserData] = useState(null);
    const [posts, setPosts] = useState(null);
    const [feed, setFeed] = useState(null);


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
    const fetchFeed = async () => {
        try {
            let token = await AsyncStorage.getItem('auth_token');
            const response = await axios.get(`${apiBaseUrl}/api/posts/feed/`, {
                headers: { Authorization: `JWT ${token}` }
            });
            setFeed(response.data);
        } catch (error) {
            if (error.response?.status === 401) {
                const newToken = await refreshAccessToken(apiBaseUrl);
                if (newToken) {
                    const retryResponse = await axios.get(`${apiBaseUrl}/api/posts/feed/`, {
                        headers: { Authorization: `JWT ${newToken}` }
                    });
                    setFeed(retryResponse.data);
                } else {
                    handleLogout();
                }
            } else {
                console.error("Feed fetch error:", error.message);
            }
        }
    }

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
            fetchFeed();
        }
    }, [isAuthenticated]);

    if (!fontsLoaded) {
        return <Text>Loading fonts...</Text>;
    }

    return (
        <SafeAreaView style={styles.screen}>
            <TopBar pageName="FollowPage" apiBaseUrl={apiBaseUrl}/>
            <ScrollView contentContainerStyle={styles.scrollContainer}>
                {feed && feed.length > 0 ? (
                    feed.map((post, index) => (
                        <PostPartial
                            key={`feed-${post.id || index}`}
                            postData={JSON.stringify(post)}
                            apiBaseUrl={apiBaseUrl}
                            navigation={navigation}
                        />
                    ))
                ) : (
                    <View style={styles.noPostsContainer}>
                        <Text style={styles.textAdvice}>
                            There are no posts from the people you follow. Follow users to see their posts here!
                        </Text>
                    </View>
                )}
            </ScrollView>

            <NavBar navigation={navigation} page="FollowPage" />
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    screen: {
        flex: 1,
        justifyContent: 'flex-start',
        alignItems: 'center',
        padding: 0,
        backgroundColor: '#FCF8FA',
    },
    scrollContainer: {
        marginTop: 80,
        paddingBottom: 140,
        flexGrow: 1,
        width: 372,
    },
    noPostsContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 20,
        marginTop: 50,
    },
    header: {
        width: '100%',
        justifyContent: 'flex-start',
        alignItems: 'center',
        marginBottom: 20,
        marginTop: 84,
        paddingHorizontal: 0,
    },
    container: {
        backgroundColor: '#F7EDF1',
        borderColor: '#F3E3E9',
        borderWidth: 1,
        borderRadius: 8,
        paddingVertical: 10,
        width: '95%',
        marginTop: 16,
    },
    textContainer: {
        fontSize: 20,
        fontWeight: '500',
        color: '#18101D',
        fontFamily: 'Nunito_600SemiBold',
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
    containerImages: {
        marginHorizontal: 12,
    },
    textAdvice: {
        fontFamily: 'Nunito_500Medium',
        color: '#613F75',
        fontSize: 16,
        marginHorizontal: 20,
    },
});

export default FollowPage;