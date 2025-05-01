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

const NavBar = () => {
    const [active, setActive] = useState('home');

    const handleNavClick = (page) => {
        setActive(page);
    };

    return (
        <View style={styles.navBar}>

            <TouchableOpacity onPress={() => handleNavClick('home')} style={styles.button}>
                <Image
                    source={active === 'home' ? homePurple : homeBlack}
                    style={{ width: 25, height: 19.44 }}
                />
            </TouchableOpacity>

            <TouchableOpacity onPress={() => handleNavClick('follow')} style={styles.button}>
                <Image
                    source={active === 'follow' ? peoplePurple : peopleBlack}
                    style={{ width: 25, height: 17.5 }}
                />
            </TouchableOpacity>

            <TouchableOpacity onPress={() => handleNavClick('search')} style={styles.button}>
                <Image
                    source={active === 'search' ? searchPurple : searchBlack}
                    style={{ width: 25, height: 25 }}
                />
            </TouchableOpacity>

            <TouchableOpacity onPress={() => handleNavClick('library')} style={styles.button}>
                <Image
                    source={active === 'library' ? bookPurple : bookBlack}
                    style={{ width: 25, height: 19.44 }}
                />
            </TouchableOpacity>

            <TouchableOpacity onPress={() => handleNavClick('profile')} style={styles.button}>
                <Image
                    source={active === 'profile' ? humanPurple : humanBlack}
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
        // shadowColor: '#18101D',
        // shadowOffset: { width: 0, height: 40 },
        // shadowOpacity: 1,
        // shadowRadius: 4,
        elevation: 5,
        borderTopWidth: 1,
        borderTopColor: '#F3E3E9', // Optional: Add a border for better visibility
    },
    button: {
        width: 60, // Crește dimensiunea pentru mai mult spațiu
        height: 32,
        justifyContent: 'center', // Centrează conținutul pe verticală
        alignItems: 'center', // Centrează conținutul pe orizontală
    }
});

export default NavBar;