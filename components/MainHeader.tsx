import React, { useState, useEffect } from "react";
import { View, Text, StyleSheet, TouchableOpacity, SafeAreaView, Platform, StatusBar, Image } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useRouter, useFocusEffect } from "expo-router";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useNotifications } from "../context/NotificationContext";

const API_URL = process.env.EXPO_PUBLIC_BACKEND_URL || "http://localhost:5000";

// Helper to construct full image URL
const getImageUrl = (imagePath: string | null) => {
    if (!imagePath) return null;
    if (imagePath.startsWith('http')) return imagePath;
    const fullUrl = `${API_URL}${imagePath}`;
    console.log('[MainHeader] Constructed image URL:', fullUrl);
    return fullUrl;
};

const MainHeader: React.FC = () => {
    const router = useRouter();
    const { unreadCount } = useNotifications();
    const [profileImage, setProfileImage] = useState<string | null>(null);
    const [imageError, setImageError] = useState(false);

    // Load profile image on mount and when screen comes into focus
    useFocusEffect(
        React.useCallback(() => {
            const loadProfileImage = async () => {
                try {
                    const userData = await AsyncStorage.getItem("userData");
                    console.log('[MainHeader] userData from AsyncStorage:', userData);
                    if (userData) {
                        const parsed = JSON.parse(userData);
                        console.log('[MainHeader] Parsed user data:', parsed);
                        console.log('[MainHeader] Profile image path:', parsed.image);
                        setProfileImage(parsed.image || null);
                        setImageError(false);
                    }
                } catch (error) {
                    console.error("[MainHeader] Error loading profile image:", error);
                }
            };
            loadProfileImage();
        }, [])
    );

    return (
        <SafeAreaView style={styles.safeArea}>
            <View style={styles.container}>
                {/* App Title */}
                <Text style={styles.headerTitle}>SmartScribe</Text>

                {/* Icons */}
                <View style={styles.iconGroup}>
                    <TouchableOpacity
                        style={styles.iconButton}
                        onPress={() => router.push("/user/notification")}
                    >
                        <View>
                            <Ionicons name="notifications-outline" size={28} color="#4F46E5" />
                            {unreadCount > 0 && (
                                <View style={styles.badgeContainer}>
                                    <Text style={styles.badgeText}>
                                        {unreadCount > 9 ? "9+" : unreadCount}
                                    </Text>
                                </View>
                            )}
                        </View>
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={styles.iconButton}
                        onPress={() => router.push("/user/profile")}
                    >
                        {profileImage && !imageError ? (
                            <Image
                                source={{ uri: getImageUrl(profileImage) as string }}
                                style={styles.profileImage}
                                onError={(error) => {
                                    console.error('[MainHeader] Image load error:', error.nativeEvent.error);
                                    setImageError(true);
                                }}
                                onLoad={() => {
                                    console.log('[MainHeader] Image loaded successfully');
                                }}
                            />
                        ) : (
                            <Ionicons name="person-circle-outline" size={32} color="#4F46E5" />
                        )}
                    </TouchableOpacity>
                </View>
            </View>
        </SafeAreaView>
    );
};

export default MainHeader;

const styles = StyleSheet.create({
    safeArea: {
        backgroundColor: "#FFF",
        paddingTop: Platform.OS === "android" ? StatusBar.currentHeight : 0,
    },
    container: {
        height: 60,
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        paddingHorizontal: 20,
        borderBottomWidth: 1,
        borderBottomColor: "#F3F4F6",
    },
    headerTitle: {
        fontSize: 22,
        fontWeight: "700",
        color: "#4F46E5",
    },
    iconGroup: {
        flexDirection: "row",
        alignItems: "center",
    },
    iconButton: {
        marginLeft: 15,
        padding: 2,
    },
    badgeContainer: {
        position: 'absolute',
        right: -6,
        top: -3,
        backgroundColor: '#EF4444',
        borderRadius: 10,
        minWidth: 18,
        height: 18,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 2,
        borderColor: '#FFF',
        paddingHorizontal: 2,
    },
    badgeText: {
        color: '#FFF',
        fontSize: 10,
        fontWeight: 'bold',
    },
    profileImage: {
        width: 32,
        height: 32,
        borderRadius: 16,
        borderWidth: 2,
        borderColor: '#4F46E5',
    },
});
