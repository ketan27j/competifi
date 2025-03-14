import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useAuth } from '@/provider/AuthProvider';

const ProfileScreen = () => {
  const { user, signOut } = useAuth();
  console.log(user?.data?.user);

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Profile</Text>
      <Text>Welcome, {user?.data?.user?.name}</Text>
      <Text>Email: {user?.data?.user?.email}</Text>
      <TouchableOpacity style={styles.button} onPress={signOut}>
        <Text style={styles.buttonText}>Sign Out</Text>
      </TouchableOpacity>
    </View>
  );
};
export default ProfileScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  title: {
    fontSize: 24,
    marginBottom: 20,
  },
  button: {
    backgroundColor: '#DC4E41',
    padding: 15,
    borderRadius: 5,
    marginTop: 20,
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
  },
});
