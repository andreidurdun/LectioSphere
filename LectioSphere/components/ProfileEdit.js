import React, { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Alert, Image, SafeAreaView, TextInput, ScrollView, ActivityIndicator } from 'react-native';
import NavBar from './Partials/NavBar';
import TopBar from './Partials/TopBar';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import { useFonts, Nunito_400Regular, Nunito_500Medium, Nunito_600SemiBold } from '@expo-google-fonts/nunito';
import * as ImagePicker from 'expo-image-picker';

export default function ProfileEdit({ navigation, removeAuthToken, apiBaseUrl }) {
    const [userData, setUserData] = useState(null);
    const [profileData, setProfileData] = useState(null);
    const [authToken, setAuthToken] = useState(null);
    const [loading, setLoading] = useState(true);
    const [profileImage, setProfileImage] = useState(null);
    const [firstName, setFirstName] = useState('');
    const [lastName, setLastName] = useState('');
    const [username, setUsername] = useState('');
    const [email, setEmail] = useState('');
    const [bio, setBio] = useState('');

    const defaultPicture = require('../assets/defaultProfilePic.jpg');
    const editPen = require('../assets/editPen.png');

    const [fontsLoaded] = useFonts({
        Nunito_400Regular,
        Nunito_500Medium,
        Nunito_600SemiBold
    });

    useEffect(() => {
        const getToken = async () => {
            try {
                const token = await AsyncStorage.getItem('auth_token');
                if (token) {
                    setAuthToken(`JWT ${token}`);
                } else {
                    navigation.navigate('LoginMenu');
                }
            } catch (error) {
                console.error('Error reading auth token:', error);
                navigation.navigate('LoginMenu');
            }
        };

        getToken();
    }, []);

    useEffect(() => {
        if (authToken) {
            fetchUserData();
            fetchProfileData();
        }
    }, [authToken]);    
    
    const fetchUserData = async () => {
        try {
            const response = await axios.get(`${apiBaseUrl}/auth/users/me/`, {
                headers: { Authorization: authToken }
            });
            setUserData(response.data);
            setFirstName(response.data.first_name || '');
            setLastName(response.data.last_name || '');
            setUsername(response.data.username || '');
            setEmail(response.data.email || '');
        } catch (error) {
            console.error("User fetch error:", error.message);
            Alert.alert('Error', 'Failed to load user data.');
        }
    };    
    
    const fetchProfileData = async () => {
        try {
            const response = await axios.get(`${apiBaseUrl}/api/accounts/profile/read/`, {
                headers: { Authorization: authToken }
            });            
            console.log('Profile data received:', response.data);
            setProfileData(response.data);
            setBio(response.data.profile.bio || '');
            setProfileImage(response.data.profile.profile_pic ? { uri: response.data.profile_pic } : null);
            setLoading(false);
        } catch (error) {
            console.error("Profile fetch error:", error.message);
            Alert.alert('Error', 'Failed to load profile data.');
            setLoading(false);
        }
    };
    
    const saveProfile = async () => {
        setLoading(true);
        
        try {
            // Actualizăm profilul
            const profileFormData = new FormData();
            profileFormData.append('bio', bio);
            
            console.log('Sending profile update request...');
            await axios.patch(
                `${apiBaseUrl}/api/accounts/profile/update/`,
                { 
                    first_name: firstName,
                    last_name: lastName,
                    username: username,
                    email: email,
                    bio: bio 
                },  // Send as regular JSON instead of FormData
                {
                    headers: {
                        Authorization: authToken,
                        'Content-Type': 'application/json'  // Change to JSON content type
                    }
                }
            );
            console.log('Profile updated successfully!');
            
            Alert.alert('Success', 'Profile updated successfully!');
            navigation.navigate('ProfilePage');} catch (error) {
            console.error('Error updating profile:', error);
            let errorMessage = 'Could not update profile. Please try again.';
            
            if (error.response) {
                console.error('Response error data:', error.response.data);
                console.error('Response error status:', error.response.status);
                
                if (error.response.data && typeof error.response.data === 'object') {
                    // Try to extract more specific error messages from the response
                    errorMessage = Object.entries(error.response.data)
                        .map(([key, value]) => `${key}: ${Array.isArray(value) ? value.join(', ') : value}`)
                        .join('\n');
                } else if (typeof error.response.data === 'string') {
                    errorMessage = error.response.data;
                }
                
                if (error.response.status === 500) {
                    errorMessage = 'Server error occurred. Please check with administrators.';
                }
            }
            
            Alert.alert('Error', errorMessage);
        } finally {
            setLoading(false);
        }
    };

    if (!fontsLoaded || loading) {
        return (
            <SafeAreaView style={styles.container}>                
                <TopBar title="Edit Profile" navigation={navigation} />
                <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color="#6200EE" />
                    <Text style={styles.loadingText}>Loading...</Text>
                </View>
                <NavBar navigation={navigation} />
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView style={styles.container}>
            <TopBar title="Edit Profile" navigation={navigation} />
              <View style={styles.mainContent}>
                <ScrollView 
                    style={styles.scrollView}
                    contentContainerStyle={styles.scrollContent}
                    showsVerticalScrollIndicator={true}
                    keyboardShouldPersistTaps="handled"
                >
                
                    <Text style={styles.sectionTitle}>Personal Information</Text>
                
                    <View style={styles.formGroup}>
                        <Text style={styles.label}>First Name</Text>
                        <TextInput
                            style={styles.input}
                            value={firstName}
                            onChangeText={setFirstName}
                            placeholder="Enter your first name"
                        />
                    </View>
                
                    <View style={styles.formGroup}>
                        <Text style={styles.label}>Last Name</Text>
                        <TextInput
                            style={styles.input} 
                            value={lastName}
                            onChangeText={setLastName}
                            placeholder="Enter your last name"
                        />
                    </View>
                
                    <View style={styles.formGroup}>
                        <Text style={styles.label}>Username</Text>
                        <TextInput
                            style={styles.input}
                            value={username}
                                                    onChangeText={setUsername}
                            placeholder="Enter your username"
                        />
                    </View>
                    <View style={styles.formGroup}>
                        <Text style={styles.label}>Email</Text>
                        <TextInput
                            style={styles.input}
                            value={email}
                            onChangeText={setEmail}
                            placeholder="Enter your email"
                            keyboardType="email-address"
                        />
                    </View>
                    <View style={styles.formGroup}>
                        <Text style={styles.label}>Description</Text>
                        <TextInput
                            style={[styles.input, styles.textArea]}
                            value={bio}
                            onChangeText={setBio}
                            placeholder="Write a few words about yourself"
                            multiline
                            numberOfLines={4}
                        />
                    </View>
                    
                    <TouchableOpacity style={styles.saveButton} onPress={saveProfile}>
                        <Text style={styles.saveButtonText}>Save Changes</Text>
                    </TouchableOpacity>
                </ScrollView>
                
                <NavBar navigation={navigation} />
            </View>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F5F5F5',
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    loadingText: {
        marginTop: 10,
        fontFamily: 'Nunito_500Medium',
        color: '#333',
    },
    mainContent: {
        flex: 1,
    },
    scrollView: {
        flex: 1, 
        paddingHorizontal: 20,
        paddingTop: 20,
    },
    profileImageContainer: {
        alignItems: 'center',
        marginBottom: 30,
        position: 'relative',
    },
    profileImage: {
        width: 120,
        height: 120,
        borderRadius: 60,
        borderWidth: 1,
        borderColor: '#613F75',
    },
    editImageButton: {
        position: 'absolute',
        right: '35%',
        bottom: 0,
        backgroundColor: 'white',
        borderRadius: 20,
        padding: 8,
        borderWidth: 1,
        borderColor: '#E0E0E0',
    },
    editIcon: {
        width: 20,
        height: 20,
    },
    sectionTitle: {
        fontFamily: 'Nunito_600SemiBold',
        fontSize: 18,
        color: '#333',
        marginBottom: 15,
    },
    formGroup: {
        marginBottom: 20,
    },
    label: {
        fontFamily: 'Nunito_500Medium',
        fontSize: 14,
        color: '#555',
        marginBottom: 5,
    },
    input: {
        backgroundColor: 'white',
        borderWidth: 1,
        borderColor: '#E0E0E0',
        borderRadius: 8,
        padding: 12,
        fontFamily: 'Nunito_400Regular',
        fontSize: 16,
    },
    textArea: {
        height: 100,
        textAlignVertical: 'top',
    },
    saveButton: {
        backgroundColor: '#613F75',
        paddingVertical: 12,
        borderRadius: 8,
        alignItems: 'center',
        marginTop: 10,
        marginBottom: 30,
    },
    saveButtonText: {
        color: 'white',
        fontFamily: 'Nunito_600SemiBold',
        fontSize: 16,
    },
    scrollContent: {
        flexGrow: 1,
        paddingBottom: 120,
        paddingTop: 50
    },
});