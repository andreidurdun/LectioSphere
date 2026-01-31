import React, { useEffect, useState, useRef } from 'react';
import { View, Text, TextInput, StyleSheet, TouchableOpacity, SafeAreaView, ScrollView, Alert, KeyboardAvoidingView, Platform, findNodeHandle } from 'react-native';
import TopBar from './Partials/TopBar';
import NavBar from './Partials/NavBar';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import { useFonts, Nunito_400Regular, Nunito_500Medium, Nunito_600SemiBold } from '@expo-google-fonts/nunito';
import { refreshAccessToken } from './refreshAccessToken';

const MODEL_SCHEMAS = {
    book_review: ['rating', 'themes', 'favorite_quote', 'summary', 'characters'],
    reading_notes: ['notes', 'takeaways', 'questions', 'vocabulary'],
};

export default function SelectBookForSheetPage({ navigation, route, page, isAuthenticated, removeAuthToken, apiBaseUrl }) {
    const [loading, setLoading] = useState(false);
    const [userData, setUserData] = useState(null);
    const [fontsLoaded] = useFonts({ Nunito_400Regular, Nunito_500Medium, Nunito_600SemiBold });
    const [bookId, setBookId] = useState('');
    const [bookTitle, setBookTitle] = useState('');
    const [bookAuthor, setBookAuthor] = useState('');
    const [selectedBookObj, setSelectedBookObj] = useState(null);
    const [text, setText] = useState('');
    const [data, setData] = useState({});
    const [inputHeights, setInputHeights] = useState({});
    const [preferredModel, setPreferredModel] = useState('book_review');
    const scrollViewRef = useRef(null);
    const [fieldPositions, setFieldPositions] = useState({});

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

    useEffect(() => {
        // load preferred model from AsyncStorage (if set elsewhere)
        const loadPref = async () => {
            try {
                const stored = await AsyncStorage.getItem('preferred_model');
                if (stored) {
                    // accept backend keys or frontend keys; default to book_review
                    const allowed = ['basic', 'book_review', 'reading_notes', 'reading_reflections'];
                    const value = allowed.includes(stored) ? stored : 'book_review';
                    setPreferredModel(value);
                } else {
                    setPreferredModel('book_review');
                }
            } catch (e) {
                setPreferredModel('book_review');
            }
        };
        loadPref();

        // initialize data keys for preferredModel
        const keys = MODEL_SCHEMAS[preferredModel] || [];
        const initial = {};
        keys.forEach(k => { initial[k] = data[k] ?? ''; });
        setData(prev => ({ ...initial, ...prev }));
    }, [preferredModel]);

    useEffect(() => {
        const selected = route?.params?.selectedBook;
        if (selected) {
            setBookId(String(selected.id));
            setBookTitle(selected.title || '');
            const authorVal = selected.author ?? (selected.authors ? (Array.isArray(selected.authors) ? selected.authors.join(', ') : selected.authors) : '');
            setBookAuthor(authorVal);
            // Some Google volumes have no ISBN in industryIdentifiers — fall back to volume id
            const isbnFallback = selected.isbn ?? selected.ISBN ?? selected.id ?? null;
            setSelectedBookObj({ ...selected, isbn: isbnFallback });
        }
    }, [route?.params?.selectedBook]);

    const handleSubmit = async () => {
        if (data.rating != null && String(data.rating).trim() !== '') {
            const num = Number(String(data.rating).trim());
            if (Number.isNaN(num) || num < 0 || num > 10) {
                Alert.alert('Validation', 'Rating must be a number between 0 and 10');
                return;
            }
        }

        const urlMap = {
            basic: 'basic',
            book_review: 'book-review',
            reading_notes: 'reading-notes',
            reading_reflections: 'reading-reflections',
        };

        const urlPath = urlMap[preferredModel] || 'basic';

        // Send the book id (database ID is required, not ISBN)
        const bookVal = selectedBookObj?.id || bookId || null;
        
        // Fill empty fields with "-" to satisfy backend validation
        const requiredFields = MODEL_SCHEMAS[preferredModel] || [];
        const filledData = { ...data };
        requiredFields.forEach(field => {
            if (!filledData[field] || String(filledData[field]).trim() === '') {
                filledData[field] = '-';
            }
        });

        const payload = {
            book: bookVal,
            shelf: data.shelf ?? null,
            text: preferredModel === 'basic' ? (data.text ?? text ?? '') : null,
            data: preferredModel === 'basic' ? {} : filledData,
        };

        try {
            const token = await AsyncStorage.getItem('auth_token');
            const response = await axios.post(`${apiBaseUrl}/reading-sheets/${urlPath}/`, payload, {
                headers: { Authorization: `JWT ${token}` }
            });

            Alert.alert('Success', 'Reading sheet created');
            navigation.navigate('LibraryPage');
        } catch (err) {
            if (err.response?.status === 401) {
                const newToken = await refreshAccessToken(apiBaseUrl);
                if (newToken) {
                    try {
                        const response = await axios.post(`${apiBaseUrl}/reading-sheets/${urlPath}/`, payload, {
                            headers: { Authorization: `JWT ${newToken}` }
                        });
                        Alert.alert('Success', 'Reading sheet created');
                        navigation.navigate('LibraryPage');
                        return;
                    } catch (e) {
                        console.error('Retry create failed', e.response?.data || e.message);
                    }
                } else {
                    Alert.alert('Session', 'Please login again.');
                    await removeAuthToken();
                    navigation.replace('LoginMenu');
                    return;
                }
            }

            Alert.alert('Error', err.response?.data?.error || 'Failed to create reading sheet');
            console.error('CreateReadingSheet error:', err.response?.data || err.message);
        }
    };

    const renderField = (key) => {
        const value = data[key] ?? '';
        const formatLabel = (k) => k.replace(/_/g, ' ').split(' ').map(w => w ? w.charAt(0).toUpperCase() + w.slice(1) : w).join(' ');
        const label = formatLabel(key);
        if (key === 'rating') {
            return (
                <View key={key} style={styles.fieldRow}>
                    <Text style={styles.fieldLabel}>{label}</Text>
                    <View style={styles.ratingRow}>
                            <TextInput
                                accessibilityLabel={`crs-input-rating`}
                            style={[styles.input, styles.ratingInput]}
                            value={String(value)}
                            onChangeText={(val) => {
                                const clean = String(val).replace(/[^0-9.]/g, '');
                                setData(prev => ({ ...prev, [key]: clean }));
                            }}
                            keyboardType={'numeric'}
                            maxLength={4}
                        />
                        <Text style={styles.ratingSuffix}>/ 10</Text>
                    </View>
                </View>
            );
        }

        const isNumeric = false;
        const multiline = true;
        const heightStyle = { height: Math.max(40, inputHeights[key] || 80) };
        return (
            <View 
                key={key} 
                style={styles.fieldRow}
                onLayout={(e) => {
                    const layout = e.nativeEvent.layout;
                    setFieldPositions(prev => ({ ...prev, [key]: layout.y }));
                }}
            >
                <Text style={styles.fieldLabel}>{label}</Text>
                <TextInput
                    accessibilityLabel={`crs-input-${key}`}
                    style={[styles.input, heightStyle]}
                    value={String(value)}
                    onChangeText={(val) => setData(prev => ({ ...prev, [key]: val }))}
                    keyboardType={'default'}
                    multiline={multiline}
                    onContentSizeChange={(e) => {
                        const h = e?.nativeEvent?.contentSize?.height;
                        if (!h) return;
                        setInputHeights(prev => ({ ...prev, [key]: Math.max(40, Math.min(h, 600)) }));
                    }}
                    onFocus={() => {
                        const posY = fieldPositions[key];
                        if (posY !== undefined && scrollViewRef.current) {
                            setTimeout(() => {
                                scrollViewRef.current?.scrollTo({ 
                                    y: posY - 20, 
                                    animated: true 
                                });
                            }, 150);
                        }
                    }}
                />
            </View>
        );
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

    const fetchData = async () => {
        setLoading(true);
        await fetchUserData();
        setLoading(false);
    };
    
    useEffect(() => {
        if (isAuthenticated) {
            fetchData();
        }
    }, [isAuthenticated]);

    if (!fontsLoaded) return <Text>Loading fonts...</Text>;

    return (
        <SafeAreaView style={styles.screen}>
            <TopBar pageName="LibraryPage" />

            <KeyboardAvoidingView 
                behavior={Platform.OS === "ios" ? "padding" : "height"}
                style={{ flex: 1, width: '100%' }}
            >

            <ScrollView showsVerticalScrollIndicator={false} ref={scrollViewRef} keyboardShouldPersistTaps="handled">
            
                <View style={styles.header}>
                    <View style={styles.container}>
                        <Text style={styles.title}>Create Reading Sheet</Text>
                        <View style={styles.HorizontalBar} />
                    
                        <View style={styles.bookInfoView}>
                            <Text style={styles.fieldLabel}>Book: </Text>
                            <Text style={styles.bookInfo}>
                                {bookTitle}
                            </Text>
                        </View>
                        <View style={styles.bookInfoView}>
                            <Text style={styles.fieldLabel}>Author: </Text>
                            <Text style={styles.bookInfo}>
                                {bookAuthor}
                            </Text>
                        </View>    
                        
                        {(MODEL_SCHEMAS[preferredModel] || []).map(renderField)}
                    
                        <TouchableOpacity testID="crs-save" accessibilityLabel="crs-save" style={styles.submitButton} onPress={handleSubmit}>
                            <Text style={styles.submitText}>Save</Text>
                        </TouchableOpacity>
                    </View>
                </View>

            </ScrollView>

            </KeyboardAvoidingView>
            <NavBar navigation={navigation} page="LibraryPage" />
        </SafeAreaView>
    );
}

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
        minWidth: '95%',
        width: '95%',
        backgroundColor: '#F7EDF1',
        borderColor: '#F3E3E9',
        borderWidth: 1,
        borderRadius: 8,
        paddingVertical: 10,
        paddingHorizontal: 16,
        marginTop: 16,
        alignItems: 'flex-start',
    },
    title: {
        fontFamily: 'Nunito_600SemiBold',
        fontSize: 22,
        color: '#18101D',
        marginTop: 16,
        marginBottom: 12,
        alignSelf: 'center',
    },
    selectorRow: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'center',
        marginBottom: 12,
    },
    typeButton: {
        paddingHorizontal: 10,
        paddingVertical: 8,
        borderRadius: 8,
        borderWidth: 1,
        borderColor: '#E5C3D1',
        backgroundColor: '#F7EDF1',
        margin: 4,
    },
    typeButtonActive: {
        backgroundColor: '#613F75',
    },
    typeText: {
        fontFamily: 'Nunito_500Medium',
        color: '#18101D',
    },
    fieldRow: {
        width: '100%',
        marginTop: 8,
        justifyContent: 'flex-start',
        maxWidth: '100%',
    },
    bookInfoView: {
        width: '100%',
        marginTop: 8,
        flexDirection: 'row',
        justifyContent: 'flex-start',
        alignItems: 'baseline',
        maxWidth: '100%',
    },
    bookInfo: {
        fontSize: 14,
        fontFamily: 'Nunito_500Medium', 
        color: '#18101D',
        flexWrap: 'wrap',
        flex: 1,
        flexShrink: 1,

    },
    fieldLabel: {
        fontFamily: 'Nunito_600SemiBold',
        fontSize: 16,
        color: '#613F75',
        marginBottom: 6,
    },
    input: {
        width: '100%',
        padding: 12,
        borderColor: '#D8C2D5',
        borderWidth: 1,
        borderRadius: 8,
        fontSize: 14,
        fontFamily: 'Nunito_400Regular',
        backgroundColor: '#F7EDF1',
        color: '#18101D',
        textAlignVertical: 'top',
    },
    submitButton: {
        marginTop: 20,
        paddingVertical: 12,
        paddingHorizontal: 32,
        backgroundColor: '#613F75',
        borderRadius: 8,
        alignSelf: 'center',
    },
    submitText: {
        fontFamily: 'Nunito_600SemiBold',
        color: '#FFFFFF',
        fontSize: 16,
    },
    HorizontalBar: {
        height: 2,
        width: '90%',
        alignItems: 'center',
        backgroundColor: '#E5C3D1',
        alignSelf: 'center',
        marginBottom: 4,
    },
    ratingRow: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    ratingInput: {
        width: 72,
        paddingVertical: 8,
        paddingHorizontal: 10,
        marginRight: 8,
        textAlign: 'center',
    },
    ratingSuffix: {
        fontFamily: 'Nunito_500Medium',
        fontSize: 16,
        color: '#18101D',
    },
});