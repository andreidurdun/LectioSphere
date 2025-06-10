import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Image, SafeAreaView, ScrollView, FlatList, TouchableWithoutFeedback } from 'react-native';
import NavBar from './Partials/NavBar';
import TopBar from './Partials/TopBar';
import { useFonts, Nunito_400Regular, Nunito_500Medium, Nunito_600SemiBold } from '@expo-google-fonts/nunito';

const SearchResult = ({ navigation, route }) => {
    const { books, searchQuery, apiBaseUrl } = route.params || { books: [], searchQuery: '', apiBaseUrl: '' };

    const booksWithCover = books.filter(b => !! b.thumbnail);

    const [fontsLoaded] = useFonts({
        Nunito_400Regular,
        Nunito_500Medium,
        Nunito_600SemiBold
    });

    const handleBookPress = (book) => {
        navigation.navigate('BookShow', { 
            bookData: JSON.stringify(book)
        });
    };

    const renderBookItem = ({ item }) => (
        <TouchableWithoutFeedback onPress={() => handleBookPress(item)}>
            <View style={styles.bookContainer}>
                <Image source={{ uri: item.thumbnail }} style={styles.covers} />
                <View style={styles.infoContainer}>
                    <Text style={styles.textInfoTitle}>{item.title}</Text>
                    <Text style={styles.textInfoAuthor}>{item.authors}</Text>
                    <Text style={styles.textInfo}>{item.rating}</Text>
                </View>
            </View>
        </TouchableWithoutFeedback>
    );

    if (!fontsLoaded) {
        return null;
    }

    return (
        <SafeAreaView style={styles.screen}>
            <TopBar pageName="HomePage" apiBaseUrl={apiBaseUrl} />

            <View style={styles.container}>
                <Text style={styles.resultsHeader}>
                    Search results for "{searchQuery}"
                </Text>
                
                {books && books.length > 0 ? (
                    <FlatList
                        data={booksWithCover}
                        renderItem={renderBookItem}
                        keyExtractor={(item) => item.id}
                        showsVerticalScrollIndicator={false} 
                        contentContainerStyle={{
                            alignItems: 'center',
                            // paddingTop: 40,
                            // paddingBottom: 65,
                        }}
                    />
                ) : (
                    <View style={styles.noResultsContainer}>
                        <Text style={styles.noResultsText}>
                            No books found
                        </Text>
                    </View>
                )}
            </View>

            <NavBar navigation={navigation} page="SearchPage" />
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    screen: {
        flex: 1,
        backgroundColor: '#FCF8FA',
    },
    container: {
        flex: 1,
        marginTop: 100,
        paddingHorizontal: 16,
        paddingBottom: 100,
    },
    resultsHeader: {
        fontSize: 18,
        fontFamily: 'Nunito_600SemiBold',
        color: '#18101D',
        marginBottom: 20,
        textAlign: 'center',
    },
    usersList: {
        flex: 1,
    },
    userItem: {
        flexDirection: 'row',
        padding: 16,
        backgroundColor: '#F7EDF1',
        borderRadius: 8,
        marginBottom: 12,
        borderWidth: 1,
        borderColor: '#F3E3E9',
    },
    profilePic: {
        width: 60,
        height: 60,
        borderRadius: 30,
        borderWidth: 1,
        borderColor: '#613F75',
        marginRight: 12,
    },
    userInfo: {
        flex: 1,
        justifyContent: 'center',
    },
    fullName: {
        fontSize: 16,
        fontFamily: 'Nunito_600SemiBold',
        color: '#18101D',
        marginBottom: 4,
    },
    username: {
        fontSize: 14,
        fontFamily: 'Nunito_500Medium',
        color: '#613F75',
        marginBottom: 4,
    },
    bio: {
        fontSize: 12,
        fontFamily: 'Nunito_400Regular',
        color: '#18101D',
        lineHeight: 16,
    },
    noResultsContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    noResultsText: {
        fontSize: 16,
        fontFamily: 'Nunito_500Medium',
        color: '#613F75',
        textAlign: 'center',
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
    bookContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 10,
        backgroundColor: '#F7EDF1',
        borderColor: '#F3E3E9',
        borderWidth: 1,
        borderRadius: 8,
        paddingVertical: 10,
        marginTop: 16,
        //marginHorizontal: 16,
    },
    infoContainer: {    
        backgroundColor: '#F7EDF1',  
        width: '65%',
        marginLeft: 10,
    },
    textInfo: {
        flexWrap: 'wrap', 
        fontFamily: 'Nunito_500Medium',
        color: '#18101D',
    },
    textInfoTitle: {
        flexWrap: 'wrap', 
        fontFamily: 'Nunito_500Medium',
        color: '#613F75',
        fontSize: 18,
    },
    textInfoAuthor: {
        flexWrap: 'wrap', 
        fontFamily: 'Nunito_600SemiBold',
        color: '#18101D',
        marginBottom: 8,
    },
});

export default SearchResult;