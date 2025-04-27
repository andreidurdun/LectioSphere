import React, { useState } from 'react';
import { SafeAreaView, View, Text, TextInput, Button, StyleSheet, Alert, Image } from 'react-native';
import { useFonts, Nunito_400Regular, Nunito_500Medium, Nunito_600SemiBold } from '@expo-google-fonts/nunito';
import { useNavigation } from '@react-navigation/native';
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import getIP from '../IPADDRESS';

export default function LoginMenu ({navigation}) {

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
            const response = await axios.post(getIP+':8000/auth/jwt/create/', 
                {
                    email: email,
                    password: password
                });

            if (response.status === 200) {
                const { access, refresh } = response.data;
                await AsyncStorage.setItem('accessToken', access);
                await AsyncStorage.setItem('refreshToken', refresh);
                //Alert.alert('Login Successful', 'You have been logged in successfully.');
            } else {
                Alert.alert('Login Failed', 'Invalid email or password.');
            }
            navigation.replace('HomePage');
          } catch (err) {
            console.error(err);
          }
    };

    return (
        <SafeAreaView style={styles.container}>

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


