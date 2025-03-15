import GoogleFit, { Scopes } from 'react-native-google-fit';
import { GoogleSignin } from '@react-native-google-signin/google-signin';
import AsyncStorage from '@react-native-async-storage/async-storage';

const authorizeGoogleFitDataFetch = async() => {
  // await GoogleSignin.hasPlayServices();
  // const userInfo = await GoogleSignin.signIn();
  // await AsyncStorage.setItem('user', JSON.stringify(userInfo));
  

    const options = {
        scopes: [Scopes.FITNESS_ACTIVITY_READ], // Only read step count
      };
      try {
        const authResult = await GoogleFit.authorize(options)
        console.log('authResult', authResult);
        if (authResult.success) {
            console.log('Authorization successful');
        } else {
            console.log('Authorization denied', authResult.message);
        }
      }
      catch(error) {
        console.log('Authorization error', error);
      };
          
}

interface CompetifiGoogleFitModel {
  date: string;
  steps: number;
}

const getGoogleFitData = async (startDate: string, endDate: string): Promise<CompetifiGoogleFitModel[]> => {
    await authorizeGoogleFitDataFetch();

    const options = {
        startDate: startDate, // Start date in ISO8601 format
        endDate: endDate || new Date().toISOString(), // End date as provided or current time
    };

    console.log('options', options);
  
    try {
        const res = await GoogleFit.getDailyStepCountSamples(options);
        const stepsData = res.find(data => data.source === 'com.google.android.gms');
      
        if (!stepsData || !stepsData.steps) {
          console.log('No steps data found');
          return [];
        }
      
        // Transform the data into CompetifiGoogleFitModel format
        const formattedData: CompetifiGoogleFitModel[] = stepsData.steps.map(item => ({
          date: item.date,
          steps: item.value
        }));
      
        console.log('Formatted steps data:', formattedData);
        return formattedData;
    }
    catch(err) {
        console.warn('Error in fetching step count: ', err);
        return [];
    };
}


export default getGoogleFitData