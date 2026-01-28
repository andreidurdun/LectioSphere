import React, { useEffect, useState, useRef } from 'react';
import { View, Text, TextInput, StyleSheet, Alert, SafeAreaView, TouchableOpacity, TouchableNativeFeedback, ScrollView, Image, FlatList } from 'react-native';
import NavBar from './Partials/NavBar';
import TopBar from './Partials/TopBar';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import { useFonts, Nunito_400Regular, Nunito_500Medium, Nunito_600SemiBold } from '@expo-google-fonts/nunito';
import { refreshAccessToken } from './refreshAccessToken'; 

const SelectBookForSheetPage = ({ navigation, route, page, removeAuthToken, isAuthenticated, apiBaseUrl }) => {
    const [userData, setUserData] = useState(null);
    const [query, setQuery] = useState('');
    const [results, setResults] = useState([]);
    const [allUserBooks, setAllUserBooks] = useState([]);
    const debounceRef = useRef(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        return () => { if (debounceRef.current) clearTimeout(debounceRef.current); };
    }, []);

    const doSearch = (q) => {
        if (!q || q.trim().length === 0) {
            setResults(allUserBooks);
            return;
        }
        const searchTerm = q.toLowerCase();
        const filtered = allUserBooks.filter(book => {
            const title = (book.title || '').toLowerCase();
            const author = (book.author || '').toLowerCase();
            const isbn = (book.isbn || '').toLowerCase();
            return title.includes(searchTerm) || author.includes(searchTerm) || isbn.includes(searchTerm);
        });
        setResults(filtered);
    };

    const handleSearchTextChange = (text) => {
        setQuery(text);
        if (debounceRef.current) clearTimeout(debounceRef.current);
        debounceRef.current = setTimeout(() => doSearch(text), 300);
    };

    const handleSelect = (book) => {
        const returnTo = route?.params?.returnTo || 'CreateReadingSheetPage';
        navigation.navigate(returnTo, { selectedBook: book });
    };

    const renderItem = ({ item }) => {
        const authors = item.author || (item.authors && item.authors.join ? item.authors.join(', ') : item.authors) || '';
        const thumbnail = item.thumbnail || item.cover || null;

        return (
            <TouchableOpacity style={styles.itemRow} onPress={() => handleSelect(item)}>
                {thumbnail ? (
                    <Image source={{ uri: thumbnail }} style={styles.coverSmall} />
                ) : (
                    <View style={styles.coverPlaceholder} />
                )}
                <View style={styles.infoSmall}>
                    <Text style={styles.titleSmall} numberOfLines={1}>{item.title}</Text>
                    {authors ? <Text style={styles.authorSmall} numberOfLines={1}>{authors}</Text> : null}
                </View>
            </TouchableOpacity>
        );
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

    const fetchUserBooks = async () => {
        try {
            const token = await AsyncStorage.getItem('auth_token');
            // Fetch all shelves to get all books
            const shelvesResponse = await axios.get(`${apiBaseUrl}/library/shelves/`, {
                headers: { Authorization: `JWT ${token}` }
            });
            
            // Collect all books from custom shelves
            const allBooks = [];
            const customShelves = shelvesResponse.data?.custom_shelves || [];
            
            // Get books from custom shelves
            for (const shelf of customShelves) {
                if (shelf.books && Array.isArray(shelf.books)) {
                    allBooks.push(...shelf.books);
                }
            }
            
            // Remove duplicates based on book id
            const uniqueBooks = allBooks.filter((book, index, self) => 
                index === self.findIndex(b => b.id === book.id)
            );
            
            setAllUserBooks(uniqueBooks);
            setResults(uniqueBooks);
        } catch (error) {
            if (error.response?.status === 401) {
                const newToken = await refreshAccessToken(apiBaseUrl);
                if (newToken) {
                    try {
                        const shelvesResponse = await axios.get(`${apiBaseUrl}/library/shelves/`, {
                            headers: { Authorization: `JWT ${newToken}` }
                        });
                        
                        const allBooks = [];
                        const customShelves = shelvesResponse.data?.custom_shelves || [];
                        
                        for (const shelf of customShelves) {
                            if (shelf.books && Array.isArray(shelf.books)) {
                                allBooks.push(...shelf.books);
                            }
                        }
                        
                        const uniqueBooks = allBooks.filter((book, index, self) => 
                            index === self.findIndex(b => b.id === book.id)
                        );
                        
                        setAllUserBooks(uniqueBooks);
                        setResults(uniqueBooks);
                    } catch (e) {
                        console.error('Error fetching user books after retry:', e.message);
                    }
                } else {
                    await removeAuthToken();
                    navigation.replace('LoginMenu');
                }
            } else {
                console.error('Error fetching user books:', error.message);
            }
        }
    };

    const fetchData = async () => {
        setLoading(true);
        await fetchUserData();
        await fetchUserBooks();
        setLoading(false);
    };

    useEffect(() => {
        if (isAuthenticated) {
            fetchData();
        }
    }, [isAuthenticated]);

    if (!fontsLoaded) {
        return <Text>Loading fonts...</Text>;
    }

    return (
        <SafeAreaView style={styles.screen}>
            <TopBar pageName="LibraryPage" />

            <View style={styles.container}>
                <Text style={styles.prompt}>Which book is this reading sheet for?</Text>
                <TextInput
                    style={styles.search}
                    placeholder="Search by title, author or ISBN"
                    placeholderTextColor="#A79CA8"
                    value={query}
                    onChangeText={handleSearchTextChange}
                    autoCorrect={false}
                    autoCapitalize="none"
                />
            
                <FlatList
                    data={results}
                    keyboardShouldPersistTaps="handled"
                    keyExtractor={(item) => String(item.id)}
                    renderItem={renderItem}
                    style={{ width: '90%', marginBottom: 50, marginTop: 16 }}
                    // contentContainerStyle={{ paddingBottom: 140 }}
                    ListEmptyComponent={query.length >=2 && !loading ? <Text style={{ marginTop: 12 }}>No results</Text> : null}
                />
            </View>

            <NavBar navigation={navigation} page="LibraryPage" />
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
        width: '95%', 
        paddingTop: 16, 
        marginTop: 100, 
        marginBottom: 100,
        alignItems: 'center',
    },
    prompt: { fontFamily: 'Nunito_600SemiBold', fontSize: 18, color: '#18101D', marginBottom: 8 },
    search: { 
        backgroundColor: '#F7EDF1', 
        padding: 12, 
        borderRadius: 8, 
        fontFamily: 'Nunito_400Regular', 
        borderColor: '#D8C2D5', 
        borderWidth: 1,
        width: '90%',
    },
    item: { paddingVertical: 12, borderBottomColor: '#E5C3D1', borderBottomWidth: 1 },
    itemRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 8, borderBottomColor: '#EDE0E9', borderBottomWidth: 1 },
    coverSmall: { width: 44, height: 64, borderRadius: 4, marginRight: 10 },
    coverPlaceholder: { width: 44, height: 64, borderRadius: 4, marginRight: 10, backgroundColor: '#F0E7EB' },
    infoSmall: { flex: 1, justifyContent: 'center' },
    titleSmall: { fontFamily: 'Nunito_500Medium', fontSize: 14, color: '#18101D' },
    authorSmall: { fontFamily: 'Nunito_400Regular', fontSize: 12, color: '#613F75', marginTop: 2 },
    title: { fontFamily: 'Nunito_500Medium', fontSize: 16, color: '#18101D' },
    author: { fontFamily: 'Nunito_400Regular', fontSize: 14, color: '#613F75' },
});

export default SelectBookForSheetPage;