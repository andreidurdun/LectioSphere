import React, { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Alert, Image, SafeAreaView } from 'react-native';
import NavBar from './Partials/NavBar';
import TopBar from './Partials/TopBar';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import { useFonts, Nunito_400Regular, Nunito_500Medium, Nunito_600SemiBold } from '@expo-google-fonts/nunito';
import Postings from './Partials/Postings';

export default function ProfileEdit ({ navigation, removeAuthToken, apiBaseUrl }) {

    return (
        <View>
            <Text>SE VA COMPLETA AICI</Text>
        </View>
    );

}