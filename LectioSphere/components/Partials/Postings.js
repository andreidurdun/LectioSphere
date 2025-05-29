import React, { useEffect, useState } from 'react';
import { StyleSheet, Text, View } from "react-native";
import { useFonts, Nunito_400Regular, Nunito_500Medium, Nunito_600SemiBold } from '@expo-google-fonts/nunito';
import axios from 'axios';
import PostPartial from './PostPartial'; // Adjust the import path as necessary


export default function Postings ({ apiBaseUrl, selection }) {

    const [fontsLoaded] = useFonts({
        Nunito_400Regular,
        Nunito_500Medium,
        Nunito_600SemiBold
    });

    const defaultPicture = require('../../assets/defaultProfilePic.jpg');

    if(selection === 'photo')
    {
        const [posts, setPosts] = useState([]);

        React.useEffect(() => {
            axios.get(`${apiBaseUrl}/posts/`)
                .then(res => {
                    // Sortează postările după data descrescător (presupunând că au un câmp 'createdAt')
                    const sortedPosts = res.data.sort((a, b) => new Date(b.date) - new Date(a.date));
                    setPosts(sortedPosts);
                })
                .catch(err => console.error(err));
        }, []);

        if (posts.length === 0) {
            return (
                <View style={styles.card}>
                    <View style={styles.notFoundContainer}>
                        <Text style={styles.notFoundText}>
                            This user didn't post anything yet
                        </Text>
                    </View>
                </View>
            );
        }
        

        return (
            <View style={styles.card}>
                {posts.map((post, index) => (
                    <PostPartial postData={JSON.stringify(post)} apiBaseUrl={apiBaseUrl} key={index} />
                ))}
            </View>
        );




    }
    else if (selection === 'glasses')
    {
        return (
            <View style={styles.card}>
                <View style={styles.notFoundContainer}>
                    <Text style={styles.notFoundText}>
                        This user had no interaction with books yet
                    </Text>
                </View>
            </View>
            
        );
    }
    else if (selection === 'closedBook')
    {
        return (
            <View style={styles.card}>
                <View style={styles.notFoundContainer}>
                    <Text style={styles.notFoundText}>
                        This user's library is currently empty
                    </Text>
                </View>
            </View>
            
        );
    }

    return null; // Ensure a default return value
};

const styles = StyleSheet.create({
    card: {
        width: '95%',
        marginLeft: 6,
        marginRight: 6,
        alignSelf: 'center'
    },
    notFoundContainer: {
        minHeight: 100,
        width: '100%', 
        backgroundColor: '#F7EDF1',
        borderRadius: 8,
        alignItems: 'center',
        justifyContent: 'center'
    },
    notFoundText: {
        fontSize: 32,
        fontWeight: 'semibold',
        color: '#E5C3D1',
        fontFamily: 'Nunito_600SemiBold',
        flexWrap: 'wrap',
        textAlign: 'center',
        padding: 12,
    },
});
