import React, { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Alert, Image, SafeAreaView, ScrollView, Modal } from 'react-native';
import NavBar from './Partials/NavBar';
import TopBar from './Partials/TopBar';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import { useFonts, Nunito_400Regular, Nunito_500Medium, Nunito_600SemiBold } from '@expo-google-fonts/nunito';
import Postings from './Partials/Postings';


const ProfilePage = ({ navigation, removeAuthToken, apiBaseUrl }) => {
    const [userData, setUserData] = useState(null);
    const [profileData, setProfileData] = useState(null);
    const [authToken, setAuthToken] = useState(null);
    const [refreshToken, setRefreshToken] = useState(null);

    const [selected, setSelected] = useState('photo');
    const [drawerVisible, setDrawerVisible] = useState(false);
    const [sheetTypeModalVisible, setSheetTypeModalVisible] = useState(false);
    const [selectedSheetType, setSelectedSheetType] = useState('book_review');

    const defaultPicture = require('../assets/defaultProfilePic.jpg');
    const editPen = require('../assets/editPen.png');
    const photoPurple = require('../assets/photoPurple.png');
    const photoBlack = require('../assets/photoBlack.png');
    const glassesPurple = require('../assets/glassesPurple.png');
    const glassesBlack = require('../assets/glassesBlack.png');
    const closedBookPurple = require('../assets/closedBookPurple.png');
    const closedBookBlack = require('../assets/closedBookBlack.png');

    const [fontsLoaded] = useFonts({
        Nunito_400Regular,
        Nunito_500Medium,
        Nunito_600SemiBold
    });
    
    
    
    const saveAuthToken = async (newToken, refreshToken) => {
        try {
            await AsyncStorage.setItem('auth_token', newToken);
            setAuthToken(`JWT ${newToken}`);
        } catch (error) {
            console.error("Error saving auth token:", error);
        }
    };

    const fetchUserData = async () => {
        try {
            const response = await axios.get(`${apiBaseUrl}/auth/users/me/`, {
                headers: { Authorization: authToken }
            });
            setUserData(response.data);
        } catch (error) {
            if (error.response?.status === 401) {
                try {
                    const response = await axios.post(`${apiBaseUrl}/auth/jwt/refresh/`, {
                        refresh: refreshToken
                    });
                    const newToken = response.data.access;
                    
                    saveAuthToken(newToken, refreshToken);
                    
                    const retryResponse = await axios.get(`${apiBaseUrl}/auth/users/me/`, {
                        headers: { Authorization: `JWT ${newToken}` }
                    });
                    setUserData(retryResponse.data);
                } catch (refreshError) {
                    console.error("Failed to refresh token:", refreshError);
                    handleLogout();
                }
            } else {
                console.error("User fetch error:", error.message);
            }
        }
    };

    const fetchProfileData = async () => {
        try {
            const response = await axios.get(`${apiBaseUrl}/api/accounts/profile/read`, {
                headers: { Authorization: authToken }
            });
            setProfileData(response.data);
        } catch (error) {
            if (error.response?.status === 401) {
                try {
                    const response = await axios.post(`${apiBaseUrl}/auth/jwt/refresh/`, {
                        refresh: refreshToken
                    });
                    const newToken = response.data.access;
                    
                    saveAuthToken(newToken, refreshToken);
                    
                    const retryResponse = await axios.get(`${apiBaseUrl}/api/profile/`, {
                        headers: { Authorization: `JWT ${newToken}` }
                    });
                    setProfileData(retryResponse.data);
                } catch (refreshError) {
                    console.error("Failed to refresh token:", refreshError);
                }
            } else {
                console.error("Profile fetch error:", error.message);
            }
        }
    };

    useEffect(() => {
        const getTokensAndFetchData = async () => {
            try {
                const storedAuthToken = await AsyncStorage.getItem('auth_token');
                const storedRefreshToken = await AsyncStorage.getItem('refresh_token');
                
                if (storedAuthToken && storedRefreshToken) {
                    setAuthToken(`JWT ${storedAuthToken}`);
                    setRefreshToken(storedRefreshToken);
                    
                    // Fetch data after tokens are set
                    fetchUserData();
                    fetchProfileData();
                }

                // Load preferred sheet type
                const storedSheetType = await AsyncStorage.getItem('preferred_model');
                if (storedSheetType) {
                    setSelectedSheetType(storedSheetType);
                }
            } catch (error) {
                console.error("Error retrieving tokens:", error);
            }
        };
        
        getTokensAndFetchData();
    }, []);


    const handleLogout = async () => {
        Alert.alert(
            'Logout',
            'Are you sure you want to logout?',
            [
                { text: 'Cancel', style: 'cancel' },
                { 
                    text: 'Logout', 
                    onPress: async () => {
                        // Utilizează funcția removeAuthToken pasată din App.js
                        await removeAuthToken();
                        // Navigăm către ecranul de login
                        navigation.replace('LoginMenu');
                    }
                }
            ]
        );
    };    const handlePressEdit = () => {
        navigation.navigate('ProfileEdit');
    }

    const handleDrawerOpen = () => {
        setDrawerVisible(true);
    };

    const handleDrawerClose = () => {
        setDrawerVisible(false);
    };

    const handleChangeReadingSheets = () => {
        setDrawerVisible(false);
        setSheetTypeModalVisible(true);
    };

    const handleSaveSheetType = async () => {
        try {
            await AsyncStorage.setItem('preferred_model', selectedSheetType);
            setSheetTypeModalVisible(false);
            Alert.alert('Success', 'Reading sheet type preference updated!');
        } catch (error) {
            console.error('Error saving sheet type:', error);
            Alert.alert('Error', 'Failed to save preference');
        }
    };

    const SHEET_TYPES = [
        { value: 'book_review', label: 'Book Review', description: 'Rating, themes, quotes, summary, characters' },
        { value: 'reading_notes', label: 'Reading Notes', description: 'Notes, takeaways, questions, vocabulary' }
    ];

    return (
        <SafeAreaView style={styles.screen}>
            <TopBar pageName="ProfilePage" onSettingsPress={handleDrawerOpen} />

            <ScrollView 
                style={styles.scrollView}
                contentContainerStyle={styles.scrollContainer}
                showsVerticalScrollIndicator={false}
            >
                <View style={styles.body}>
                    <View style={styles.profileCard}>
                        <View style={styles.generalInfo}>
                            {/* <Image 
                                source={
                                    profileData?.profile_pic 
                                    ? { uri: profileData.profile_pic } 
                                    : defaultPicture
                                }
                                style={styles.profilePic}
                            /> */}
                            <View style={styles.textInfo}>
                                <View style={styles.followersInfo}>
                                    <TouchableOpacity testID="profile-followers" accessibilityLabel="profile-followers" onPress={() => navigation.navigate('FollowersFollowingList', {
                                        profileId: profileData?.profile.id,
                                        listType: 'followers',
                                        username: userData?.username,
                                        apiBaseUrl
                                    })}>
                                        <Text style={styles.followers}>
                                            {profileData?.profile.followers_count || 0} {'\n'}followers
                                        </Text>
                                    </TouchableOpacity>
                                    <View style={styles.verticalLine}></View>
                                    <TouchableOpacity testID="profile-following" accessibilityLabel="profile-following" onPress={() => navigation.navigate('FollowersFollowingList', {
                                        profileId: profileData?.profile.id,
                                        listType: 'following',
                                        username: userData?.username,
                                        apiBaseUrl
                                    })}>
                                        <Text style={styles.followers}>
                                            {profileData?.profile.following_count || 0} {'\n'}following
                                        </Text>
                                    </TouchableOpacity>
                                </View>
                                <View style={styles.nameAndEdit}>
                                    <View style={styles.nameInfo}>
                                        <View style={styles.fullname}>
                                            <Text style={styles.nameText}>
                                                {userData?.first_name} {userData?.last_name}
                                            </Text>
                                        </View>
                                        <View style={styles.username}>
                                            <Text style={styles.usernameText}>
                                                @{userData?.username}
                                            </Text>
                                            
                                        </View>
                                    </View>
                                    <TouchableOpacity testID="profile-edit" accessibilityLabel="profile-edit" onPress={handlePressEdit}>
                                        <Image 
                                            source={editPen} 
                                            style={styles.editPen} 
                                        />
                                    </TouchableOpacity>
                                </View>
                                
                            </View>
                        </View>
                        <View style={styles.description}>
                            <Text style={styles.bioText}>
                                {profileData?.profile.bio || "No bio available"}
                            </Text>
                        </View>
                    </View>

                    <View style={styles.selection}>
                        <TouchableOpacity 
                            testID="profile-select-photo" accessibilityLabel="profile-select-photo"
                            onPress={() => setSelected('photo')} 
                            style={selected === 'photo' ? [styles.selected, styles.selectionItem] : styles.selectionItem}
                        >
                            <Image 
                                source={selected === 'photo' ? photoPurple : photoBlack} 
                                style={styles.photoIcon} 
                            />
                        </TouchableOpacity>

                        <TouchableOpacity 
                            testID="profile-select-glasses" accessibilityLabel="profile-select-glasses"
                            onPress={() => setSelected('glasses')} 
                            style={selected === 'glasses' ? [styles.selected, styles.selectionItem] : styles.selectionItem}
                        >
                            <Image 
                                source={selected === 'glasses' ? glassesPurple : glassesBlack} 
                                style={styles.glassesIcon} 
                            />
                        </TouchableOpacity>

                        <TouchableOpacity 
                            testID="profile-select-closedbook" accessibilityLabel="profile-select-closedbook"
                            onPress={() => setSelected('closedBook')} 
                            style={selected === 'closedBook' ? [styles.selected, styles.selectionItem] : styles.selectionItem}
                        >
                            <Image 
                                source={selected === 'closedBook' ? closedBookPurple : closedBookBlack} 
                                style={styles.closedBookIcon} 
                            />
                        </TouchableOpacity>
                    </View>
                </View>

                <Postings selection={selected} apiBaseUrl={apiBaseUrl} key={selected} navigation={navigation}/>
            </ScrollView>

            <NavBar navigation={navigation} page="ProfilePage" />

            {/* Sheet Type Selection Modal */}
            <Modal
                animationType="slide"
                transparent={true}
                visible={sheetTypeModalVisible}
                onRequestClose={() => setSheetTypeModalVisible(false)}
            >
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContainer}>
                        <Text style={styles.modalTitle}>Choose Reading Sheet Type</Text>
                        <Text style={styles.modalSubtitle}>
                            Select your preferred type for new reading sheets
                        </Text>
                        
                        <ScrollView style={styles.sheetTypesContainer}>
                            {SHEET_TYPES.map((type) => (
                                <TouchableOpacity
                                    key={type.value}
                                    style={[
                                        styles.sheetTypeOption,
                                        selectedSheetType === type.value && styles.sheetTypeOptionSelected
                                    ]}
                                    onPress={() => setSelectedSheetType(type.value)}
                                >
                                    <View style={styles.sheetTypeRadio}>
                                        {selectedSheetType === type.value && (
                                            <View style={styles.sheetTypeRadioInner} />
                                        )}
                                    </View>
                                    <View style={styles.sheetTypeInfo}>
                                        <Text style={styles.sheetTypeLabel}>{type.label}</Text>
                                        <Text style={styles.sheetTypeDescription}>{type.description}</Text>
                                    </View>
                                </TouchableOpacity>
                            ))}
                        </ScrollView>

                        <View style={styles.modalButtons}>
                            <TouchableOpacity
                                testID="sheettype-cancel" accessibilityLabel="sheettype-cancel"
                                style={[styles.modalButton, styles.modalButtonCancel]}
                                onPress={() => setSheetTypeModalVisible(false)}
                            >
                                <Text style={styles.modalButtonTextCancel}>Cancel</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                testID="sheettype-save" accessibilityLabel="sheettype-save"
                                style={[styles.modalButton, styles.modalButtonSave]}
                                onPress={handleSaveSheetType}
                            >
                                <Text style={styles.modalButtonTextSave}>Save</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </Modal>

            {/* Drawer Menu Modal */}
            <Modal
                animationType="fade"
                transparent={true}
                visible={drawerVisible}
                onRequestClose={handleDrawerClose}
            >
                <TouchableOpacity 
                    style={styles.drawerOverlay} 
                    activeOpacity={1} 
                    onPress={handleDrawerClose}
                >
                    <View style={styles.drawerContainer}>
                        <TouchableOpacity 
                            testID="drawer-change-sheettype" accessibilityLabel="drawer-change-sheettype"
                            style={styles.drawerItem}
                            onPress={handleChangeReadingSheets}
                        >
                            <Text style={styles.drawerItemTextPurple}>Change Reading Sheets Type</Text>
                        </TouchableOpacity>
                        
                        <View style={styles.drawerDivider} />
                        
                        <TouchableOpacity 
                            testID="drawer-logout" accessibilityLabel="drawer-logout"
                            style={styles.drawerItem}
                            onPress={handleLogout}
                        >
                            <Text style={styles.drawerItemTextRed}>Log Out</Text>
                        </TouchableOpacity>
                    </View>
                </TouchableOpacity>
            </Modal>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({    screen: {
        flex: 1,
        backgroundColor: '#FCF8FA',
    },
    scrollView: {
        flex: 1,
        width: '100%',
    },
    scrollContainer: {
        flexGrow: 1,
        alignItems: 'center',
        paddingBottom: 100, // Space for NavBar
    },
    body: {
        marginTop: 100,
        marginLeft: 6,
        marginRight: 6,
        width: '95%',
    },
    profileCard: {
        width: '100%',
        minHeight: 200,
        backgroundColor: '#F7EDF1',
        borderRadius: 8,
        borderWidth: 1, // Added border width of 1px
        borderColor: '#F3E3E9',
        padding: 16,
        flexDirection: 'column',
    },
    generalInfo: {
        flexDirection: 'row',
        marginBottom: 12,
        paddingBottom: 12,
        borderBottomWidth: 1,
        borderBottomColor: '#E5C3D1',
    },
    description: {
        padding: 8,
        borderRadius: 6,
        marginTop: 5,
    },
    textInfo: {
        flex: 1,
        marginLeft: 15,
    },
    profilePic: {
        width: 100,
        height: 100,
        borderRadius: 60,
        borderWidth: 1,
        borderColor: '#613F75',
    },
    followersInfo: {
        flexDirection: 'row',
        justifyContent: 'flex-end',
        marginBottom: 8,
    },
    followers: {
        fontSize: 14,
        color: '#18101D',
        marginRight: 15,
        fontFamily: 'Nunito_500Medium',
        paddingLeft: 12,
        textAlign: 'center',
    },
    verticalLine : {
        width: 1,
        backgroundColor: '#E5C3D1',
        height: 'auto'
    },
    nameInfo: {
        marginTop: 5,
    },
    fullname: {
        marginBottom: 3,
    },
    nameText: {
        fontSize: 18,
        fontWeight: 'semibold',
        color: '#18101D',
        fontFamily: 'Nunito_600SemiBold',
        flexWrap: 'wrap'
    },
    username: {
        marginBottom: 8,
    },
    usernameText: {
        fontSize: 12,
        color: '#613F75',
        fontFamily: 'Nunito_400Regular',
        flexWrap: 'wrap',
    },
    nameAndEdit: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center'
    },
    editPen: {
        width: 24,
        height: 24,
        marginRight: 20
    },
    bioText: {
        fontSize: 16,
        lineHeight: 20,
        color: '#18101D',
        fontFamily: 'Nunito_600SemiBold',
        textAlign: 'center',
        flexWrap: 'wrap'
    },
    selection: {
        marginTop: 16,
        marginBottom: 16,
        backgroundColor: '#F7EDF1',
        borderRadius: 8,
        borderWidth: 1,
        borderColor: '#F3E3E9',
        flexDirection: 'row',
        justifyContent: 'space-around',
        padding: 12,
        alignItems: 'center',

    },
    selectionItem: {
        width: 40,
        height: 30,
        justifyContent: 'center',
    },
    selected: {
        borderBottomWidth: 1,
        borderBottomColor: '#613F75',
    },
    photoIcon: {
        width: 32,
        height: 24,
        alignSelf: 'center'
    },
    glassesIcon: {
        width: 31,
        height: 24,
        alignSelf: 'center'
    },
    closedBookIcon: {
        width: 21,
        height: 24,
        alignSelf: 'center'
    },








    logoutButton: {
        paddingVertical: 6,
        paddingHorizontal: 12,
        backgroundColor: '#f44336',
        borderRadius: 4,
        alignSelf: 'flex-start',
    },
    logoutButtonText: {
        fontSize: 12,
        color: '#fff',
        textAlign: 'center',
        fontFamily: 'Nunito_500Medium',
    },
    drawerOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        justifyContent: 'flex-start',
        alignItems: 'flex-end',
        paddingTop: 84, // Position below TopBar
        paddingRight: 10,
    },
    drawerContainer: {
        backgroundColor: '#FFFFFF',
        borderRadius: 8,
        minWidth: 250,
        shadowColor: '#000',
        shadowOffset: {
            width: 0,
            height: 2,
        },
        shadowOpacity: 0.25,
        shadowRadius: 4,
        elevation: 5,
    },
    drawerItem: {
        paddingVertical: 16,
        paddingHorizontal: 20,
    },
    drawerItemTextPurple: {
        fontSize: 16,
        fontFamily: 'Nunito_500Medium',
        color: '#613F75',
    },
    drawerItemTextRed: {
        fontSize: 16,
        fontFamily: 'Nunito_500Medium',
        color: '#FF0000',
    },
    drawerDivider: {
        height: 1,
        backgroundColor: '#E5E5E5',
        marginHorizontal: 10,
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
    },
    modalContainer: {
        backgroundColor: '#FFFFFF',
        borderRadius: 12,
        width: '100%',
        maxWidth: 400,
        maxHeight: '80%',
        padding: 20,
        shadowColor: '#000',
        shadowOffset: {
            width: 0,
            height: 4,
        },
        shadowOpacity: 0.3,
        shadowRadius: 6,
        elevation: 8,
    },
    modalTitle: {
        fontSize: 20,
        fontFamily: 'Nunito_600SemiBold',
        color: '#18101D',
        marginBottom: 8,
        textAlign: 'center',
    },
    modalSubtitle: {
        fontSize: 14,
        fontFamily: 'Nunito_400Regular',
        color: '#666',
        marginBottom: 20,
        textAlign: 'center',
    },
    sheetTypesContainer: {
        maxHeight: 400,
        marginBottom: 20,
    },
    sheetTypeOption: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        padding: 16,
        borderRadius: 8,
        borderWidth: 2,
        borderColor: '#E5E5E5',
        marginBottom: 12,
        backgroundColor: '#FAFAFA',
    },
    sheetTypeOptionSelected: {
        borderColor: '#613F75',
        backgroundColor: '#F7EDF1',
    },
    sheetTypeRadio: {
        width: 24,
        height: 24,
        borderRadius: 12,
        borderWidth: 2,
        borderColor: '#613F75',
        marginRight: 12,
        justifyContent: 'center',
        alignItems: 'center',
    },
    sheetTypeRadioInner: {
        width: 12,
        height: 12,
        borderRadius: 6,
        backgroundColor: '#613F75',
    },
    sheetTypeInfo: {
        flex: 1,
    },
    sheetTypeLabel: {
        fontSize: 16,
        fontFamily: 'Nunito_600SemiBold',
        color: '#18101D',
        marginBottom: 4,
    },
    sheetTypeDescription: {
        fontSize: 13,
        fontFamily: 'Nunito_400Regular',
        color: '#666',
        lineHeight: 18,
    },
    modalButtons: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        gap: 12,
    },
    modalButton: {
        flex: 1,
        paddingVertical: 12,
        paddingHorizontal: 20,
        borderRadius: 8,
        alignItems: 'center',
    },
    modalButtonCancel: {
        backgroundColor: '#F0F0F0',
    },
    modalButtonSave: {
        backgroundColor: '#613F75',
    },
    modalButtonTextCancel: {
        fontSize: 16,
        fontFamily: 'Nunito_600SemiBold',
        color: '#666',
    },
    modalButtonTextSave: {
        fontSize: 16,
        fontFamily: 'Nunito_600SemiBold',
        color: '#FFFFFF',
    },
});

export default ProfilePage;