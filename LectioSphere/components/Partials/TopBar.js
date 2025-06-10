import React from 'react';
import { SafeAreaView, View, Text, TextInput, StyleSheet, Image, Alert } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import UserSearchResult from '../UserSearchResult';
import SearchResult from '../SearchResult';


const icon = require('../../assets/favicon.png');
const searchPurpleIcon = require('../../assets/searchPurple.png');
const addShelfIcon = require('../../assets/addShelf.png');
const addReadingSheetIcon = require('../../assets/addReadingSheet.png');
const envelope = require('../../assets/envelope.png');
const threeDots = require('../../assets/threeDots.png');

const TopBar = ({pageName, page, apiBaseUrl}) => {
    const [followSearchVal, setFollowSearchVal] = React.useState('');
    const [searchSearchVal, setSearchSearchVal] = React.useState('');
    const navigation = useNavigation();    

    const apiBaseUrl1 = 'http://192.168.1.134:8000';
    const handleFollowSearchTextChange = (text) => {
        setFollowSearchVal(text);
    };
    const handleSearchTextChange = (text) => {
        setSearchSearchVal(text);
    };

    const handleFollowSearchSubmit = async () => {
        const text = followSearchVal;
        
        if (text.trim() === '') return;
        
        try {
            const token = await AsyncStorage.getItem('auth_token');
            if (!token) {
                Alert.alert('Error', 'You need to be logged in to search for users');
                return;
            }
            
            const response = await axios.get(`${apiBaseUrl}/api/accounts/profiles/search/`, {
                headers: { Authorization: `JWT ${token}` },
                params: { q: text }
            });
            
            // console.log(response.data);

            navigation.navigate('UserSearchResult', {
                users: response.data.results,
                searchQuery: text,
                apiBaseUrl: apiBaseUrl
            });
        } catch (error) {
            console.error('Search error:', error.message);
            Alert.alert('Error', 'Failed to search for users');
        }
    };

    const handleSearchSubmit = async () => {
        const text1 = searchSearchVal;
        
        if (text1.trim() === '') return;
        
        try {
            const token = await AsyncStorage.getItem('auth_token');
            if (!token) {
                Alert.alert('Error', 'You need to be logged in to search for users');
                return;
            }
            
            const response = await axios.get(`${apiBaseUrl1}/books/search/`, {
                headers: { Authorization: `JWT ${token}` },
                params: { title: text1 }
            });
            
            // console.log(response.data);

            navigation.navigate('SearchResult', {
                books: response.data, searchQuery: text1, apiBaseUrl1
            });
        } catch (error) {
            console.error('Search error full:', {
                message: error.message,
                status: error.response?.status,
                data: error.response?.data,
                url: `${apiBaseUrl}/books/search/?title=${text1}`
            });
            Alert.alert(
                'Error',
                `Search failed: ${error.response?.status || ''} ${error.response?.data?.detail || error.message}`
            );
        }
        
    };

    const handleLibraryAddReadingSheet = () => {
        Alert.alert('Add reading sheet');
    }

    const handleLibraryAddShelf = (page) => {
        navigation.navigate(page); 
    }

    const handleNotificationsButton = () => {
        Alert.alert('Notifications menu');
    }

    const handleSettingsButton = () => {
        Alert.alert('Settings menu');
    }


    if (pageName === 'HomePage')
    {
        return (
            <SafeAreaView style={styles.container}>
                <Image 
                    source={icon} // Replace with your icon path
                    style={styles.icon}
                />

                <View>
                    <Text style={styles.title}>LectioSphere</Text>
                    <Text style={styles.subtitle}>Literary Experience, Community, Thoughts, Interaction, Organization</Text>
                </View>
                
            </SafeAreaView>
        );
    }
    else if (pageName == 'FollowPage')
    {
        return (
            <SafeAreaView style={styles.containerJustified}>
                <Image 
                    source={icon} // Replace with your icon path
                    style={styles.icon}
                />
                <View style={styles.searchContainer}>
                    <TextInput 
                        style={styles.searchInput} 
                        placeholder="Look for someone" 
                        value={followSearchVal}
                        placeholderTextColor="#613F75"
                        onChangeText={(text) => handleFollowSearchTextChange(text)} // Update state on text input
                        onSubmitEditing={() => handleFollowSearchSubmit()} // Trigger search on Enter
                    />
                    <Image 
                        source={searchPurpleIcon} // Replace with your search icon path
                        style={styles.searchIcon}
                        onTouchEnd={() => handleFollowSearchSubmit()} // Trigger search on image press
                    />
                </View>
            </SafeAreaView>
        );
    }
    else if (pageName == 'SearchPage')
    {
        return (
            <SafeAreaView style={styles.container}>
                <Image 
                    source={icon} // Replace with your icon path
                    style={styles.icon}
                />

                <View style={styles.searchContainer2}>
                    <TextInput 
                        style={styles.searchInput2} 
                        placeholder="Look for a book, author, genre" 
                        value={searchSearchVal}
                        placeholderTextColor="#613F75"
                        onChangeText={(text) => handleSearchTextChange(text)} // Update state on text input
                        onSubmitEditing={() => handleSearchSubmit()} // Trigger handle on Enter
                    />
                    <Image 
                        source={searchPurpleIcon} // Replace with your search icon path
                        style={styles.searchIcon}
                        onTouchEnd={() => handleSearchSubmit()} // Trigger search on image press
                    />
                </View>
            </SafeAreaView>
        );
    }
    else if (pageName == 'LibraryPage')
    {
        return (
            <SafeAreaView style={styles.containerJustified}>
                <Image 
                    source={icon} // Replace with your icon path
                    style={styles.icon}
                />

                <View style={styles.libraryButtonsContainer}>
                    {/* <Image 
                        source={addReadingSheetIcon} // Replace with your search icon path
                        style={styles.addReadingSheetIcon}
                        onTouchEnd={() => handleLibraryAddReadingSheet()} // Trigger search on image press
                    /> */}
                    <Image 
                        source={addShelfIcon} // Replace with your search icon path
                        style={styles.addShelfIcon}
                        onTouchEnd={() => handleLibraryAddShelf('AddShelf')} // Trigger search on image press
                    />
                </View>
            </SafeAreaView>
        );
    }
    else if (pageName == 'ProfilePage')
        {
            return (
                <SafeAreaView style={styles.containerJustified}>
                    <Image 
                        source={icon} // Replace with your icon path
                        style={styles.icon}
                    />
    
                    <View style={styles.libraryButtonsContainer}>
                        <Image 
                            source={envelope} // Replace with your search icon path
                            style={styles.envelopeIcon}
                            onTouchEnd={() => handleNotificationsButton()} // Trigger search on image press
                        />
                        <Image 
                            source={threeDots} // Replace with your search icon path
                            style={styles.threeDotsIcon}
                            onTouchEnd={() => handleSettingsButton()} // Trigger search on image press
                        />
                    </View>
                </SafeAreaView>
            );
        }
        
};

