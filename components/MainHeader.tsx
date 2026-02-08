import React from "react";
import { View, Text, StyleSheet, TouchableOpacity, SafeAreaView, Platform, StatusBar } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useNotifications } from "../context/NotificationContext";

const MainHeader: React.FC = () => {
    const router = useRouter();
    const { unreadCount } = useNotifications();

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
                        <Ionicons name="person-circle-outline" size={32} color="#4F46E5" />
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
});
