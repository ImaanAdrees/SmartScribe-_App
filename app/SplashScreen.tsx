import React, { useEffect, useRef } from "react";
import { View, StyleSheet, Animated, StatusBar, Image } from "react-native";

const SplashScreen: React.FC = () => {
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 1500,
      useNativeDriver: true,
    }).start();
  }, [fadeAnim]);

  return (
    <View style={styles.container}>
      <StatusBar backgroundColor="#fff" barStyle="dark-content" />

      {/* Animated logo */}
      <Animated.View style={{ opacity: fadeAnim }}>
        <Image
          source={require("../assets/images/mainlogo.png")} // 👈 put your logo here
          style={styles.logo}
          resizeMode="contain"
        />
      </Animated.View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FFFFFF",
    justifyContent: "center",
    alignItems: "center",
  },
  logo: {
    width: 160, // adjust size as needed
    height: 160,
  },
});

export default SplashScreen;
