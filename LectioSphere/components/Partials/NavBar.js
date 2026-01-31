import React, { useState } from 'react';
import { View, TouchableOpacity, StyleSheet, Image } from 'react-native';

// Import images
const homePurple = require('../../assets/homePurple.png');
const homeBlack = require('../../assets/homeBlack.png');
const peoplePurple = require('../../assets/peoplePurple.png');
const peopleBlack = require('../../assets/peopleBlack.png');
const searchPurple = require('../../assets/searchPurple.png');
const searchBlack = require('../../assets/searchBlack.png');
const bookPurple = require('../../assets/bookPurple.png');
const bookBlack = require('../../assets/bookBlack.png');
const humanPurple = require('../../assets/humanPurple.png');
const humanBlack = require('../../assets/humanBlack.png');

const NavBar = ({ navigation, page }) => {
    const [active, setActive] = useState(page);

    const handleNavClick = (page) => {
        setActive(page);
        navigation.replace(page);
    };

    return (
        <View style={styles.navBar} testID="partial-NavBar-root" accessibilityLabel="partial-NavBar-root">
            <TouchableOpacity testID="partial-NavBar-home" accessibilityLabel="partial-NavBar-home" onPress={() => handleNavClick('HomePage')} style={styles.button}>
                <Image
                    testID="partial-NavBar-home-image" accessibilityLabel="partial-NavBar-home-image"
                    source={active === 'HomePage' ? homePurple : homeBlack}
                    style={{ width: 25, height: 19.44 }}
                />
            </TouchableOpacity>

            <TouchableOpacity testID="partial-NavBar-follow" accessibilityLabel="partial-NavBar-follow" onPress={() => handleNavClick('FollowPage')} style={styles.button}>
                <Image
                    testID="partial-NavBar-follow-image" accessibilityLabel="partial-NavBar-follow-image"
                    source={active === 'FollowPage' ? peoplePurple : peopleBlack}
                    style={{ width: 25, height: 17.5 }}
                />
            </TouchableOpacity>

            <TouchableOpacity testID="partial-NavBar-search" accessibilityLabel="partial-NavBar-search" onPress={() => handleNavClick('SearchPage')} style={styles.button}>
                <Image
                    testID="partial-NavBar-search-image" accessibilityLabel="partial-NavBar-search-image"
                    source={active === 'SearchPage' ? searchPurple : searchBlack}
                    style={{ width: 25, height: 25 }}
                />
            </TouchableOpacity>

            <TouchableOpacity testID="partial-NavBar-library" accessibilityLabel="partial-NavBar-library" onPress={() => handleNavClick('LibraryPage')} style={styles.button}>
                <Image
                    testID="partial-NavBar-library-image" accessibilityLabel="partial-NavBar-library-image"
                    source={active === 'LibraryPage' ? bookPurple : bookBlack}
                    style={{ width: 25, height: 19.44 }}
                />
            </TouchableOpacity>

            <TouchableOpacity testID="partial-NavBar-profile" accessibilityLabel="partial-NavBar-profile" onPress={() => handleNavClick('ProfilePage')} style={styles.button}>
                <Image
                    testID="partial-NavBar-profile-image" accessibilityLabel="partial-NavBar-profile-image"
                    source={active === 'ProfilePage' ? humanPurple : humanBlack}
                    style={{ width: 18.75, height: 25 }}
                />
            </TouchableOpacity>
        </View>
    );
};

const styles = StyleSheet.create({
    navBar: {
        flexDirection: 'row',
        justifyContent: 'space-around',
        alignItems: 'center',
        backgroundColor: '#F7EDF1',
        paddingVertical: 8,
        position: 'absolute',
        bottom: 0,
        width: '100%',
        elevation: 5,
        borderTopWidth: 1,
        borderTopColor: '#F3E3E9',
    },
    button: {
        width: 60,
        height: 32,
        justifyContent: 'center',
        alignItems: 'center',
    },
});

export default NavBar;