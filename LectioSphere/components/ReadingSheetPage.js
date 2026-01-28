import React, { useEffect, useState, useCallback, useRef } from 'react';
import { View, Text, TextInput, StyleSheet, Alert, SafeAreaView, ScrollView, Image, TouchableOpacity, KeyboardAvoidingView, Platform } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import NavBar from './Partials/NavBar';
import TopBar from './Partials/TopBar';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import { useFonts, Nunito_400Regular, Nunito_500Medium, Nunito_600SemiBold } from '@expo-google-fonts/nunito';
import { refreshAccessToken } from './refreshAccessToken';

const ReadingSheetPage = ({ route, navigation, removeAuthToken, isAuthenticated, apiBaseUrl }) => {
    const { sheet: initialSheet } = route.params;
    const [sheet, setSheet] = useState(initialSheet);
    const [userData, setUserData] = useState(null);
    
    // Helper to convert "-" to empty string for display
    const cleanDataForDisplay = (data) => {
        if (!data) return {};
        const cleaned = {};
        Object.keys(data).forEach(key => {
            cleaned[key] = data[key] === '-' ? '' : data[key];
        });
        return cleaned;
    };
    
    const [editedData, setEditedData] = useState(cleanDataForDisplay(sheet.data || {}));
    const [editedText, setEditedText] = useState(sheet.text === '-' ? '' : (sheet.text || ''));
    const [inputHeights, setInputHeights] = useState({});
    const saveTimeoutRef = useRef(null);
    const scrollViewRef = useRef(null);
    const [fieldPositions, setFieldPositions] = useState({});

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

    const fetchSheetData = async () => {
        try {
            const token = await AsyncStorage.getItem('auth_token');
            const response = await axios.get(`${apiBaseUrl}/reading-sheets/`, {
                headers: { Authorization: `JWT ${token}` }
            });
            
            // Find the current sheet in the response
            const allSheets = Object.values(response.data).flat();
            const updatedSheet = allSheets.find(s => s.id === initialSheet.id);
            
            if (updatedSheet) {
                setSheet(updatedSheet);
                setEditedData(cleanDataForDisplay(updatedSheet.data || {}));
                setEditedText(updatedSheet.text === '-' ? '' : (updatedSheet.text || ''));
            }
        } catch (error) {
            if (error.response?.status === 401) {
                const newToken = await refreshAccessToken(apiBaseUrl);
                if (newToken) {
                    const retryResponse = await axios.get(`${apiBaseUrl}/reading-sheets/`, {
                        headers: { Authorization: `JWT ${newToken}` }
                    });
                    const allSheets = Object.values(retryResponse.data).flat();
                    const updatedSheet = allSheets.find(s => s.id === initialSheet.id);
                    
                    if (updatedSheet) {
                        setSheet(updatedSheet);
                        setEditedData(cleanDataForDisplay(updatedSheet.data || {}));
                        setEditedText(updatedSheet.text === '-' ? '' : (updatedSheet.text || ''));
                    }
                }
            } else {
                console.error("Error fetching sheet:", error.message);
            }
        }
    };

    useFocusEffect(
        useCallback(() => {
            if (isAuthenticated) {
                fetchUserData();
                fetchSheetData();
            }
            // Scroll to top when page opens
            if (scrollViewRef.current) {
                scrollViewRef.current.scrollTo({ y: 0, animated: false });
            }
        }, [isAuthenticated])
    );

    // Auto-save for basic model text with debouncing
    useEffect(() => {
        if (sheet.model_type === 'basic' && editedText !== sheet.text) {
            if (saveTimeoutRef.current) {
                clearTimeout(saveTimeoutRef.current);
            }
            saveTimeoutRef.current = setTimeout(() => {
                saveField('text', editedText);
            }, 1500);
        }
        return () => {
            if (saveTimeoutRef.current) {
                clearTimeout(saveTimeoutRef.current);
            }
        };
    }, [editedText]);

    // Auto-save for other models' data with debouncing
    useEffect(() => {
        if (sheet.model_type !== 'basic') {
            if (saveTimeoutRef.current) {
                clearTimeout(saveTimeoutRef.current);
            }
            saveTimeoutRef.current = setTimeout(() => {
                saveField('data', editedData);
            }, 1500);
        }
        return () => {
            if (saveTimeoutRef.current) {
                clearTimeout(saveTimeoutRef.current);
            }
        };
    }, [editedData]);

    const saveField = async (fieldName, value) => {
        try {
            const token = await AsyncStorage.getItem('auth_token');
            
            let payload;
            if (sheet.model_type === 'basic') {
                payload = {
                    text: editedText || '-'
                };
            } else {
                // Fill empty fields with "-" for consistency with creation
                const filledData = {};
                Object.keys(editedData).forEach(key => {
                    const val = editedData[key];
                    filledData[key] = (val && String(val).trim() !== '') ? val : '-';
                });
                payload = {
                    data: filledData
                };
            }
            
            const response = await axios.patch(`${apiBaseUrl}/reading-sheets/${sheet.id}/update/`, payload, {
                headers: { 
                    Authorization: `JWT ${token}`,
                    'Content-Type': 'application/json'
                }
            });
            
        } catch (error) {
            console.error('Full error:', error);
            console.error('Error response:', error.response?.data);
            console.error('Error status:', error.response?.status);
            
            if (error.response?.status === 401) {
                const newToken = await refreshAccessToken(apiBaseUrl);
                if (newToken) {
                    try {
                        let payload;
                        if (sheet.model_type === 'basic') {
                            payload = {
                                text: editedText || '-'
                            };
                        } else {
                            // Fill empty fields with "-" for consistency with creation
                            const filledData = {};
                            Object.keys(editedData).forEach(key => {
                                const val = editedData[key];
                                filledData[key] = (val && String(val).trim() !== '') ? val : '-';
                            });
                            payload = {
                                data: filledData
                            };
                        }
                        
                        const response = await axios.patch(`${apiBaseUrl}/reading-sheets/${sheet.id}/update/`, payload, {
                            headers: { 
                                Authorization: `JWT ${newToken}`,
                                'Content-Type': 'application/json'
                            }
                        });
                        
                    } catch (e) {
                        console.error('Error saving field after retry:', e.response?.data || e.message);
                        Alert.alert('Error', 'Failed to save changes');
                    }
                }
            } else {
                console.error('Error saving field:', error.response?.data || error.message);
                Alert.alert('Error', `Failed to save: ${error.response?.data?.error || error.message}`);
            }
        }
    };

    if (!fontsLoaded) {
        return <Text>Loading fonts...</Text>;
    }

    const renderModelContent = () => {
        switch (sheet.model_type) {
            case 'basic':
                return (
                    <View 
                        style={styles.fieldRow}
                        onLayout={(e) => {
                            const layout = e.nativeEvent.layout;
                            setFieldPositions(prev => ({ ...prev, text: layout.y }));
                        }}
                    >
                        <Text style={styles.fieldLabel}>Notes</Text>
                        <TextInput
                            style={[styles.input, { height: Math.max(40, inputHeights['text'] || 40) }]}
                            value={editedText}
                            onChangeText={(val) => setEditedText(val)}
                            multiline
                            onContentSizeChange={(e) => {
                                const h = e?.nativeEvent?.contentSize?.height;
                                if (h) {
                                    setInputHeights(prev => ({ ...prev, text: Math.min(Math.max(40, h), 600) }));
                                }
                            }}
                            onFocus={() => {
                                const posY = fieldPositions['text'];
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

            case 'book_review':
                return (
                    <>
                        <View 
                            style={styles.fieldRow}
                            onLayout={(e) => {
                                const layout = e.nativeEvent.layout;
                                setFieldPositions(prev => ({ ...prev, rating: layout.y }));
                            }}
                        >
                            <Text style={styles.fieldLabel}>Rating</Text>
                            <View style={styles.ratingRow}>
                                <TextInput
                                    style={[styles.input, styles.ratingInput]}
                                    value={String(editedData.rating || '')}
                                    onChangeText={(val) => {
                                        const clean = val.replace(/[^0-9.]/g, '');
                                        setEditedData(prev => ({ ...prev, rating: clean }));
                                    }}
                                    onFocus={() => {
                                        const posY = fieldPositions['rating'];
                                        if (posY !== undefined && scrollViewRef.current) {
                                            setTimeout(() => {
                                                scrollViewRef.current?.scrollTo({ 
                                                    y: posY - 20, 
                                                    animated: true 
                                                });
                                            }, 150);
                                        }
                                    }}
                                    keyboardType="numeric"
                                    maxLength={4}
                                />
                                <Text style={styles.ratingSuffix}>/ 10</Text>
                            </View>
                        </View>
                        <View 
                            style={styles.fieldRow}
                            onLayout={(e) => {
                                const layout = e.nativeEvent.layout;
                                setFieldPositions(prev => ({ ...prev, themes: layout.y }));
                            }}
                        >
                            <Text style={styles.fieldLabel}>Themes</Text>
                            <TextInput
                                style={[styles.input, { height: Math.max(40, inputHeights['themes'] || 40) }]}
                                value={editedData.themes || ''}
                                onChangeText={(val) => setEditedData(prev => ({ ...prev, themes: val }))}
                                multiline
                                onContentSizeChange={(e) => {
                                    const h = e?.nativeEvent?.contentSize?.height;
                                    if (h) {
                                        setInputHeights(prev => ({ ...prev, themes: Math.min(Math.max(40, h), 600) }));
                                    }
                                }}
                                onFocus={() => {
                                    const posY = fieldPositions['themes'];
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
                        <View 
                            style={styles.fieldRow}
                            onLayout={(e) => {
                                const layout = e.nativeEvent.layout;
                                setFieldPositions(prev => ({ ...prev, favorite_quote: layout.y }));
                            }}
                        >
                            <Text style={styles.fieldLabel}>Favorite Quote</Text>
                            <TextInput
                                style={[styles.input, { height: Math.max(40, inputHeights['favorite_quote'] || 40) }]}
                                value={editedData.favorite_quote || ''}
                                onChangeText={(val) => setEditedData(prev => ({ ...prev, favorite_quote: val }))}
                                multiline
                                onContentSizeChange={(e) => {
                                    const h = e?.nativeEvent?.contentSize?.height;
                                    if (h) {
                                        setInputHeights(prev => ({ ...prev, favorite_quote: Math.min(Math.max(40, h), 600) }));
                                    }
                                }}
                                onFocus={() => {
                                    const posY = fieldPositions['favorite_quote'];
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
                        <View 
                            style={styles.fieldRow}
                            onLayout={(e) => {
                                const layout = e.nativeEvent.layout;
                                setFieldPositions(prev => ({ ...prev, summary: layout.y }));
                            }}
                        >
                            <Text style={styles.fieldLabel}>Summary</Text>
                            <TextInput
                                style={[styles.input, { height: Math.max(40, inputHeights['summary'] || 40) }]}
                                value={editedData.summary || ''}
                                onChangeText={(val) => setEditedData(prev => ({ ...prev, summary: val }))}
                                multiline
                                onContentSizeChange={(e) => {
                                    const h = e?.nativeEvent?.contentSize?.height;
                                    if (h) {
                                        setInputHeights(prev => ({ ...prev, summary: Math.min(Math.max(40, h), 600) }));
                                    }
                                }}
                                onFocus={() => {
                                    const posY = fieldPositions['summary'];
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
                        <View 
                            style={styles.fieldRow}
                            onLayout={(e) => {
                                const layout = e.nativeEvent.layout;
                                setFieldPositions(prev => ({ ...prev, characters: layout.y }));
                            }}
                        >
                            <Text style={styles.fieldLabel}>Characters</Text>
                            <TextInput
                                style={[styles.input, { height: Math.max(40, inputHeights['characters'] || 40) }]}
                                value={editedData.characters || ''}
                                onChangeText={(val) => setEditedData(prev => ({ ...prev, characters: val }))}
                                multiline
                                onContentSizeChange={(e) => {
                                    const h = e?.nativeEvent?.contentSize?.height;
                                    if (h) {
                                        setInputHeights(prev => ({ ...prev, characters: Math.min(Math.max(40, h), 600) }));
                                    }
                                }}
                                onFocus={() => {
                                    const posY = fieldPositions['characters'];
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
                    </>
                );

            case 'reading_notes':
                return (
                    <>
                        <View style={styles.fieldRow}>
                            <Text style={styles.fieldLabel}>Notes</Text>
                            <TextInput
                                style={[styles.input, { height: Math.max(40, inputHeights['notes'] || 40) }]}
                                value={editedData.notes || ''}
                                onChangeText={(val) => setEditedData(prev => ({ ...prev, notes: val }))}
                                multiline
                                onContentSizeChange={(e) => {
                                    const h = e?.nativeEvent?.contentSize?.height;
                                    if (h) {
                                        setInputHeights(prev => ({ ...prev, notes: Math.min(Math.max(40, h), 600) }));
                                    }
                                }}
                            />
                        </View>
                        <View style={styles.fieldRow}>
                            <Text style={styles.fieldLabel}>Takeaways</Text>
                            <TextInput
                                style={[styles.input, { height: Math.max(40, inputHeights['takeaways'] || 40) }]}
                                value={editedData.takeaways || ''}
                                onChangeText={(val) => setEditedData(prev => ({ ...prev, takeaways: val }))}
                                multiline
                                onContentSizeChange={(e) => {
                                    const h = e?.nativeEvent?.contentSize?.height;
                                    if (h) {
                                        setInputHeights(prev => ({ ...prev, takeaways: Math.min(Math.max(40, h), 600) }));
                                    }
                                }}
                            />
                        </View>
                        <View style={styles.fieldRow}>
                            <Text style={styles.fieldLabel}>Questions</Text>
                            <TextInput
                                style={[styles.input, { height: Math.max(40, inputHeights['questions'] || 40) }]}
                                value={editedData.questions || ''}
                                onChangeText={(val) => setEditedData(prev => ({ ...prev, questions: val }))}
                                multiline
                                onContentSizeChange={(e) => {
                                    const h = e?.nativeEvent?.contentSize?.height;
                                    if (h) {
                                        setInputHeights(prev => ({ ...prev, questions: Math.min(Math.max(40, h), 600) }));
                                    }
                                }}
                            />
                        </View>
                        <View style={styles.fieldRow}>
                            <Text style={styles.fieldLabel}>Vocabulary</Text>
                            <TextInput
                                style={[styles.input, { height: Math.max(40, inputHeights['vocabulary'] || 40) }]}
                                value={editedData.vocabulary || ''}
                                onChangeText={(val) => setEditedData(prev => ({ ...prev, vocabulary: val }))}
                                multiline
                                onContentSizeChange={(e) => {
                                    const h = e?.nativeEvent?.contentSize?.height;
                                    if (h) {
                                        setInputHeights(prev => ({ ...prev, vocabulary: Math.min(Math.max(40, h), 600) }));
                                    }
                                }}
                            />
                        </View>
                    </>
                );

            case 'reading_reflections':
                return (
                    <>
                        <View style={styles.fieldRow}>
                            <Text style={styles.fieldLabel}>What I learned</Text>
                            <TextInput
                                style={[styles.input, { height: Math.max(40, inputHeights['learned'] || 40) }]}
                                value={editedData.learned || ''}
                                onChangeText={(val) => setEditedData(prev => ({ ...prev, learned: val }))}
                                multiline
                                onContentSizeChange={(e) => {
                                    const h = e?.nativeEvent?.contentSize?.height;
                                    if (h) {
                                        setInputHeights(prev => ({ ...prev, learned: Math.min(Math.max(40, h), 600) }));
                                    }
                                }}
                            />
                        </View>
                        <View style={styles.fieldRow}>
                            <Text style={styles.fieldLabel}>Favorite part</Text>
                            <TextInput
                                style={[styles.input, { height: Math.max(40, inputHeights['favorite_part'] || 40) }]}
                                value={editedData.favorite_part || ''}
                                onChangeText={(val) => setEditedData(prev => ({ ...prev, favorite_part: val }))}
                                multiline
                                onContentSizeChange={(e) => {
                                    const h = e?.nativeEvent?.contentSize?.height;
                                    if (h) {
                                        setInputHeights(prev => ({ ...prev, favorite_part: Math.min(Math.max(40, h), 600) }));
                                    }
                                }}
                            />
                        </View>
                        <View style={styles.fieldRow}>
                            <Text style={styles.fieldLabel}>Reflections</Text>
                            <TextInput
                                style={[styles.input, { height: Math.max(40, inputHeights['reflections'] || 40) }]}
                                value={editedData.reflections || ''}
                                onChangeText={(val) => setEditedData(prev => ({ ...prev, reflections: val }))}
                                multiline
                                onContentSizeChange={(e) => {
                                    const h = e?.nativeEvent?.contentSize?.height;
                                    if (h) {
                                        setInputHeights(prev => ({ ...prev, reflections: Math.min(Math.max(40, h), 600) }));
                                    }
                                }}
                            />
                        </View>
                    </>
                );

            default:
                return (
                    <View style={styles.fieldRow}>
                        <Text style={styles.fieldValue}>Unknown reading sheet type</Text>
                    </View>
                );
        }
    };

    const getModelTypeLabel = (type) => {
        const labels = {
            'basic': 'Basic Notes',
            'book_review': 'Book Review',
            'reading_notes': 'Reading Notes',
            'reading_reflections': 'Reading Reflections'
        };
        return labels[type] || type;
    };

    return (
        <SafeAreaView style={styles.screen}>
            <TopBar pageName="LibraryPage" />

            <KeyboardAvoidingView 
                behavior={Platform.OS === "ios" ? "padding" : "height"}
                style={{ flex: 1, width: '100%' }}
            >

            <ScrollView 
                ref={scrollViewRef}
                showsVerticalScrollIndicator={false}
                keyboardShouldPersistTaps="handled"
                style={{ width: '100%' }}
            >
                <View style={styles.header}>
                    {/* Content Container */}
                    <View style={styles.contentContainer}>
                        {/* Book Info Section */}
                        <View style={styles.bookInfoRow}>
                            <Image
                                source={{ uri: sheet.book.cover }}
                                style={styles.bookCover}
                            />
                            <View style={styles.bookInfo}>
                                <Text style={styles.bookTitle}>{sheet.book.title}</Text>
                                <Text style={styles.bookAuthor}>{sheet.book.author}</Text>
                                <Text style={styles.dateText}>Created: {new Date(sheet.date).toLocaleDateString()}</Text>
                            </View>
                        </View>

                        {/* Horizontal Bar */}
                        <View style={styles.horizontalBar} />

                        {/* Fields */}
                        {renderModelContent()}
                    </View>
                </View>
            </ScrollView>

            </KeyboardAvoidingView>
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
        paddingHorizontal: 16,
        marginTop: 84,
        marginBottom: 20,
    },
    bookInfoRow: {
        flexDirection: 'row',
        width: '100%',
        alignItems: 'center',
        marginBottom: 16,
    },
    bookCover: {
        height: 120,
        width: 84,
        borderRadius: 4,
        marginRight: 16,
    },
    bookInfo: {
        flex: 1,
    },
    bookTitle: {
        fontFamily: 'Nunito_600SemiBold',
        fontSize: 20,
        color: '#613F75',
        marginBottom: 8,
    },
    bookAuthor: {
        fontFamily: 'Nunito_500Medium',
        fontSize: 16,
        color: '#18101D',
    },
    typeBadge: {
        backgroundColor: '#613F75',
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 20,
        marginBottom: 12,
    },
    typeText: {
        fontFamily: 'Nunito_600SemiBold',
        fontSize: 14,
        color: '#FFFFFF',
    },
    dateText: {
        fontFamily: 'Nunito_400Regular',
        fontSize: 14,
        color: '#613F75',
        marginTop: 8,
    },
    horizontalBar: {
        height: 2,
        width: '100%',
        backgroundColor: '#E5C3D1',
        marginTop: 8,
        marginBottom: 8,
    },
    contentContainer: {
        width: '95%',
        backgroundColor: '#F7EDF1',
        borderColor: '#F3E3E9',
        borderWidth: 1,
        borderRadius: 8,
        padding: 16,
        marginTop: 16,
    },
    fieldRow: {
        width: '100%',
        marginTop: 8,
        marginBottom: 8,
    },
    fieldLabel: {
        fontFamily: 'Nunito_600SemiBold',
        fontSize: 16,
        color: '#613F75',
        marginBottom: 6,
    },
    fieldValue: {
        fontFamily: 'Nunito_400Regular',
        fontSize: 14,
        color: '#18101D',
        lineHeight: 20,
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
        height: 40,
    },
    ratingSuffix: {
        fontFamily: 'Nunito_500Medium',
        fontSize: 16,
        color: '#18101D',
    },
});

export default ReadingSheetPage;
