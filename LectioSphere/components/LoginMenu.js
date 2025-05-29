import React, { useState } from 'react';
import { SafeAreaView, View, Text, TextInput, Button, StyleSheet, Alert, Image, ScrollView, KeyboardAvoidingView, Platform } from 'react-native';
import { useFonts, Nunito_400Regular, Nunito_500Medium, Nunito_600SemiBold } from '@expo-google-fonts/nunito';
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function LoginMenu ({ navigation, saveAuthToken, apiBaseUrl }) {

    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    
    const [fontsLoaded] = useFonts({
        Nunito_400Regular,
        Nunito_500Medium,
        Nunito_600SemiBold
    });

    if (!fontsLoaded) {
        return <Text>Loading fonts...</Text>;
    }

    const handleSubmit = async () => {
        try {
            const response = await axios.post(`${apiBaseUrl}/auth/jwt/create/`, {
                email: email,
                password: password
            });

            if (response.status === 200) {
                const { access, refresh } = response.data;
                
                // Salvăm refresh token-ul
                await AsyncStorage.setItem('refresh_token', refresh);
                
                // Folosim funcția transmisă prin props pentru a salva access token-ul
                // și a actualiza starea de autentificare
                saveAuthToken(access);
                
                navigation.replace('HomePage');
            } 
        } catch (error) {
            console.error('Login error details:', error.response?.data || error.message);
            
            // Extract error messages from response
            let errorMessage = 'Login failed. Please check your credentials and try again.';
            if (error.response?.data) {
                const errorData = error.response.data;
                if (typeof errorData === 'object') {
                    const errorDetails = Object.entries(errorData)
                        .map(([key, value]) => `${key}: ${Array.isArray(value) ? value.join(', ') : value}`)
                        .join('\n');
                    errorMessage = errorDetails || errorMessage;
                } else if (typeof errorData === 'string') {
                    errorMessage = errorData;
                }
            }
            
            Alert.alert('Login Error', errorMessage);
        }
    };    return (
        <SafeAreaView style={styles.container}>
            <KeyboardAvoidingView 
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                style={styles.keyboardView}
            >
                <ScrollView 
                    style={styles.scrollView}
                    contentContainerStyle={styles.scrollContainer}
                    showsVerticalScrollIndicator={false}
                    keyboardShouldPersistTaps="handled"
                    enableOnAndroid={true}
                >
                    <Image
                        source={require('../assets/favicon.png')} // Replace with your actual image path
                        style={styles.bigIcon}
                        resizeMode="contain"
                    />

                    <Text style={styles.title}>
                        LectioSphere
                    </Text>
                    <Text style={styles.subtitle}>
                        Literary Experience, Community, Thoughts, Interaction, Organization
                    </Text>
                
                    <View style={styles.inputGroup}>
                        <Text style={styles.label}>Email:</Text>
                        <TextInput
                            style={styles.input}
                            value={email}
                            onChangeText={setEmail}
                            placeholder="Enter your Email"
                            autoCapitalize="none"
                            keyboardType="email-address"
                            placeholderTextColor="#E5C3D1" // Placeholder text color
                        />
                    </View>
                    
                    <View style={styles.inputGroup}>
                        <Text style={styles.label}>Password:</Text>
                        <TextInput
                            style={styles.input}
                            value={password}
                            onChangeText={setPassword}
                            placeholder="Enter your password"
                            secureTextEntry
                            placeholderTextColor="#E5C3D1" // Placeholder text color
                        />
                    </View>
                    
                    <View style={{ marginTop: 12, width: '100%' }}>
                        <Button
                            title="Login"
                            onPress={handleSubmit}
                            color="#613F75" // Set button color to match the theme
                        />
                    </View>

                    <Text style={styles.registerText}>
                        Don't have an account?{' '}
                        <Text
                            style={{ color: '#613F75', textDecorationLine: 'underline' }}
                            onPress={() => navigation.navigate('RegisterMenu')}>
                            Register Now!
                        </Text>
                    </Text>
                </ScrollView>
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#FFFFFF',
    },
    keyboardView: {
        flex: 1,
    },
    scrollView: {
        flex: 1,
    },
    scrollContainer: {
        flexGrow: 1,
        justifyContent: 'center',
        alignItems: 'center', // Center content horizontally
        padding: 20,
        paddingBottom: 100, // Extra padding at bottom for keyboard
    },
    inputGroup: {
        marginBottom: 15,
        width: '100%', // Ensure inputs take full width
    },
    label: {
        fontSize: 16,
        marginBottom: 5,
        color: '#18101D'
    },
    input: {
        borderWidth: 1,
        borderColor: '#F3E3E9',
        borderRadius: 5,
        padding: 10,
        fontSize: 16,
        width: '100%', // Ensure inputs take full width
    },
    bigIcon: {
        maxWidth: '100%',
        height: 150, // Reduced height for better keyboard handling
        marginBottom: 20, // Add spacing below the image
    },
    title: {
        fontFamily: 'Nunito_600SemiBold',
        fontSize: 32,
        color: '#613F75'
    },
    subtitle: {
        fontFamily: 'Nunito_400Regular',
        fontSize: 10,
        color: '#18101D',
        marginBottom: 20, // Increased margin for better spacing
    },
    registerText: {
        marginTop: 20, // Increased margin
        marginBottom: 20, // Added bottom margin
    },
    logo: {
        padding: 0,
        margin: 0,
    }
});


