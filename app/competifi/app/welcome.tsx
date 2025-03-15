import { View, Text, TouchableOpacity, ImageBackground, Image } from 'react-native';
import { router } from 'expo-router';
import { useAuth } from '@/provider/AuthProvider';
import getGoogleFitData from './services/googleFitService';

const WelcomeScreen = () => {
  const { signIn, signOut } = useAuth();
  const handleLogin = async () => {
    await signIn();
  };

  return (
    <ImageBackground 
      source={require('../assets/images/welcome_1.png')}
      className="flex-1"
      resizeMode="cover"
      style={{
        justifyContent: 'center',
        alignItems: 'center',
      }}
    >
      <Image 
        source={require('../assets/images/competifi_logo.png')}
        style={{
          width: 67,
          height: 67,
          position: 'absolute',
          top: 65,
          left: 161
        }}
      />
      <View className="flex-1 items-center justify-between py-20">
        <View className="w-full bg-black/50 absolute bottom-0 pb-28 pt-10">
          <View className="items-center">
            <Text className="text-6xl font-bold text-white text-center font-['Roboto']">
              MOVE WITH
            </Text>
            <Text className="text-7xl font-bold text-white text-center font-['Roboto']">
              PURPOSE
            </Text>
          </View>
          
          <TouchableOpacity
            onPress={handleLogin}
            style={{
              backgroundColor: '#FED005',
              width: 244,
              height: 40,
              position: 'absolute',
              bottom: 20,
              left: 73,
              borderRadius: 34,
              justifyContent: 'center',
              alignItems: 'center'
            }}
          >
            <Text style={{
              fontFamily: 'Teko',
              fontWeight: '700',
              fontSize: 16,
              lineHeight: 28.8,
              letterSpacing: 0,
              color: '#000000'
            }}>
              GET STARTED
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </ImageBackground>
  );
};

export default WelcomeScreen;
