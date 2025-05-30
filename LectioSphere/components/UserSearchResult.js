import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Image, SafeAreaView, ScrollView, FlatList } from 'react-native';
import NavBar from './Partials/NavBar';
import TopBar from './Partials/TopBar';
import { useFonts, Nunito_400Regular, Nunito_500Medium, Nunito_600SemiBold } from '@expo-google-fonts/nunito';

const UserSearchResult = ({ navigation, route }) => {
    const { users, searchQuery, apiBaseUrl } = route.params || { users: [], searchQuery: '', apiBaseUrl: '' };
    
    const defaultPicture = require('../assets/defaultProfilePic.jpg');

    const [fontsLoaded] = useFonts({
        Nunito_400Regular,
        Nunito_500Medium,
        Nunito_600SemiBold
    });

    const handleUserPress = (userId) => {
        navigation.navigate('ProfilePageOther', { userId });
    };

    const renderUserItem = ({ item }) => (
        <TouchableOpacity 
            style={styles.userItem}
            onPress={() => handleUserPress(item.id)}
        >
            <Image 
                source={
                    item.profile_pic 
                    ? { uri: item.profile_pic } 
                    : defaultPicture
                }
                style={styles.profilePic}
            />
            <View style={styles.userInfo}>
                <Text style={styles.fullName}>
                    {item.first_name} {item.last_name}
                </Text>
                <Text style={styles.username}>
                    @{item.username}
                </Text>
                {item.bio && (
                    <Text style={styles.bio} numberOfLines={2}>
                        {item.bio}
                    </Text>
                )}
            </View>
        </TouchableOpacity>
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
                
                {users && users.length > 0 ? (
                    <FlatList
                        data={users}
                        renderItem={renderUserItem}
                        keyExtractor={(item) => item.id.toString()}
                        style={styles.usersList}
                        showsVerticalScrollIndicator={false}
                    />
                ) : (
                    <View style={styles.noResultsContainer}>
                        <Text style={styles.noResultsText}>
                            No users found for "{searchQuery}"
                        </Text>
                    </View>
                )}
            </View>

            <NavBar navigation={navigation} page="FollowPage" />
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
});

export default UserSearchResult;