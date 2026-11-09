import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

export const revokeRefreshToken = async (apiBaseUrl) => {
    const refreshToken = await AsyncStorage.getItem('refresh_token');
    if (!refreshToken) {
        return;
    }

    await axios.post(`${apiBaseUrl}/api/accounts/logout/`, {
        refresh: refreshToken,
    });
};
