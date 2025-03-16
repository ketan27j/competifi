import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, ScrollView, ActivityIndicator, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Calendar } from 'react-native-calendars';
import { format, addDays, differenceInDays } from 'date-fns';
import { Ionicons } from '@expo/vector-icons';

import { apiGet, apiPost } from '../../utils/api';
import { Stack } from 'expo-router';

type GoalType = 'Steps' | 'Cycling';

interface Challenge {
  id: string;
  name: string;
  startDate: string;
  endDate: string;
  entryFees: number;
  goalType: GoalType;
  goalTarget: number;
}

// Ubuntu theme colors
const UBUNTU_COLORS = {
  orange: '#E95420', // Primary Ubuntu orange
  aubergine: '#2C001E', // Dark purple
  warmGrey: '#AEA79F', // Warm grey
  lightAubergine: '#77216F', // Light purple
  midAubergine: '#5E2750', // Mid purple
  canonicalAubergine: '#772953', // Canonical aubergine
  background: '#F7F7F7', // Light background
  text: '#333333', // Text color
};

export default function ChallengeScreen() {
  const [challenges, setChallenges] = useState<Challenge[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddChallenge, setShowAddChallenge] = useState(false);
  
  // Form states
  const [challengeName, setChallengeName] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [entryFees, setEntryFees] = useState('');
  const [goalType, setGoalType] = useState<GoalType>('Steps');
  const [goalTarget, setGoalTarget] = useState('');
  const [showCalendar, setShowCalendar] = useState(false);
  const [selectingStartDate, setSelectingStartDate] = useState(true);
  
  // Fetch challenges on component mount
  useEffect(() => {
    fetchChallenges();
  }, []);
  
  const fetchChallenges = async () => {
    setLoading(true);
    try {
      const response = await apiGet('api/challenges', true);
      setChallenges(response.data);
    } catch (error) {
      console.error('Error fetching challenges:', error);
      Alert.alert('Error', 'Failed to load challenges');
    } finally {
      setLoading(false);
    }
  };
  
  const handleCreateChallenge = async () => {
    if (!challengeName || !startDate || !endDate || !entryFees || !goalTarget) {
      Alert.alert('Error', 'All fields are required');
      return;
    }
    
    if (challengeName.length > 50) {
      Alert.alert('Error', 'Challenge name cannot exceed 50 characters');
      return;
    }
    
    const entryFeesNumber = parseFloat(entryFees);
    if (isNaN(entryFeesNumber) || entryFeesNumber <= 0) {
      Alert.alert('Error', 'Entry fees must be a positive number');
      return;
    }
    
    const goalTargetNumber = parseFloat(goalTarget);
    if (isNaN(goalTargetNumber) || goalTargetNumber <= 0) {
      Alert.alert('Error', 'Goal target must be a positive number');
      return;
    }
    
    try {
      setLoading(true);
      const newChallenge = {
        name: challengeName,
        startDate,
        endDate,
        entryFees: entryFeesNumber,
        goalType,
        goalTarget: goalTargetNumber
      };
      
      await apiPost('api/challenges', newChallenge);
      
      // Reset form
      setChallengeName('');
      setStartDate('');
      setEndDate('');
      setEntryFees('');
      setGoalType('Steps');
      setGoalTarget('');
      setShowAddChallenge(false);
      
      // Refresh challenges list
      fetchChallenges();
      
      Alert.alert('Success', 'Challenge created successfully');
    } catch (error) {
      console.error('Error creating challenge:', error);
      Alert.alert('Error', 'Failed to create challenge');
    } finally {
      setLoading(false);
    }
  };
  
  const handleDateSelect = (date: string) => {
    const selectedDate = date;
    
    if (selectingStartDate) {
      setStartDate(selectedDate);
      setSelectingStartDate(false);
    } else {
      // Ensure end date is after start date and within constraints
      const daysDiff = differenceInDays(new Date(date), new Date(startDate));
      
      if (daysDiff < 5) {
        Alert.alert('Error', 'Challenge must be at least 5 days long');
        return;
      }
      
      if (daysDiff > 30) {
        Alert.alert('Error', 'Challenge cannot exceed 30 days');
        return;
      }
      
      setEndDate(selectedDate);
      setShowCalendar(false);
    }
  };
  
  const openDatePicker = () => {
    setSelectingStartDate(true);
    setShowCalendar(true);
  };
  
  const formatDisplayDate = (dateString: string) => {
    if (!dateString) return '';
    return format(new Date(dateString), 'MMM dd, yyyy');
  };

  const getGoalTargetLabel = () => {
    return goalType === 'Steps' ? 'Number of Steps' : 'Distance (km)';
  };
  
  const formatGoalTarget = (challenge: Challenge) => {
    if (challenge.goalType === 'Steps') {
      return `${challenge.goalTarget.toLocaleString()} steps`;
    } else {
      return `${challenge.goalTarget} km`;
    }
  };
  
  return (
    <SafeAreaView style={{ backgroundColor: UBUNTU_COLORS.background }} className="flex-1">
      <Stack.Screen options={{ 
        title: 'Challenges',
        headerStyle: { backgroundColor: UBUNTU_COLORS.orange },
        headerTintColor: 'white',
      }} />
      
      {loading ? (
        <View className="flex-1 justify-center items-center">
          <ActivityIndicator size="large" color={UBUNTU_COLORS.orange} />
        </View>
      ) : (
        <View className="flex-1 p-4">
          {!showAddChallenge ? (
            <>
              <TouchableOpacity 
                style={{ backgroundColor: UBUNTU_COLORS.orange }}
                className="py-3 px-4 rounded-lg mb-4 shadow-md flex-row justify-center items-center"
                onPress={() => setShowAddChallenge(true)}
              >
                <Ionicons name="add-circle-outline" size={18} color="white" />
                <Text className="text-white text-center font-bold ml-2">Create New Challenge</Text>
              </TouchableOpacity>
              
              <ScrollView className="flex-1">
                {challenges.length === 0 ? (
                  <Text style={{ color: UBUNTU_COLORS.text }} className="text-center mt-4">No challenges found</Text>
                ) : (
                  challenges.map((challenge) => (
                    <View key={challenge.id} className="bg-white p-4 rounded-lg mb-3 shadow-sm border border-gray-100">
                      <Text style={{ color: UBUNTU_COLORS.aubergine }} className="font-bold text-lg">{challenge.name}</Text>
                      <Text style={{ color: UBUNTU_COLORS.text }} className="text-gray-700">
                        {formatDisplayDate(challenge.startDate)} - {formatDisplayDate(challenge.endDate)}
                      </Text>

                      <View className="flex-row justify-between mt-1">
                        <Text style={{ color: UBUNTU_COLORS.text }} className="text-gray-700">Entry Fee: {challenge.entryFees} SOL</Text>
                        <Text style={{ color: UBUNTU_COLORS.lightAubergine }} className="font-medium">{challenge.goalType}</Text>
                      </View>
                      <Text style={{ color: UBUNTU_COLORS.text }} className="text-gray-700">Goal: {formatGoalTarget(challenge)}</Text>
                    </View>
                  ))
                )}
              </ScrollView>
            </>
          ) : (
            <ScrollView className="flex-1">
              <TouchableOpacity 
                style={{ backgroundColor: UBUNTU_COLORS.warmGrey }}
                className="py-2 px-3 rounded-lg mb-4 self-start flex-row items-center shadow-sm"
                onPress={() => setShowAddChallenge(false)}
              >
                <Ionicons name="arrow-back" size={16} color="white" />
                <Text className="text-white ml-1">Back</Text>
              </TouchableOpacity>
              
              <Text style={{ color: UBUNTU_COLORS.aubergine }} className="text-xl font-bold mb-4">Create New Challenge</Text>
              
              <View className="mb-4">
                <Text style={{ color: UBUNTU_COLORS.text }} className="font-semibold mb-1">Challenge Name*</Text>
                <TextInput
                  className="border border-gray-300 rounded-lg p-2 bg-white"
                  value={challengeName}
                  onChangeText={setChallengeName}
                  placeholder="Enter challenge name (max 50 chars)"
                  maxLength={50}
                  placeholderTextColor="#AEA79F"
                />
                <Text className="text-right text-xs" style={{ color: UBUNTU_COLORS.warmGrey }}>
                  {challengeName.length}/50
                </Text>
              </View>
              
              <View className="mb-4">
                <Text style={{ color: UBUNTU_COLORS.text }} className="font-semibold mb-1">Duration*</Text>
                <TouchableOpacity 
                  className="border border-gray-300 rounded-lg p-2 bg-white"
                  onPress={openDatePicker}
                >
                  <Text style={{ color: startDate && endDate ? UBUNTU_COLORS.text : UBUNTU_COLORS.warmGrey }}>
                    {startDate && endDate 
                      ? `${formatDisplayDate(startDate)} - ${formatDisplayDate(endDate)}`
                      : "Select start and end dates"}
                  </Text>
                </TouchableOpacity>
                <Text style={{ color: UBUNTU_COLORS.warmGrey }} className="text-xs mt-1">
                  Challenge duration must be between 5-30 days
                </Text>
              </View>
              
              {showCalendar && (
                <View className="mb-4 border border-gray-200 rounded-lg overflow-hidden shadow-sm">
                  <View style={{ backgroundColor: UBUNTU_COLORS.orange }} className="p-2">
                    <Text className="text-white font-semibold text-center">
                      {selectingStartDate ? "Select Start Date" : "Select End Date"}
                    </Text>
                  </View>
                  <Calendar
                    onDayPress={(day) => handleDateSelect(day.dateString)}
                    minDate={selectingStartDate ? format(new Date(), 'yyyy-MM-dd') : startDate}
                    maxDate={selectingStartDate 
                      ? undefined 
                      : format(addDays(new Date(startDate), 30), 'yyyy-MM-dd')}
                    markedDates={{
                      [startDate]: { selected: true, selectedColor: UBUNTU_COLORS.orange },
                      [endDate]: { selected: true, selectedColor: UBUNTU_COLORS.orange }
                    }}
                    theme={{
                      selectedDayBackgroundColor: UBUNTU_COLORS.orange,
                      todayTextColor: UBUNTU_COLORS.orange,
                      arrowColor: UBUNTU_COLORS.orange,
                    }}
                  />
                </View>
              )}
              
              <View className="mb-4">
                <Text style={{ color: UBUNTU_COLORS.text }} className="font-semibold mb-1">Entry Fee (SOL)*</Text>
                <TextInput
                  className="border border-gray-300 rounded-lg p-2 bg-white"
                  value={entryFees}
                  onChangeText={setEntryFees}
                  placeholder="Enter entry fee in SOL"
                  keyboardType="numeric"
                  placeholderTextColor="#AEA79F"
                />
              </View>
              
              <View className="mb-4">
                <Text style={{ color: UBUNTU_COLORS.text }} className="font-semibold mb-1">Goal Type*</Text>
                <View className="flex-row">
                  <TouchableOpacity 
                    style={{ backgroundColor: goalType === 'Steps' ? UBUNTU_COLORS.orange : '#E6E6E6' }}
                    className="flex-1 py-2 px-4 rounded-lg mr-2 shadow-sm"
                    onPress={() => setGoalType('Steps')}
                  >
                    <Text className={`text-center ${goalType === 'Steps' ? 'text-white' : 'text-gray-700'}`}>
                      Steps
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity 
                    style={{ backgroundColor: goalType === 'Cycling' ? UBUNTU_COLORS.orange : '#E6E6E6' }}
                    className="flex-1 py-2 px-4 rounded-lg shadow-sm"
                    onPress={() => setGoalType('Cycling')}
                  >
                    <Text className={`text-center ${goalType === 'Cycling' ? 'text-white' : 'text-gray-700'}`}>
                      Cycling
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
              
              <View className="mb-6">
                <Text style={{ color: UBUNTU_COLORS.text }} className="font-semibold mb-1">{getGoalTargetLabel()}*</Text>
                <TextInput
                  className="border border-gray-300 rounded-lg p-2 bg-white"
                  value={goalTarget}
                  onChangeText={setGoalTarget}
                  placeholder={`Enter ${goalType === 'Steps' ? 'number of steps' : 'distance in km'}`}
                  keyboardType="numeric"
                  placeholderTextColor="#AEA79F"
                />
                <Text style={{ color: UBUNTU_COLORS.warmGrey }} className="text-xs mt-1">
                  {goalType === 'Steps' 
                    ? 'Daily step goal (e.g., 10000)' 
                    : 'Daily cycling distance in kilometers (e.g., 5)'}
                </Text>
              </View>
              
              <TouchableOpacity
                style={{ backgroundColor: UBUNTU_COLORS.orange }}
                className="py-3 px-4 rounded-lg mb-4 shadow-md"
                onPress={handleCreateChallenge}
              >
                <Text className="text-white text-center font-bold">Create Challenge</Text>
                </TouchableOpacity>
                </ScrollView>
          )
        }
        </View>
      )
    }
    </SafeAreaView>
  )
}