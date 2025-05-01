import React from 'react';
import { SafeAreaView, View, Text, TextInput, StyleSheet, Image, Alert } from 'react-native';

const icon = require('../../assets/favicon.png');
const searchPurpleIcon = require('../../assets/searchPurple.png');
const addShelfIcon = require('../../assets/addShelf.png');
const addReadingSheetIcon = require('../../assets/addReadingSheet.png');
const envelope = require('../../assets/envelope.png');
const threeDots = require('../../assets/threeDots.png');

const TopBar = ({pageName}) => {
    const [followSearchVal, setFollowSearchVal] = React.useState('');
    const [searchSearchVal, setSearchSearchVal] = React.useState('');

    const handleFollowSearchInput = (text) => {
        //console.log("Search input:", text);
        setFollowSearchVal(text);
    };

    const handleSearchSearchInput = (text) => {
        setSearchSearchVal(text);
    }

    const handleLibraryAddReadingSheet = () => {
        Alert.alert('Add reading sheet');
    }

    const handleLibraryAddShelf = () => {
        Alert.alert('Add shelf');
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
                        onChangeText={(text) => handleFollowSearchInput(text)} // Update state on text input
                        onSubmitEditing={() => handleFollowSearchInput(followSearchVal)} // Trigger handle on Enter
                    />
                    <Image 
                        source={searchPurpleIcon} // Replace with your search icon path
                        style={styles.searchIcon}
                        onTouchEnd={() => handleFollowSearchInput(followSearchVal)} // Trigger search on image press
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
                        value={followSearchVal}
                        placeholderTextColor="#613F75"
                        onChangeText={(text) => handleSearchSearchInput(text)} // Update state on text input
                        onSubmitEditing={() => handleSearchSearchInput(followSearchVal)} // Trigger handle on Enter
                    />
                    <Image 
                        source={searchPurpleIcon} // Replace with your search icon path
                        style={styles.searchIcon}
                        onTouchEnd={() => handleSearchSearchInput(followSearchVal)} // Trigger search on image press
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
                    <Image 
                        source={addReadingSheetIcon} // Replace with your search icon path
                        style={styles.addReadingSheetIcon}
                        onTouchEnd={() => handleLibraryAddReadingSheet()} // Trigger search on image press
                    />
                    <Image 
                        source={addShelfIcon} // Replace with your search icon path
                        style={styles.addShelfIcon}
                        onTouchEnd={() => handleLibraryAddShelf()} // Trigger search on image press
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
        top: 20,
        left: 0,
        right: 0,
        flexDirection: 'row',
        alignItems: 'center',
        padding: 10,
        backgroundColor: '#F7EDF1',
        borderBottomWidth: 1,
        borderBottomColor: '#ddd',
        height: 64,
        zIndex: 1,
    },
    containerJustified: {
        position: 'absolute',
        top: 20,
        left: 0,
        right: 0,
        flexDirection: 'row',
        alignItems: 'center',
        padding: 10,
        backgroundColor: '#F7EDF1',
        borderBottomWidth: 1,
        borderBottomColor: '#ddd',
        height: 64,
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
        width: 120,
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