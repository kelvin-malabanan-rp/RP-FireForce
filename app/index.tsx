import { LoginComponent } from "@/components/login-component";
import React from "react";
import { StyleSheet, View } from "react-native";

export default function index() {
  return (
    <View style={styles.container}>
      <LoginComponent />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});
