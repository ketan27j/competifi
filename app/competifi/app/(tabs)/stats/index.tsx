import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useAuth } from '@/provider/AuthProvider';
import getGoogleFitData from '@/app/services/googleFitService';

const ProfileScreen = () => {
  const { user, signOut } = useAuth();
  const [ stepCount, setStepCount ] = useState(0);

  useEffect(() => {
    const today = new Date();
    const startDate = new Date(today.setDate(today.getDate() - 30)).toISOString();
    const endDate = new Date().toISOString();
    getGoogleFitData(startDate, endDate)
      .then(steps => {
        console.log('Steps:', steps);
        setStepCount(steps[0].steps);
        steps?.forEach((step) => {
          console.log(`StepCount: ${step}`);
        })
      })
  }, []);

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Stats</Text>
      <Text>Welcome, {user?.data?.user?.name}</Text>
      <Text>Email: {user?.data?.user?.email}</Text>
      <Text>Steps: {stepCount}</Text>
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
