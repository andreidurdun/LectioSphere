import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';

const refreshAccessToken = async (apiBaseUrl) => {
    try {
        const refreshToken = await AsyncStorage.getItem('refresh_token');

        if (!refreshToken) {
            console.log("No refresh token found.");
            return null;
        }

        const response = await axios.post(`${apiBaseUrl}/api/token/refresh/`, {
            refresh: refreshToken
        });

        const newAccessToken = response.data.access;

        if (newAccessToken) {
            await AsyncStorage.setItem('auth_token', newAccessToken);
            console.log("Access token refreshed.");
            return newAccessToken;
        }

        return null;
    } catch (error) {
        console.error("Failed to refresh access token:", error.response?.data || error.message);
        return null;
    }
};