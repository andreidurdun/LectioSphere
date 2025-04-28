import React, { useState } from 'react';
import { SafeAreaView, View, Text, TextInput, Button, StyleSheet, Alert, Image } from 'react-native';
import { useFonts, Nunito_400Regular, Nunito_500Medium, Nunito_600SemiBold } from '@expo-google-fonts/nunito';
import { useNavigation } from '@react-navigation/native';
import axios from 'axios';
import LoginMenu from './LoginMenu';
import getIP from '../IPADDRESS';

export default function RegisterMenu ({navigation}) {

    
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
        const userData = {
            email,
            first_name,
            last_name,
            password,
            re_password
        };

        try {
            // const response = await axios.post(getIP+':8000/auth/users/', userData, 
            //     {
            //         headers: {
            //             'Content-Type': 'application/json'
            //         }
            //     });

            const response = await axios.post('http://192.168.1.129:8000/auth/users/', userData);
            
            console.log(response.data); // Verifică ce răspuns ai
            Alert.alert(response.data);

            if (response.status === 201) {
                // const activationData = {
                //     uid: response.data.uid, // Assuming the response contains the uid
                //     token: response.data.token // Assuming the response contains the token
                // };

                // await axios.post('http://192.168.1.131:8000/auth/users/activation/', activationData, {
                //     headers: {
                //         'Content-Type': 'application/json'
                //     }
                // });

                // Alert.alert('Success', 'Account activated successfully!');
                navigation.replace('LoginMenu');
            }
        } catch (error) {
            console.error(error);
            Alert.alert(error);
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


