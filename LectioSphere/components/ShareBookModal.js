import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, Modal, ScrollView, Image, TouchableOpacity, Alert, ActivityIndicator } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import { useFonts, Nunito_400Regular, Nunito_500Medium, Nunito_600SemiBold } from '@expo-google-fonts/nunito';
import { refreshAccessToken } from './refreshAccessToken';

const ShareBookModal = ({ visible, onClose, bookId, bookTitle, bookCover, bookAuthor, apiBaseUrl }) => {
    const [friends, setFriends] = useState([]);
    const [loading, setLoading] = useState(false);
    const [sharing, setSharing] = useState(false);

    const defaultPicture = require('../assets/defaultProfilePic.jpg');

    const [fontsLoaded] = useFonts({
        Nunito_400Regular,
        Nunito_500Medium,
        Nunito_600SemiBold
    });

    useEffect(() => {
        if (visible) {
            fetchFriends();
        }
    }, [visible]);

    const fetchFriends = async () => {
        try {
            setLoading(true);
            let token = await AsyncStorage.getItem('auth_token');
            
            const response = await axios.get(`${apiBaseUrl}/api/accounts/profile/friends/`, {
                headers: { Authorization: `JWT ${token}` }
            });
            
            setFriends(response.data.friends || []);
            
        } catch (error) {
            if (error.response?.status === 401) {
                const newToken = await refreshAccessToken(apiBaseUrl);
                if (newToken) {
                    fetchFriends(); // Retry with new token
                }
            } else {
                console.error("Error fetching friends:", error.message);
                Alert.alert('Error', 'Failed to load friends list');
            }
        } finally {
            setLoading(false);
        }
    };

    const handleShareWithFriend = async (friendId, friendUsername) => {
        try {
            setSharing(true);
            let token = await AsyncStorage.getItem('auth_token');
            
            await axios.post(
                `${apiBaseUrl}/books/share/`,
                {
                    recipient_id: friendId,
                    book_id: bookId,
                    book_title: bookTitle || 'Unknown Book',
                    book_cover: bookCover || '',
                    book_author: bookAuthor || 'Unknown Author'
                },
                {
                    headers: { Authorization: `JWT ${token}` }
                }
            );
            
            Alert.alert('Success', `Book shared with ${friendUsername}!`);
            onClose();
            
        } catch (error) {
            if (error.response?.status === 401) {
                const newToken = await refreshAccessToken(apiBaseUrl);
                if (newToken) {
                    handleShareWithFriend(friendId, friendUsername); // Retry
                }
            } else {
                console.error("Error sharing book:", error.message);
                const errorMsg = error.response?.data?.detail || 'Failed to share book';
                Alert.alert('Error', errorMsg);
            }
        } finally {
            setSharing(false);
        }
    };

    if (!fontsLoaded) {
        return null;
    }

    return (
        <Modal
            animationType="slide"
            transparent={true}
            visible={visible}
            onRequestClose={onClose}
        >
            <View style={styles.modalOverlay}>
                <View style={styles.modalContent}>
                    <View style={styles.modalHeader}>
                        <Text style={styles.modalTitle}>Share "{bookTitle}"</Text>
                        <TouchableOpacity onPress={onClose} style={styles.closeButton}>
                            <Text style={styles.closeButtonText}>✕</Text>
                        </TouchableOpacity>
                    </View>
                    
                    <Text style={styles.subtitle}>Select a friend to share with:</Text>
                    
                    {loading ? (
                        <View style={styles.loadingContainer}>
                            <ActivityIndicator size="large" color="#613F75" />
                        </View>
                    ) : friends.length === 0 ? (
                        <View style={styles.emptyContainer}>
                            <Text style={styles.emptyText}>
                                No friends to share with.{'\n'}
                                Friends are people who follow each other.
                            </Text>
                        </View>
                    ) : (
                        <ScrollView 
                            style={styles.friendsList}
                            showsVerticalScrollIndicator={false}
                        >
                            {friends.map((friend) => (
                                <TouchableOpacity
                                    key={friend.id}
                                    style={styles.friendCard}
                                    onPress={() => handleShareWithFriend(friend.user, friend.username)}
                                    disabled={sharing}
                                >
                                    <Image 
                                        source={
                                            friend.profile_picture 
                                            ? { uri: friend.profile_picture } 
                                            : defaultPicture
                                        }
                                        style={styles.profilePic}
                                    />
                                    <View style={styles.friendInfo}>
                                        <Text style={styles.friendName}>
                                            {friend.first_name} {friend.last_name}
                                        </Text>
                                        <Text style={styles.friendUsername}>
                                            @{friend.username}
                                        </Text>
                                    </View>
                                    <View style={styles.shareIcon}>
                                        <Text style={styles.shareIconText}>→</Text>
                                    </View>
                                </TouchableOpacity>
                            ))}
                        </ScrollView>
                    )}
                </View>
            </View>
        </Modal>
    );
};

const styles = StyleSheet.create({
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    modalContent: {
        width: '90%',
        maxHeight: '80%',
        backgroundColor: '#FFFFFF',
        borderRadius: 20,
        padding: 20,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.25,
        shadowRadius: 4,
        elevation: 5,
    },
    modalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 10,
    },
    modalTitle: {
        fontFamily: 'Nunito_600SemiBold',
        fontSize: 20,
        color: '#613F75',
        flex: 1,
    },
    closeButton: {
        padding: 5,
    },
    closeButtonText: {
        fontFamily: 'Nunito_600SemiBold',
        fontSize: 24,
        color: '#613F75',
    },
    subtitle: {
        fontFamily: 'Nunito_500Medium',
        fontSize: 14,
        color: '#666',
        marginBottom: 15,
    },
    loadingContainer: {
        padding: 40,
        justifyContent: 'center',
        alignItems: 'center',
    },
    emptyContainer: {
        padding: 40,
        justifyContent: 'center',
        alignItems: 'center',
    },
    emptyText: {
        fontFamily: 'Nunito_400Regular',
        fontSize: 14,
        color: '#999',
        textAlign: 'center',
    },
    friendsList: {
        maxHeight: 400,
    },
    friendCard: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 15,
        marginBottom: 10,
        backgroundColor: '#F7EDF1',
        borderRadius: 10,
    },
    profilePic: {
        width: 50,
        height: 50,
        borderRadius: 25,
        marginRight: 12,
    },
    friendInfo: {
        flex: 1,
    },
    friendName: {
        fontFamily: 'Nunito_600SemiBold',
        fontSize: 16,
        color: '#18101D',
    },
    friendUsername: {
        fontFamily: 'Nunito_400Regular',
        fontSize: 14,
        color: '#666',
    },
    shareIcon: {
        width: 30,
        height: 30,
        borderRadius: 15,
        backgroundColor: '#613F75',
        justifyContent: 'center',
        alignItems: 'center',
    },
    shareIconText: {
        color: '#FFFFFF',
        fontSize: 18,
        fontFamily: 'Nunito_600SemiBold',
    },
});

export default ShareBookModal;
