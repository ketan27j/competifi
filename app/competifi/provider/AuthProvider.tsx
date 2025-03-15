import React, { createContext, useState, useContext, useEffect } from 'react';
import { GoogleSignin } from '@react-native-google-signin/google-signin';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';
import { Scopes } from 'react-native-google-fit';

interface AuthContextType {
  user: any;
  signIn: () => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    GoogleSignin.configure({
      webClientId: '935241688123-bl4lfpm43k7hguhg8aht2p5c753nihiu.apps.googleusercontent.com', // Get this from Google Cloud Console
      // clientSecret: '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'
      // androidClientId: '935241688123-vf1hf6bvfurhro3fk4ptq4a5o1kne9ua.apps.googleusercontent.com', // Get this from Google Cloud Console
      scopes: ['profile', 'email', Scopes.FITNESS_ACTIVITY_READ]
    });
    checkUser();
  }, []);

  const checkUser = async () => {
    // const userData = await AsyncStorage.getItem('user');
    // if (userData) {
    //   setUser(JSON.parse(userData));
    // }


    try {
      const storedUser = await AsyncStorage.getItem('user');
      // console.log('loadStoredUser', storedUser);
      
      if (storedUser) {
        // setUser(JSON.parse(storedUser));
        let u1 = JSON.parse(storedUser);
        // console.log('u1.data.user', u1.data.user);
        setUser(u1);
        console.log('user?.data?.user?.name',u1?.data?.user?.name);
        if(u1?.data?.user?.name) {
            router.replace('/(tabs)/profile');
        }
        else {
            router.replace('/welcome');
        }
      }
      else {
        router.replace('/welcome');
      }
    } catch (error) {
      console.error('Error loading stored user:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const signIn = async () => {
    console.log('signIn');
    const storedUser = await AsyncStorage.getItem('user');
    console.log('loadStoredUser', storedUser);
    if (storedUser) {
      const cUser = JSON.parse(storedUser);
      if (cUser?.data?.user?.name) {
        let currentUser = JSON.parse(storedUser);
        if(currentUser?.data?.user?.name) {
          router.replace('/(tabs)/profile');
        }
      }
      else {
        try {
          await GoogleSignin.hasPlayServices();
          const userInfo = await GoogleSignin.signIn();
          await AsyncStorage.setItem('user', JSON.stringify(userInfo));
          setUser(JSON.stringify(userInfo));
          await checkUser();
        } catch (error) {
          console.log(error);
        }
      }
    }
  };

  const signOut = async () => {
    try {
      await GoogleSignin.signOut();
      await AsyncStorage.removeItem('user');
      setUser(null);
      router.replace('/welcome');
    } catch (error) {
      console.log(error);
    }
  };

  return (
    <AuthContext.Provider value={{ user, signIn, signOut }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
