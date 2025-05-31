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

    const [posts, setPosts] = useState([]);
    const [loading, setLoading] = useState(true);

    const defaultPicture = require('../../assets/defaultProfilePic.jpg');

    useEffect(() => {
        setLoading(true);
        setPosts([]);
        
        let endpoint = '';
        
        if (selection === 'photo') {
            endpoint = `${apiBaseUrl}/posts/post_type`;
        } else if (selection === 'glasses') {
            endpoint = `${apiBaseUrl}/posts/non_post_type`;
        } else if (selection === 'closedBook') {
            // Pentru closedBook, nu facem cerere API încă
            setLoading(false);
            return;
        }

        if (endpoint) {
            axios.get(endpoint)
                .then(res => {
                    // Sortează postările după data descrescător
                    const sortedPosts = res.data.sort((a, b) => new Date(b.date) - new Date(a.date));
                    setPosts(sortedPosts);
                    setLoading(false);
                })
                .catch(err => {
                    console.error(err);
                    setLoading(false);
                });
        }
    }, [selection, apiBaseUrl]); // Re-run when selection or apiBaseUrl changes

    // console.log('Current selection:', selection);
    // console.log('Posts:', posts);

    if (loading) {
        return (
            <View style={styles.card}>
                <View style={styles.notFoundContainer}>
                    <Text style={styles.notFoundText}>
                        Loading...
                    </Text>
                </View>
            </View>
        );
    }

    if (selection === 'closedBook') {
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

    if (posts.length === 0) {
        const message = selection === 'photo' 
            ? "This user didn't post anything yet"
            : "This user doesn't have any interactions yet";
            
        return (
            <View style={styles.card}>
                <View style={styles.notFoundContainer}>
                    <Text style={styles.notFoundText}>
                        {message}
                    </Text>
                </View>
            </View>
        );
    }    
    
    return (
        <View style={styles.card}>
            {posts.map((post, index) => (
                <PostPartial postData={JSON.stringify(post)} apiBaseUrl={apiBaseUrl} key={`${selection}-${post.id || index}`} />
            ))}
        </View>
    );
}

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