const styles = StyleSheet.create({
    container: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        flexDirection: 'row',
        alignItems: 'center',
        padding: 10,
        paddingTop: 30,
        backgroundColor: '#F7EDF1',
        borderBottomWidth: 1,
        borderBottomColor: '#ddd',
        height: 84,
        zIndex: 1,
    },
    containerJustified: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        flexDirection: 'row',
        alignItems: 'center',
        padding: 10,
        paddingTop: 30,
        backgroundColor: '#F7EDF1',
        borderBottomWidth: 1,
        borderBottomColor: '#ddd',
        height: 84,
        zIndex: 1,
        justifyContent: 'space-between'
    },
    smallContainer: {
        flexDirection: 'column',
        alignItems: 'flex-start',
    },
    icon: {
        width: 51.41,
        height: 44,
        marginRight: 10,
    },
    title: {
        fontSize: 20,
        fontWeight: '500',
        color: '#613F75',
    },
    subtitle: {
        fontSize: 8,
        fontWeight: '500',
        color: '#18101D',
    },
    searchContainer: {
        width: 200,
        height: 40,
        backgroundColor: '#FCF8FA',
        borderRadius: 20,
        flexDirection: 'row',
        alignContent: 'center',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    searchContainer2: {
        width: 300,
        height: 40,
        backgroundColor: '#FCF8FA',
        borderRadius: 20,
        flexDirection: 'row',
        alignContent: 'center',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    searchInput: {
        marginLeft: 12,
        width: 140,
        fontSize: 14, // Corrected font size for TextInput
        color: '#613F75', // Added text color for better visibility
    },
    searchInput2: {
        marginLeft: 12,
        width: 230,
        fontSize: 14, // Corrected font size for TextInput
        color: '#613F75', // Added text color for better visibility
    },
    searchIcon: {
        width: 24,
        height: 24,
        marginRight: 16
    },
    libraryButtonsContainer: {
        flexDirection: 'row',
        width: 70,
        justifyContent: 'space-around',
        alignItems: 'center'
    },
    addReadingSheetIcon: {
        width: 31,
        height: 28
    },
    addShelfIcon: {
        width: 45,
        height: 28
    },
    envelopeIcon: {
        width: 28,
        height: 28
    },
    threeDotsIcon: {
        width: 28,
        height: 8,
    }
});

export default TopBar;