import React, { useState } from 'react';
import { SafeAreaView, View, Text, TextInput, Button, StyleSheet, Alert, Image } from 'react-native';
import { useFonts, Nunito_400Regular, Nunito_500Medium, Nunito_600SemiBold } from '@expo-google-fonts/nunito';
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function RegisterMenu ({ navigation, saveAuthToken, apiBaseUrl }) {
    
    const [email, setEmail] = useState('');
    const [first_name, setFirstName] = useState('');
    const [last_name, setLastName] = useState('');
    const [password, setPassword] = useState('');
    const [re_password, setRePassword] = useState('');
    
    const [fontsLoaded] = useFonts({
        Nunito_400Regular,
        Nunito_500Medium,
        Nunito_600SemiBold
    });

    if (!fontsLoaded) {
        return <Text>Loading fonts...</Text>;
    }

    const handleSubmit = async () => {
        // Validare de bază pe frontend înainte de a trimite la server
        if (!email || !first_name || !last_name || !password || !re_password) {
            Alert.alert('Validation Error', 'All fields are required');
            return;
        }

        if (password !== re_password) {
            Alert.alert('Validation Error', 'Passwords do not match');
            return;
        }

        const userData = {
            email,
            first_name,
            last_name,
            password,
            re_password
        };

        try {
            const config = {
                headers: {
                    'Content-Type': 'application/json',
                }
            };
            // Folosim URL-ul API din props
            const response = await axios.post(`${apiBaseUrl}/auth/users/`, userData, config);
            
            // Înregistrarea a fost reușită, acum încercăm să autentificăm utilizatorul
            try {
                const loginResponse = await axios.post(`${apiBaseUrl}/auth/jwt/create/`, {
                    email: email,
                    password: password
                });

                if (loginResponse.status === 200) {
                    const { access, refresh } = loginResponse.data;
                    
                    // Salvăm refresh tokenul
                    await AsyncStorage.setItem('refreshToken', refresh);
                    
                    // Folosim funcția transmisă prin props pentru a salva tokenul și a actualiza starea
                    saveAuthToken(access);
                    
                    Alert.alert(
                        'Registration Successful',
                        'Your account has been created and you have been logged in.',
                        [{ text: 'OK', onPress: () => navigation.replace('HomePage') }]
                    );
                }
            } catch (loginError) {
                console.error('Auto-login error:', loginError.response?.data || loginError.message);
                
                // Dacă autentificarea automată eșuează, redirecționăm utilizatorul către pagina de login
                Alert.alert(
                    'Registration Successful',
                    'Your account has been created. Please log in with your credentials.',
                    [{ text: 'OK', onPress: () => navigation.replace('LoginMenu') }]
                );
            }
        } catch (error) {
            console.error('Registration error:', error.response?.data || error.message);
            
            // Extract error messages from response
            let errorMessage = 'Registration failed. Please try again.';
            if (error.response) {
                const errorData = error.response.data;
                if (typeof errorData === 'object') {
                    // Convert object errors to readable format
                    const errorDetails = Object.entries(errorData)
                        .map(([key, value]) => `${key}: ${Array.isArray(value) ? value.join(', ') : value}`)
                        .join('\n');
                    errorMessage = errorDetails || errorMessage;
                } else if (typeof errorData === 'string') {
                    errorMessage = errorData;
                }
                
                if (error.response.status === 400) {
                    errorMessage = 'Validation error: ' + errorMessage;
                } else if (error.response.status === 500) {
                    errorMessage = 'Server error (500). The server encountered an internal error. Please check server logs for details.';
                }
            } else if (error.request) {
                // The request was made but no response was received
                errorMessage = 'No response received from server. Please check if the server is running.';
            }
            
            Alert.alert('Registration Error', errorMessage);
        }
    };

    return (
        <SafeAreaView style={styles.container}>

            <Image
                source={require('../assets/favicon.png')}
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
                <Text style={styles.label}>First Name:</Text>
                <TextInput
                    style={styles.input}
                    value={first_name}
                    onChangeText={setFirstName}
                    placeholder="Enter your first name"
                    autoCapitalize="none"
                    placeholderTextColor="#E5C3D1" // Placeholder text color
                />
            </View>

            <View style={styles.inputGroup}>
                <Text style={styles.label}>Last Name:</Text>
                <TextInput
                    style={styles.input}
                    value={last_name}
                    onChangeText={setLastName}
                    placeholder="Enter your last name"
                    autoCapitalize="none"
                    placeholderTextColor="#E5C3D1" // Placeholder text color
                />
            </View>

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

            <View style={styles.inputGroup}>
                <Text style={styles.label}>Confirm your password:</Text>
                <TextInput
                    style={styles.input}
                    value={re_password}
                    onChangeText={setRePassword}
                    placeholder="Confirm your password"
                    secureTextEntry
                    placeholderTextColor="#E5C3D1" // Placeholder text color
                />
            </View>
            
            <View style={{ marginTop: 12, width: '100%' }}>
                <Button
                    title="Register"
                    onPress={handleSubmit}
                    color="#613F75" // Set button color to match the theme
                />
            </View>

            <Text style={styles.registerText}>
                Already have an account?{' '}
                <Text
                    style={{ color: '#613F75', textDecorationLine: 'underline' }}
                    onPress={() => navigation.navigate('LoginMenu')}>
                    Log In!
                </Text>
            </Text>

        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center', // Center content horizontally
        padding: 20,
        backgroundColor: '#FFFFFF',
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
        height: '25%',
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
        marginBottom: 8,
    },
    registerText: {
        marginTop: 16,
    },
    logo: {
        padding: 0,
        margin: 0,
    }
});


