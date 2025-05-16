import React, { useEffect, useState } from 'react';
import { View, Text, ActivityIndicator, StyleSheet } from 'react-native';

const PostPartial = ({ apiBaseUrl, postId }) => {
    const [post, setPost] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchPost = async () => {
            try {
                const response = await fetch(`${apiBaseUrl}/api/posts/${postId}`);
                if (!response.ok) throw new Error('Post not found');
                const data = await response.json();
                setPost(data);
            } catch (error) {
                setPost(null);
            } finally {
                setLoading(false);
            }
        };

        if (postId) {
            fetchPost();
        }
    }, [postId]);

    if (loading) return <ActivityIndicator size="large" style={styles.centered} />;
    if (!post) return <Text style={styles.centered}>Post not found.</Text>;

    return (
        <View style={styles.container}>
            <Text style={styles.title}>{post.title}</Text>
            <Text>{post.content}</Text>
            {/* Add more fields as needed */}
        </View>
    );
};

const styles = StyleSheet.create({
    container: { padding: 16 },
    title: { fontSize: 20, fontWeight: 'bold', marginBottom: 8 },
    centered: { textAlign: 'center', marginTop: 20 }
});

export default PostPartial;