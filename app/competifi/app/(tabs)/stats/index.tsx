import React, { useEffect, useState } from 'react';
import { View, Text, Dimensions, ScrollView, ActivityIndicator } from 'react-native';
import { useAuth } from '@/provider/AuthProvider';
import getGoogleFitData from '@/app/services/googleFitService';
import { Ionicons, FontAwesome5, MaterialCommunityIcons } from '@expo/vector-icons';
import LinearGradient from 'react-native-linear-gradient';

const { width } = Dimensions.get('window');

const StatsScreen = () => {
  const { user } = useAuth();
  const [stepData, setStepData] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchStepData();
  }, []);

  const fetchStepData = async () => {
    setIsLoading(true);
    try {
      // Get today at midnight
      const endDate = new Date();
      endDate.setHours(23, 59, 59, 999);
      
      // Get 7 days ago
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - 7);
      startDate.setHours(0, 0, 0, 0);
      
      const steps = await getGoogleFitData(startDate.toISOString(), endDate.toISOString());
      setStepData(steps || []);
    } catch (error) {
      console.error('Error fetching step data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return `${date.getDate()}/${date.getMonth() + 1}`;
  };

  // Prepare data for the chart
  const last7Days = stepData.slice(-7);
  const chartData = {
    labels: last7Days.map(item => formatDate(item.date)),
    values: last7Days.map(item => item.steps),
  };

  const todaySteps = stepData.length > 0 ? stepData[stepData.length - 1].steps : 0;
  const totalSteps = stepData.reduce((sum, item) => sum + item.steps, 0);

  // Find the maximum value for scaling
  const maxValue = Math.max(...chartData.values, 1);

  return (
    <ScrollView className="flex-1 bg-[#300A24]">
      <View className="flex-1 p-4">
        {/* Activity Stats Section (Top 50%) */}
        <View className="h-[60vh] mb-4">
          <Text className="text-2xl font-bold text-white mb-4">Activity Stats</Text>
          
          {isLoading ? (
            <View className="flex-1 justify-center items-center bg-[#3E1334] rounded-lg">
              <ActivityIndicator size="large" color="#E95420" />
              <Text className="text-white mt-2">Loading step data...</Text>
            </View>
          ) : stepData.length > 0 ? (
            <View className="bg-[#3E1334] rounded-lg p-4 flex-1">
              <Text className="text-lg text-white mb-2">Steps - Last 7 Days</Text>
              
              {/* Custom Bar Chart */}
              <View className="flex-1 justify-around">
                {chartData.values.map((value, index) => (
                  <View key={index} className="flex-row items-center h-8 my-1">
                    <View className="w-10">
                      <Text className="text-white text-xs">{chartData.labels[index]}</Text>
                    </View>
                    <View className="flex-1 flex-row items-center h-6">
                      <View 
                        className="h-full rounded bg-[#E95420]" 
                        style={{ width: `${Math.min((value / maxValue) * 100, 75)}%` }} 
                      />
                      <Text className="ml-2 text-white text-xs">{value}</Text>
                    </View>
                  </View>
                ))}
              </View>
            </View>
          ) : (
            <View className="flex-1 justify-center items-center bg-[#3E1334] rounded-lg">
              <Text className="text-white">No step data available</Text>
            </View>
          )}
        </View>

        {/* User Info Section (Bottom 50%) */}
        {/* <View className="bg-gradient-to-r from-[#4E2A41] to-[#5E3A51] rounded-lg p-5 shadow-md"> */}
        
        <View className="bg-[#fb923c] rounded-lg p-7 flex-1 shadow-md">
          <View className="mb-4">
            <Text className="text-white text-lg">Welcome, {user?.data?.user?.name}</Text>
            <Text className="text-white text-base opacity-80">{user?.data?.user?.email}</Text>
          </View>
          
          {/* Stats Row */}
          <View className="flex-row justify-between mb-4">
            {/* Total Steps */}
            <View className="items-center">
              <View className="flex-row items-center">
                <FontAwesome5 name="shoe-prints" size={16} color="white" className="mr-1" />
                <Text className="text-white text-lg font-bold ml-1">{totalSteps}</Text>
              </View>
              <Text className="text-white text-xs mt-1">Total Steps</Text>
            </View>
            
            {/* Active Challenges */}
            <View className="items-center">
              <View className="flex-row items-center">
                <MaterialCommunityIcons name="run-fast" size={20} color="white" className="mr-1" />
                <Text className="text-white text-lg font-bold ml-1">3</Text>
              </View>
              <Text className="text-white text-xs mt-1">Active Challenges</Text>
            </View>
            
            {/* Overall Challenges */}
            <View className="items-center">
              <View className="flex-row items-center">
                <Ionicons name="fitness" size={20} color="white" className="mr-1" />
                <Text className="text-white text-lg font-bold ml-1">24</Text>
              </View>
              <Text className="text-white text-xs mt-1">Overall Challenges</Text>
            </View>
            
            {/* Won Challenges */}
            <View className="items-center">
              <View className="flex-row items-center">
                <FontAwesome5 name="trophy" size={18} color="gold" className="mr-1" />
                <Text className="text-white text-lg font-bold ml-1">11</Text>
              </View>
              <Text className="text-white text-xs mt-1">Won</Text>
            </View>
          </View>
          
          {/* Today's Steps */}
          <View className="bg-[#3E1334] p-3 rounded-lg">
            <View className="flex-row items-center">
              <FontAwesome5 name="walking" size={20} color="#E95420" />
              <Text className="text-white text-base ml-2">Today's Steps: <Text className="font-bold">{todaySteps}</Text></Text>
            </View>
          </View>
        </View>
      </View>
    </ScrollView>
  );
};

export default StatsScreen;