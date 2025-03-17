import "../../global.css";
import { ToastProvider } from "react-native-toast-notifications";
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { useAuth } from "@/provider/AuthProvider";
import { useRouter } from "expo-router";
import Ionicons from '@expo/vector-icons/Ionicons'
import Entypo from '@expo/vector-icons/Entypo'
import { Tabs } from "expo-router";
import { withLayoutContext } from "expo-router";
// import {
//   createNativeBottomTabNavigator,
//   NativeBottomTabNavigationOptions,
//   NativeBottomTabNavigationEventMap,
// } from '@bottom-tabs/react-navigation';
import { ParamListBase, TabNavigationState } from '@react-navigation/native';
import { View } from "react-native";
import LinearGradient from "react-native-linear-gradient";

// const BottomTabNavigator = createNativeBottomTabNavigator().Navigator;

// const Tabs = withLayoutContext<
//   NativeBottomTabNavigationOptions,
//   typeof BottomTabNavigator,
//   TabNavigationState<ParamListBase>,
//   NativeBottomTabNavigationEventMap
// >(BottomTabNavigator);

export default function TabLayout() {
  const router = useRouter()

  return (
    <GestureHandlerRootView>
      <ToastProvider>
        <Tabs 
          screenOptions={{
            tabBarActiveTintColor: "#FFFFFF",
            tabBarInactiveTintColor: "#E2E2E2",
            // tabBarStyle: {
            //   borderTopWidth: 0,
            // },
            // tabBarBackground: () => (
            //   <View className="h-full bg-gradient-to-br from-[#454546] to-[#000000]" />
            // ),
            tabBarStyle: {
              backgroundColor: 'transparent',
              position: 'absolute',
              elevation: 0,
              borderTopWidth: 0,
            },
            tabBarBackground: () => (
              <LinearGradient
                colors={['#000002', '#000000']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0.6588 }}
                style={{ height: '100%' }}
              />
            ),
          }}
        >
          <Tabs.Screen 
            name="stats/index"
            options={{
              title: "Stats",
              tabBarIcon: ({ focused }) => (
                <Ionicons name="stats-chart" size={28} color="#FED005" />
              ),
              headerShown: false
            }}
          />
          <Tabs.Screen 
            name="dashboard/index"
            options={{
              title: "Stride",
              tabBarIcon: ({ focused }) => (
                <Ionicons name="footsteps-sharp" size={28} color="#FED005" />
              ),
              headerShown: true
            }}
          />
          <Tabs.Screen 
            name="challenge/index"
            options={{
              title: "Challenge",
              tabBarIcon: ({ focused }) => (
                <Entypo name="evernote" size={28} color="#FED005" />
              ),
              headerShown: true
            }}
          />
          <Tabs.Screen 
            name="profile/index"
            options={{
              title: "Profile",
              tabBarIcon: ({ focused }) => (
                <Ionicons name="person-outline" size={28} color="#FED005" />
              ),
              headerShown: true
            }}
          />
        </Tabs>
      </ToastProvider>
    </GestureHandlerRootView>   
  )
}