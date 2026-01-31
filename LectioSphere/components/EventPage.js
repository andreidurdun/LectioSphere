import React, { useState } from 'react';
import { View, Text, StyleSheet, SafeAreaView, ScrollView, Image, Linking, TouchableOpacity } from 'react-native';
import NavBar from './Partials/NavBar';
import TopBar from './Partials/TopBar';
import { useFonts, Nunito_400Regular, Nunito_500Medium, Nunito_600SemiBold } from '@expo-google-fonts/nunito';

const EventPage = ({ navigation, route }) => {
    const eventData = route.params?.eventData ? JSON.parse(route.params.eventData) : null;
    const [imageError, setImageError] = useState(false);

    const [fontsLoaded] = useFonts({
        Nunito_400Regular,
        Nunito_500Medium,
        Nunito_600SemiBold
    });

    const handleLinkPress = () => {
        if (eventData?.link) {
            Linking.openURL(eventData.link);
        }
    };

    if (!fontsLoaded) {
        return <Text>Loading fonts...</Text>;
    }

    if (!eventData) {
        return (
            <SafeAreaView style={styles.screen}>
                <TopBar pageName="EventPage" />
                <View style={styles.errorContainer}>
                    <Text style={styles.errorText}>Event not found</Text>
                </View>
                <NavBar navigation={navigation} page="HomePage" />
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView style={styles.screen}>
            <TopBar pageName="HomePage" />

            <ScrollView contentContainerStyle={styles.scrollContent}>
                <View style={styles.container}>
                    {eventData.image && eventData.image.trim() !== '' && !imageError && (
                        <Image
                            testID="event-image" accessibilityLabel="event-image"
                            source={{ uri: eventData.image }}
                            style={styles.eventImage}
                            resizeMode="cover"
                            onError={() => setImageError(true)}
                        />
                    )}

                    <View style={styles.contentContainer}>
                        <Text testID="event-title" accessibilityLabel="event-title" style={styles.eventTitle}>{eventData.title}</Text>

                        <View style={styles.infoRow}>
                            <Text style={styles.infoLabel}>📅 Date:</Text>
                            <Text testID="event-date" accessibilityLabel="event-date" style={styles.infoValue}>{eventData.date || 'Unknown'}</Text>
                        </View>

                        <View style={styles.infoRow}>
                            <Text style={styles.infoLabel}>📍 Location:</Text>
                            <Text testID="event-location" accessibilityLabel="event-location" style={styles.infoValue}>{eventData.location || 'Unknown'}</Text>
                        </View>

                        {eventData.source && (
                            <View style={styles.infoRow}>
                                <Text style={styles.infoLabel}>🔖 Source:</Text>
                                <Text testID="event-source" accessibilityLabel="event-source" style={styles.infoValue}>{eventData.source}</Text>
                            </View>
                        )}

                        <View style={styles.descriptionContainer}>
                            <Text style={styles.descriptionLabel}>📝 Description:</Text>
                            {(eventData.description || 'No description available')
                                .split('\n')
                                .filter(paragraph => paragraph.trim() !== '')
                                .map((paragraph, index) => (
                                    <Text key={index} style={styles.descriptionText}>
                                        {paragraph.trim()}
                                    </Text>
                                ))
                            }
                        </View>

                        {eventData.link && eventData.link.trim() !== '' && (
                            <TouchableOpacity testID="event-link" accessibilityLabel="event-link" style={styles.linkButton} onPress={handleLinkPress}>
                                <Text style={styles.linkButtonText}>🔗 Visit Event Page</Text>
                            </TouchableOpacity>
                        )}
                    </View>
                </View>
            </ScrollView>

            <NavBar navigation={navigation} page="HomePage" />
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    screen: {
        flex: 1,
        backgroundColor: '#FCF8FA',
    },
    scrollContent: {
        paddingBottom: 60,
        paddingTop: 84,
    },
    container: {
        flex: 1,
        backgroundColor: '#FCF8FA',
    },
    eventImage: {
        width: '100%',
        height: 250,
        backgroundColor: '#E5C3D1',
    },
    contentContainer: {
        padding: 20,
    },
    eventTitle: {
        fontFamily: 'Nunito_600SemiBold',
        fontSize: 24,
        color: '#18101D',
        marginBottom: 20,
        lineHeight: 30,
    },
    infoRow: {
        flexDirection: 'row',
        marginBottom: 12,
        alignItems: 'flex-start',
    },
    infoLabel: {
        fontFamily: 'Nunito_600SemiBold',
        fontSize: 16,
        color: '#613F75',
        marginRight: 8,
        minWidth: 100,
    },
    infoValue: {
        fontFamily: 'Nunito_400Regular',
        fontSize: 16,
        color: '#18101D',
        flex: 1,
    },
    descriptionContainer: {
        marginTop: 20,
        marginBottom: 20,
    },
    descriptionLabel: {
        fontFamily: 'Nunito_600SemiBold',
        fontSize: 18,
        color: '#613F75',
        marginBottom: 10,
    },
    descriptionText: {
        fontFamily: 'Nunito_400Regular',
        fontSize: 15,
        color: '#18101D',
        lineHeight: 22,
        marginBottom: 12,
        textAlign: 'justify',
    },
    linkButton: {
        backgroundColor: '#613F75',
        paddingVertical: 14,
        paddingHorizontal: 20,
        borderRadius: 8,
        alignItems: 'center',
        marginTop: 10,
    },
    linkButtonText: {
        fontFamily: 'Nunito_600SemiBold',
        fontSize: 16,
        color: '#FCF8FA',
    },
    errorContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    errorText: {
        fontFamily: 'Nunito_500Medium',
        fontSize: 18,
        color: '#613F75',
    },
});

export default EventPage;
