// import React from 'react';
// import { AuthProvider } from '@/provider/AuthProvider';
// import AppNavigator from './appNavigator';

// const App = () => {
//   return (
//     <AuthProvider>
//       <AppNavigator />
//     </AuthProvider>
//   );
// };

// export default App;
import { Link, Stack } from "expo-router";
import { ActivityIndicator, Text, View } from "react-native";

export default function Index() {
  return (
    <View
      style={{
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
      }}
    >
    </View>
  );
}
