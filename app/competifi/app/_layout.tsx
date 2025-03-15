import { Stack, Tabs, Slot } from "expo-router";
import "../global.css";
import { ToastProvider } from "react-native-toast-notifications";
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { AuthProvider } from "@/provider/AuthProvider";

export default function RootLayout() {
  return (
    <AuthProvider>
    <GestureHandlerRootView>
    <ToastProvider>
      <Stack initialRouteName="welcome" screenOptions={{
        headerTitle: "Competifi",
      }} >
        <Stack.Screen name="welcome" options={{
          headerShown: false,
          animation: 'slide_from_right',
        }}>

        </Stack.Screen>
        {/* <Stack.Screen name="login" options={{
          headerShown: false,
          animation: 'slide_from_right',
        }}>

        </Stack.Screen> */}
          <Stack.Screen name="(tabs)"
          options={{
            headerShown: false,
            animation: 'slide_from_right',
            headerStyle: {
              backgroundColor: '#2C001E',
            },
            headerTintColor: '#fff',
            headerTitleStyle: {
              fontWeight: 'bold',
            },
          }}></Stack.Screen>
      </Stack>
    </ToastProvider>
    </GestureHandlerRootView>
    </AuthProvider>
  )
}