import React, { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Alert, SafeAreaView, TouchableNativeFeedback, ScrollView, Image } from 'react-native';
import NavBar from './Partials/NavBar';
import TopBar from './Partials/TopBar';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import { useFonts, Nunito_400Regular, Nunito_500Medium, Nunito_600SemiBold } from '@expo-google-fonts/nunito';
import { refreshAccessToken } from './refreshAccessToken'; 

//TO DOOO: Pus link-uri catre pagina unei carti, modificat toate imaginile in touchable 

const SearchPage = ({ navigation, page, removeAuthToken, isAuthenticated, apiBaseUrl }) => {
    const [userData, setUserData] = useState(null);
    const [recentlyPublishedItems, setRecentlyPublishedItems] = useState([]);
    const [popularItems, setPopularItems] = useState([]);
    const [bookTitle, setBookTitle] = useState('');

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

    const [active, setActive] = useState(page);

    const handleCategoryClick = (page, params = {}) => {
        setActive(page);
        navigation.navigate(page, params); 
    };


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
            const response = await axios.get(`${apiBaseUrl}/books/category/?name=${categoryName}`, {
                headers: { Authorization: `JWT ${token}` }
            });
            // Filtrăm cărțile care au un `thumbnail` valid
            const booksWithThumbnail = response.data.filter(book => book.thumbnail);

            // Setăm primele 15 de cărți care au thumbnail
            setCategoryState(booksWithThumbnail.slice(0, 15));
        } catch (error) {
            if (error.response?.status === 401) {
                const newToken = await refreshAccessToken(apiBaseUrl);
                if (newToken) {
                    const retryResponse = await axios.get(`${apiBaseUrl}/books/category/?name=${categoryName}`, {
                        headers: { Authorization: `JWT ${newToken}` }
                    });
                    const booksWithThumbnail = retryResponse.data.filter(book => book.thumbnail);
                    setCategoryState(booksWithThumbnail.slice(0, 15));
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

    const handleBookPress = (book) => {
        navigation.navigate('BookShow', { 
            bookData: JSON.stringify(book)
        });
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
            fetchCategory('science fiction', setScienceFiction);
            fetchCategory('biography', setBiography);
            fetchCategory('history', setHistory);
            fetchCategory('psychology', setPsychology);
            fetchCategory('business', setBusiness);
            fetchCategory('economics', setEconomics);
            fetchCategory('technology', setTechnology);
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

            <ScrollView contentContainerStyle={{ paddingBottom: 46 }}>

                <View style={styles.header}>
                    <View style={styles.container}>
                        <TouchableNativeFeedback onPress={() => handleCategoryClick('CategoryBooksPage', { category: 'Recently Published' })}>
                            <View testID="search-category-recent" accessibilityLabel="search-category-recent">
                                <Text style={styles.textContainer}> Recently Published </Text>
                            </View>
                        </TouchableNativeFeedback>
                        <ScrollView horizontal showsHorizontalScrollIndicator={false} style = {styles.containerImages}>
                            {recentlyPublishedItems.map((book, index) => (
                                <TouchableNativeFeedback key={index} onPress={() => handleBookPress(book)}>
                                    <View testID={`search-recent-book-${index}`}>
                                        <Image
                                            source={{ uri: book.thumbnail }}
                                            style={styles.covers}
                                            testID={`search-recent-book-image-${index}`}
                                        />
                                    </View>
                                </TouchableNativeFeedback>
                            ))}
                        </ScrollView>
                    </View>
    
                    <View style={styles.container}>
                        <TouchableNativeFeedback onPress={() => handleCategoryClick('CategoryBooksPage', { category: 'Popular Now'})}>
                            <View testID="search-category-popular" accessibilityLabel="search-category-popular">
                                <Text style={styles.textContainer}> Popular Now </Text>
                            </View>
                        </TouchableNativeFeedback>
                        <ScrollView horizontal showsHorizontalScrollIndicator={false} style = {styles.containerImages}>
                            {popularItems.map((book, index) => (
                                <TouchableNativeFeedback key={index} onPress={() => handleBookPress(book)}>
                                    <View testID={`search-popular-book-${index}`}>
                                        <Image
                                            source={{ uri: book.thumbnail }}
                                            style={styles.covers}
                                            testID={`search-popular-book-image-${index}`}
                                        />
                                    </View>
                                </TouchableNativeFeedback>
                            ))}
                        </ScrollView>
                    </View>


                    {/* Fiction */}
                    
                    <View style={styles.categoryContainer}>
                        <Text style={styles.textCategory}> Fiction </Text>
                        <View style={styles.horizontalBar} />
                    </View>

                    {/* <View style={styles.container}>
                        <TouchableNativeFeedback onPress={() => handleCategoryClick('CategoryBooksPage', { category: 'Adventure'})}>
                            <View testID="search-category-adventure" accessibilityLabel="search-category-adventure">
                                <Text style={styles.textContainer}> Adventure </Text>
                            </View>
                        </TouchableNativeFeedback>
                        <ScrollView horizontal showsHorizontalScrollIndicator={false} style = {styles.containerImages}>
                            {adventure.map((book, index) => (
                                <TouchableNativeFeedback key={index} onPress={() => handleBookPress(book)}>
                                    <View testID={`search-adventure-book-${index}`}>
                                        <Image
                                            source={{ uri: book.thumbnail }}
                                            style={styles.covers}
                                            testID={`search-adventure-book-image-${index}`}
                                        />
                                    </View>
                                </TouchableNativeFeedback>
                            ))}
                        </ScrollView>
                    </View> */}

                    <View style={styles.container}>
                        <TouchableNativeFeedback onPress={() => handleCategoryClick('CategoryBooksPage', { category: 'Fantasy' })}>
                            <View testID="search-category-fantasy" accessibilityLabel="search-category-fantasy">
                                <Text style={styles.textContainer}> Fantasy </Text>
                            </View>
                        </TouchableNativeFeedback>
                        <ScrollView horizontal showsHorizontalScrollIndicator={false} style = {styles.containerImages}>
                            {fantasy.map((book, index) => (
                                <TouchableNativeFeedback key={index} onPress={() => handleBookPress(book)}>
                                    <View testID={`search-fantasy-book-${index}`}>
                                        <Image
                                            source={{ uri: book.thumbnail }}
                                            style={styles.covers}
                                            testID={`search-fantasy-book-image-${index}`}
                                        />
                                    </View>
                                </TouchableNativeFeedback>
                            ))}
                        </ScrollView>
                    </View>

                    <View style={styles.container}>
                        <TouchableNativeFeedback onPress={() => handleCategoryClick('CategoryBooksPage', { category: 'Romance' })}>
                            <View testID="search-category-romance" accessibilityLabel="search-category-romance">
                                <Text style={styles.textContainer}> Romance </Text>
                            </View>
                        </TouchableNativeFeedback>
                        <ScrollView horizontal showsHorizontalScrollIndicator={false} style = {styles.containerImages}>
                            {romance.map((book, index) => (
                                <TouchableNativeFeedback key={index} onPress={() => handleBookPress(book)}>
                                    <View testID={`search-romance-book-${index}`}>
                                        <Image
                                            source={{ uri: book.thumbnail }}
                                            style={styles.covers}
                                            testID={`search-romance-book-image-${index}`}
                                        />
                                    </View>
                                </TouchableNativeFeedback>
                            ))}
                        </ScrollView>
                    </View>

                    <View style={styles.container}>
                        <TouchableNativeFeedback onPress={() => handleCategoryClick('CategoryBooksPage', { category: 'Science Fiction' })}>
                            <View testID="search-category-sciencefiction" accessibilityLabel="search-category-sciencefiction">
                                <Text style={styles.textContainer}> Science Fiction </Text>
                            </View>
                        </TouchableNativeFeedback>
                        <ScrollView horizontal showsHorizontalScrollIndicator={false} style = {styles.containerImages}>
                            {scienceFiction.map((book, index) => (
                                <TouchableNativeFeedback key={index} onPress={() => handleBookPress(book)}>
                                    <View testID={`search-sciencefiction-book-${index}`}>
                                        <Image
                                            source={{ uri: book.thumbnail }}
                                            style={styles.covers}
                                            testID={`search-sciencefiction-book-image-${index}`}
                                        />
                                    </View>
                                </TouchableNativeFeedback>
                            ))}
                        </ScrollView>
                    </View>
{/* 
                    <View style={styles.container}>
                        <TouchableNativeFeedback onPress={() => handleCategoryClick('CategoryBooksPage', { category: 'Thriller' })}>
                            <View testID="search-category-thriller" accessibilityLabel="search-category-thriller">
                                <Text style={styles.textContainer}> Thriller </Text>
                            </View>
                        </TouchableNativeFeedback>
                        <ScrollView horizontal showsHorizontalScrollIndicator={false} style = {styles.containerImages}>
                            {thriller.map((book, index) => (
                                <TouchableNativeFeedback key={index} onPress={() => handleBookPress(book)}>
                                    <View testID={`search-thriller-book-${index}`}>
                                        <Image
                                            source={{ uri: book.thumbnail }}
                                            style={styles.covers}
                                            testID={`search-thriller-book-image-${index}`}
                                        />
                                    </View>
                                </TouchableNativeFeedback>
                            ))}
                        </ScrollView>
                    </View> */}
                   
                    

                    {/* Non-Fiction */}
                    
                    <View style={styles.categoryContainer}>
                        <Text style={styles.textCategory}> Non-Fiction </Text>
                        <View style={styles.horizontalBar} />
                    </View>
{/* 
                    <View style={styles.container}>
                        <TouchableNativeFeedback onPress={() => handleCategoryClick('CategoryBooksPage', { category: 'Biography' })}>
                            <View>
                                <Text style={styles.textContainer}> Biography </Text>
                            </View>
                        </TouchableNativeFeedback>
                        <ScrollView horizontal showsHorizontalScrollIndicator={false} style = {styles.containerImages}>
                            {biography.map((book, index) => (
                                <TouchableNativeFeedback key={index} onPress={() => handleBookPress(book)}>
                                    <View>
                                        <Image
                                            source={{ uri: book.thumbnail }}
                                            style={styles.covers}
                                        />
                                    </View>
                                </TouchableNativeFeedback>
                            ))}
                        </ScrollView>
                    </View>

                    <View style={styles.container}>
                        <TouchableNativeFeedback onPress={() => handleCategoryClick('CategoryBooksPage', { category: 'History' })}>
                            <View>
                                <Text style={styles.textContainer}> History </Text>
                            </View>
                        </TouchableNativeFeedback>
                        <ScrollView horizontal showsHorizontalScrollIndicator={false} style = {styles.containerImages}>
                            {history.map((book, index) => (
                                <TouchableNativeFeedback key={index} onPress={() => handleBookPress(book)}>
                                    <View>
                                        <Image
                                            source={{ uri: book.thumbnail }}
                                            style={styles.covers}
                                        />
                                    </View>
                                </TouchableNativeFeedback>
                            ))}
                        </ScrollView>
                    </View>

                    <View style={styles.container}>
                        <TouchableNativeFeedback onPress={() => handleCategoryClick('CategoryBooksPage', { category: 'Psychology' })}>
                            <View testID="search-category-psychology" accessibilityLabel="search-category-psychology">
                                <Text style={styles.textContainer}> Psychology </Text>
                            </View>
                        </TouchableNativeFeedback>
                        <ScrollView horizontal showsHorizontalScrollIndicator={false} style = {styles.containerImages}>
                            {psychology.map((book, index) => (
                                <TouchableNativeFeedback key={index} onPress={() => handleBookPress(book)}>
                                    <View testID={`search-psychology-book-${index}`}>
                                        <Image
                                            source={{ uri: book.thumbnail }}
                                            style={styles.covers}
                                            testID={`search-psychology-book-image-${index}`}
                                        />
                                    </View>
                                </TouchableNativeFeedback>
                            ))}
                        </ScrollView>
                    </View>
                    */}
                    
                    {/* Professional & Technology */}
                    
                    <View style={styles.categoryContainer}>
                        <Text style={styles.textCategory}> Professional & Technology </Text>
                        <View style={styles.horizontalBar} />
                    </View>
{/* 
                    <View style={styles.container}>
                        <TouchableNativeFeedback onPress={() => handleCategoryClick('CategoryBooksPage', { category: 'Business' })}>
                            <View testID="search-category-business" accessibilityLabel="search-category-business">
                                <Text style={styles.textContainer}> Business </Text>
                            </View>
                        </TouchableNativeFeedback>
                        <ScrollView horizontal showsHorizontalScrollIndicator={false} style = {styles.containerImages}>
                            {business.map((book, index) => (
                                <TouchableNativeFeedback key={index} onPress={() => handleBookPress(book)}>
                                    <View testID={`search-business-book-${index}`}>
                                        <Image
                                            source={{ uri: book.thumbnail }}
                                            style={styles.covers}
                                            testID={`search-business-book-image-${index}`}
                                        />
                                    </View>
                                </TouchableNativeFeedback>
                            ))}
                        </ScrollView>
                    </View>

                    <View style={styles.container}>
                        <TouchableNativeFeedback onPress={() => handleCategoryClick('CategoryBooksPage', { category: 'Economics' })}>
                            <View testID="search-category-economics" accessibilityLabel="search-category-economics">
                                <Text style={styles.textContainer}> Economics </Text>
                            </View>
                        </TouchableNativeFeedback>
                        <ScrollView horizontal showsHorizontalScrollIndicator={false} style = {styles.containerImages}>
                            {economics.map((book, index) => (
                                <TouchableNativeFeedback key={index} onPress={() => handleBookPress(book)}>
                                    <View testID={`search-economics-book-${index}`}>
                                        <Image
                                            source={{ uri: book.thumbnail }}
                                            style={styles.covers}
                                            testID={`search-economics-book-image-${index}`}
                                        />
                                    </View>
                                </TouchableNativeFeedback>
                            ))}
                        </ScrollView>
                    </View>

                    <View style={styles.container}>
                        <TouchableNativeFeedback onPress={() => handleCategoryClick('CategoryBooksPage', { category: 'Technology' })}>
                            <View testID="search-category-technology" accessibilityLabel="search-category-technology">
                                <Text style={styles.textContainer}> Technology </Text>
                            </View>
                        </TouchableNativeFeedback>
                        <ScrollView horizontal showsHorizontalScrollIndicator={false} style = {styles.containerImages}>
                            {technology.map((book, index) => (
                                <TouchableNativeFeedback key={index} onPress={() => handleBookPress(book)}>
                                    <View testID={`search-technology-book-${index}`}>
                                        <Image
                                            source={{ uri: book.thumbnail }}
                                            style={styles.covers}
                                            testID={`search-technology-book-image-${index}`}
                                        />
                                    </View>
                                </TouchableNativeFeedback>
                            ))}
                        </ScrollView>
                    </View>
                    */}

                    {/* Lifestyle */}
{/*                     
                    <View style={styles.categoryContainer}>
                        <Text style={styles.textCategory}> Lifestyle </Text>
                        <View style={styles.horizontalBar} />
                    </View>

                    <View style={styles.container}>
                        <TouchableNativeFeedback onPress={() => handleCategoryClick('CategoryBooksPage', { category: 'Health' })}>
                            <View testID="search-category-health" accessibilityLabel="search-category-health">
                                <Text style={styles.textContainer}> Health </Text>
                            </View>
                        </TouchableNativeFeedback>
                        <ScrollView horizontal showsHorizontalScrollIndicator={false} style = {styles.containerImages}>
                            {health.map((book, index) => (
                                <TouchableNativeFeedback key={index} onPress={() => handleBookPress(book)}>
                                    <View testID={`search-health-book-${index}`}>
                                        <Image
                                            source={{ uri: book.thumbnail }}
                                            style={styles.covers}
                                            testID={`search-health-book-image-${index}`}
                                        />
                                    </View>
                                </TouchableNativeFeedback>
                            ))}
                        </ScrollView>
                    </View>

                    <View style={styles.container}>
                        <TouchableNativeFeedback onPress={() => handleCategoryClick('CategoryBooksPage', { category: 'Nutrition' })}>
                            <View testID="search-category-nutrition" accessibilityLabel="search-category-nutrition">
                                <Text style={styles.textContainer}> Nutrition </Text>
                            </View>
                        </TouchableNativeFeedback>
                        <ScrollView horizontal showsHorizontalScrollIndicator={false} style = {styles.containerImages}>
                            {nutrition.map((book, index) => (
                                <TouchableNativeFeedback key={index} onPress={() => handleBookPress(book)}>
                                    <View testID={`search-nutrition-book-${index}`}>
                                        <Image
                                            source={{ uri: book.thumbnail }}
                                            style={styles.covers}
                                            testID={`search-nutrition-book-image-${index}`}
                                        />
                                    </View>
                                </TouchableNativeFeedback>
                            ))}
                        </ScrollView>
                    </View>

                    <View style={styles.container}>
                        <TouchableNativeFeedback onPress={() => handleCategoryClick('CategoryBooksPage', { category: 'Travel' })}>
                            <View testID="search-category-travel" accessibilityLabel="search-category-travel">
                                <Text style={styles.textContainer}> Travel </Text>
                            </View>
                        </TouchableNativeFeedback>
                        <ScrollView horizontal showsHorizontalScrollIndicator={false} style = {styles.containerImages}>
                            {travel.map((book, index) => (
                                <TouchableNativeFeedback key={index} onPress={() => handleBookPress(book)}>
                                    <View testID={`search-travel-book-${index}`}>
                                        <Image
                                            source={{ uri: book.thumbnail }}
                                            style={styles.covers}
                                            testID={`search-travel-book-image-${index}`}
                                        />
                                    </View>
                                </TouchableNativeFeedback>
                            ))}
                        </ScrollView>
                    </View>
                    */}

                </View>

            </ScrollView>

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
        marginBottom: 8,
        marginHorizontal: 2,
    },
    covers: {
        height: 148,
        width: 98,
        borderRadius: 4,
        marginRight: 12,
    },
    categoryContainer: {
        backgroundColor: '#FCF8FA',
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
        alignItems: 'center',
        backgroundColor: '#613F75', 
        marginTop: 4, 
      },
    containerImages: {
        marginHorizontal: 12,
    },
});

export default SearchPage;