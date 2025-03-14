import { View, Text, TouchableOpacity, ImageBackground, Image } from 'react-native';
import { router } from 'expo-router';
import { useAuth } from '@/provider/AuthProvider';

const WelcomeScreen = () => {
  const { signIn } = useAuth();
  const handleLogin = () => {
    signIn();
  };

  return (
    <ImageBackground 
      source={require('../assets/images/welcome.jpg')}
      className="flex-1 w-full h-full"
      resizeMode="cover"
    >
      <View className="flex-1 relative">
        {/* Logo at the top */}
        <View className="absolute top-[65px] left-[161px] rounded-full border-4 border-yellow-400 p-0.5 border-double">
          <Image 
            source={require('../assets/images/competifi_logo.png')}
            style={{
              width: 67,
              height: 67,
              borderRadius: 33.5, // Half of width/height to make it circular
            }}
          />
        </View>
        
        {/* Bottom content with text and button */}
        <View className="absolute bottom-0 w-full bg-black/50 px-4 pt-10 pb-10">
          <View className="items-center mb-8">
            <Text className="text-6xl font-bold text-white text-center font-['Roboto']">
              MOVE TRAIN
            </Text>
            <Text className="text-7xl font-bold text-white text-center font-['Roboto']">
              DOMINATE
            </Text>
          </View>
          
          <View className="items-center mb-6">
            <TouchableOpacity
              onPress={handleLogin}
              className="bg-[#FED005] w-[244px] h-[40px] rounded-full justify-center items-center"
            >
              <Text className="font-['Teko'] font-bold text-2xl text-black">
                GET STARTED
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </ImageBackground>
  );
};

export default WelcomeScreen;