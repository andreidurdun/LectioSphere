import React, { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Alert, SafeAreaView, TouchableNativeFeedback, ScrollView } from 'react-native';
import NavBar from './Partials/NavBar';
import TopBar from './Partials/TopBar';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import { useFonts, Nunito_400Regular, Nunito_500Medium, Nunito_600SemiBold } from '@expo-google-fonts/nunito';
import { refreshAccessToken } from './refreshAccessToken'; 

const SearchPage = ({ navigation, removeAuthToken, isAuthenticated, apiBaseUrl }) => {
    const [userData, setUserData] = useState(null);
    const [recentlyPublishedItems, setRecentlyPublishedItems] = useState([]);
    const [popularItems, setPopularItems] = useState([]);

    //Fiction
    const [adventure, setAdventure] = useState([]);
    const [fantasy, setFantasy] = useState([]);
    const [romance, setRomance] = useState([]);
    const [thriller, setThriller] = useState([]);
    const [scienceFiction, setScienceFiction] = useState([]);

    //Non-Fiction
    const [biography, setBiography] = useState([]);
    const [history, setHistory] = useState([]);
    const [psychology, setPsychology] = useState([]);

    //Professional & Technical
    const [business, setBusiness] = useState([]);
    const [economics, setEconomics] = useState([]);
    const [technology, setTechnology] = useState([]);
    
    //Lifestyle
    const [health, setHealth] = useState([]);
    const [nutrition, setNutrition] = useState([]);
    const [travel, setTravel] = useState([]);


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

    const fetchCategory = async (categoryName, setCategoryState) => {
        try {
            let token = await AsyncStorage.getItem('auth_token');
            const response = await axios.get(`${apiBaseUrl}/api/books/category/?name=${categoryName}`, {
                headers: { Authorization: `JWT ${token}` }
            });
            setCategoryState(response.data.slice(0, 20));
        } catch (error) {
            if (error.response?.status === 401) {
                const newToken = await refreshAccessToken(apiBaseUrl);
                if (newToken) {
                    const retryResponse = await axios.get(`${apiBaseUrl}/api/books/category/?name=${categoryName}`, {
                        headers: { Authorization: `JWT ${newToken}` }
                    });
                    setCategoryState(retryResponse.data);
                } else {
                    console.error(`Unable to refresh token for ${categoryName}.`);
                }
            } else {
                console.error(`Error loading ${categoryName}:`, error.message);
            }
        }
    };

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
            fetchCategory('recent', setRecentlyPublishedItems);
            fetchCategory('popular', setPopularItems);
            fetchCategory('adventure', setAdventure);
            fetchCategory('fantasy', setFantasy);
            fetchCategory('romance', setRomance);
            fetchCategory('thriller', setThriller);
            fetchCategory('sci-fi', setScienceFiction);
            fetchCategory('biography', setBiography);
            fetchCategory('history', setHistory);
            fetchCategory('psychology', setPsychology);
            fetchCategory('health', setHealth);
            fetchCategory('nutrition', setNutrition);
            fetchCategory('travel', setTravel);
        }
    }, [isAuthenticated]);

    if (!fontsLoaded) {
        return <Text>Loading fonts...</Text>;
    }

    

    return (
        <SafeAreaView style={styles.screen}>
            <TopBar pageName="SearchPage" />

            <View style={styles.header}>
                <TouchableNativeFeedback onPress={() => console.log("Apasat")}>
                    <View style={styles.container}>
                        <Text style={styles.textContainer}> Recently Published </Text>
                        <ScrollView contentContainerStyle={{ flexDirection: 'row', flexWrap: 'wrap' }}>
                            {recentlyPublishedItems.map((book, index) => (
                            <Image
                                key={index}
                                source={{ uri: book.image }}
                                style={styles.covers}
                            />
                            ))}
                        </ScrollView>
                    </View>
                </TouchableNativeFeedback> 

                <TouchableNativeFeedback onPress={() => console.log("Apasat")}>
                    <View style={styles.container}>
                        <Text style={styles.textContainer}> Popular Now </Text>
                        <ScrollView contentContainerStyle={{ flexDirection: 'row', flexWrap: 'wrap' }}>
                            {popularItems.map((book, index) => (
                            <Image
                                key={index}
                                source={{ uri: book.image }}
                                style={styles.covers}
                            />
                            ))}
                        </ScrollView>
                    </View>
                </TouchableNativeFeedback> 


                {/* Fiction */}

                <View style={styles.categoryContainer}>
                    <Text style={styles.textCategory}> Fiction </Text>
                    <View style={styles.horizontalBar} />
                </View>

                <TouchableNativeFeedback onPress={() => console.log("Apasat")}>
                    <View style={styles.container}>
                        <Text style={styles.textContainer}> Adventure </Text>
                        <ScrollView contentContainerStyle={{ flexDirection: 'row', flexWrap: 'wrap' }}>
                            {adventure.map((book, index) => (
                            <Image
                                key={index}
                                source={{ uri: book.image }}
                                style={styles.covers}
                            />
                            ))}
                        </ScrollView>
                    </View>
                </TouchableNativeFeedback> 

                <TouchableNativeFeedback onPress={() => console.log("Apasat")}>
                    <View style={styles.container}>
                        <Text style={styles.textContainer}> Fantasy </Text>
                        <ScrollView contentContainerStyle={{ flexDirection: 'row', flexWrap: 'wrap' }}>
                            {fantasy.map((book, index) => (
                            <Image
                                key={index}
                                source={{ uri: book.image }}
                                style={styles.covers}
                            />
                            ))}
                        </ScrollView>
                    </View>
                </TouchableNativeFeedback> 

                <TouchableNativeFeedback onPress={() => console.log("Apasat")}>
                    <View style={styles.container}>
                        <Text style={styles.textContainer}> Romance </Text>
                        <ScrollView contentContainerStyle={{ flexDirection: 'row', flexWrap: 'wrap' }}>
                            {romance.map((book, index) => (
                            <Image
                                key={index}
                                source={{ uri: book.image }}
                                style={styles.covers}
                            />
                            ))}
                        </ScrollView>
                    </View>
                </TouchableNativeFeedback> 

                <TouchableNativeFeedback onPress={() => console.log("Apasat")}>
                    <View style={styles.container}>
                        <Text style={styles.textContainer}> Science Fiction </Text>
                        <ScrollView contentContainerStyle={{ flexDirection: 'row', flexWrap: 'wrap' }}>
                            {scienceFiction.map((book, index) => (
                            <Image
                                key={index}
                                source={{ uri: book.image }}
                                style={styles.covers}
                            />
                            ))}
                        </ScrollView>
                    </View>
                </TouchableNativeFeedback> 

                <TouchableNativeFeedback onPress={() => console.log("Apasat")}>
                    <View style={styles.container}>
                        <Text style={styles.textContainer}> Thriller </Text>
                        <ScrollView contentContainerStyle={{ flexDirection: 'row', flexWrap: 'wrap' }}>
                            {thriller.map((book, index) => (
                            <Image
                                key={index}
                                source={{ uri: book.image }}
                                style={styles.covers}
                            />
                            ))}
                        </ScrollView>
                    </View>
                </TouchableNativeFeedback> 
                

                {/* Non-Fiction */}

                <View style={styles.categoryContainer}>
                    <Text style={styles.textCategory}> Non-Fiction </Text>
                    <View style={styles.horizontalBar} />
                </View>

                <TouchableNativeFeedback onPress={() => console.log("Apasat")}>
                    <View style={styles.container}>
                        <Text style={styles.textContainer}> Biography </Text>
                        <ScrollView contentContainerStyle={{ flexDirection: 'row', flexWrap: 'wrap' }}>
                            {biography.map((book, index) => (
                            <Image
                                key={index}
                                source={{ uri: book.image }}
                                style={styles.covers}
                            />
                            ))}
                        </ScrollView>
                    </View>
                </TouchableNativeFeedback> 

                <TouchableNativeFeedback onPress={() => console.log("Apasat")}>
                    <View style={styles.container}>
                        <Text style={styles.textContainer}> History </Text>
                        <ScrollView contentContainerStyle={{ flexDirection: 'row', flexWrap: 'wrap' }}>
                            {history.map((book, index) => (
                            <Image
                                key={index}
                                source={{ uri: book.image }}
                                style={styles.covers}
                            />
                            ))}
                        </ScrollView>
                    </View>
                </TouchableNativeFeedback> 

                <TouchableNativeFeedback onPress={() => console.log("Apasat")}>
                    <View style={styles.container}>
                        <Text style={styles.textContainer}> Psychology </Text>
                        <ScrollView contentContainerStyle={{ flexDirection: 'row', flexWrap: 'wrap' }}>
                            {psychology.map((book, index) => (
                            <Image
                                key={index}
                                source={{ uri: book.image }}
                                style={styles.covers}
                            />
                            ))}
                        </ScrollView>
                    </View>
                </TouchableNativeFeedback> 

                
                {/* Professional & Technical */}

                <View style={styles.categoryContainer}>
                    <Text style={styles.textCategory}> Professional & Technical </Text>
                    <View style={styles.horizontalBar} />
                </View>

                <TouchableNativeFeedback onPress={() => console.log("Apasat")}>
                    <View style={styles.container}>
                        <Text style={styles.textContainer}> Business </Text>
                        <ScrollView contentContainerStyle={{ flexDirection: 'row', flexWrap: 'wrap' }}>
                            {business.map((book, index) => (
                            <Image
                                key={index}
                                source={{ uri: book.image }}
                                style={styles.covers}
                            />
                            ))}
                        </ScrollView>
                    </View>
                </TouchableNativeFeedback> 

                <TouchableNativeFeedback onPress={() => console.log("Apasat")}>
                    <View style={styles.container}>
                        <Text style={styles.textContainer}> Economics </Text>
                        <ScrollView contentContainerStyle={{ flexDirection: 'row', flexWrap: 'wrap' }}>
                            {economics.map((book, index) => (
                            <Image
                                key={index}
                                source={{ uri: book.image }}
                                style={styles.covers}
                            />
                            ))}
                        </ScrollView>
                    </View>
                </TouchableNativeFeedback> 

                <TouchableNativeFeedback onPress={() => console.log("Apasat")}>
                    <View style={styles.container}>
                        <Text style={styles.textContainer}> Technology </Text>
                        <ScrollView contentContainerStyle={{ flexDirection: 'row', flexWrap: 'wrap' }}>
                            {technology.map((book, index) => (
                            <Image
                                key={index}
                                source={{ uri: book.image }}
                                style={styles.covers}
                            />
                            ))}
                        </ScrollView>
                    </View>
                </TouchableNativeFeedback> 


                {/* Lifestyle */}

                <View style={styles.categoryContainer}>
                    <Text style={styles.textCategory}> Lifestyle </Text>
                    <View style={styles.horizontalBar} />
                </View>

                <TouchableNativeFeedback onPress={() => console.log("Apasat")}>
                    <View style={styles.container}>
                        <Text style={styles.textContainer}> Health </Text>
                        <ScrollView contentContainerStyle={{ flexDirection: 'row', flexWrap: 'wrap' }}>
                            {health.map((book, index) => (
                            <Image
                                key={index}
                                source={{ uri: book.image }}
                                style={styles.covers}
                            />
                            ))}
                        </ScrollView>
                    </View>
                </TouchableNativeFeedback> 

                <TouchableNativeFeedback onPress={() => console.log("Apasat")}>
                    <View style={styles.container}>
                        <Text style={styles.textContainer}> Nutrition </Text>
                        <ScrollView contentContainerStyle={{ flexDirection: 'row', flexWrap: 'wrap' }}>
                            {nutrition.map((book, index) => (
                            <Image
                                key={index}
                                source={{ uri: book.image }}
                                style={styles.covers}
                            />
                            ))}
                        </ScrollView>
                    </View>
                </TouchableNativeFeedback> 

                <TouchableNativeFeedback onPress={() => console.log("Apasat")}>
                    <View style={styles.container}>
                        <Text style={styles.textContainer}> Travel </Text>
                        <ScrollView contentContainerStyle={{ flexDirection: 'row', flexWrap: 'wrap' }}>
                            {travel.map((book, index) => (
                            <Image
                                key={index}
                                source={{ uri: book.image }}
                                style={styles.covers}
                            />
                            ))}
                        </ScrollView>
                    </View>
                </TouchableNativeFeedback> 

            </View>

            <NavBar navigation={navigation} page="SearchPage" />
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
    header: {
        width: '100%',
        justifyContent: 'flex-start',
        alignItems: 'center',
        marginBottom: 20,
        marginTop: 84,
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
        color: '#18101D',
        fontFamily: 'Nunito_600SemiBold',
    },
    covers: {
        height: 148,
        width: 98,
        borderRadius: 4
    },
    categoryContainer: {
        backgroundColor: '#F7EDF1',
        alignItems: 'center',
        paddingVertical: 10,
        width: '95%',
        marginTop: 16,
    },
    textCategory: {
        fontFamily: 'Nunito_600SemiBold',
        fontSize: 20,
        color: '#18101D',
    },
    horizontalBar: {
        height: 2,
        width: 240,
        backgroundColor: '#613F75', 
        width: '100%',
        marginTop: 4, 
      },
});

export default SearchPage;