import GoogleFit, { BucketUnit, Scopes } from 'react-native-google-fit';
import { GoogleSignin } from '@react-native-google-signin/google-signin';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { requestPermission, initialize, readRecord, readRecords } from 'react-native-health-connect';

const authorizeGoogleFitDataFetch = async() => {
  // await GoogleSignin.hasPlayServices();
  // const userInfo = await GoogleSignin.signIn();
  // await AsyncStorage.setItem('user', JSON.stringify(userInfo));
  

    const options = {
        scopes: [
          Scopes.FITNESS_ACTIVITY_READ,
          Scopes.FITNESS_ACTIVITY_WRITE
        ], // Only read step count
      };
      try {
        if(GoogleFit.isAuthorized) {
          console.log('GoogleFit is already authorized, re-authorizing...');
          GoogleFit.disconnect();
        }
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

const requestPermissions = () => {
  requestPermission([
    {
      accessType: 'read',
      recordType: 'Steps',
    }
  ]).then((permissions) => {
    console.log('Granted permissions ', { permissions });
  });
};
const readSampleDataSingle = () => {
  initialize();
  requestPermissions();

  // readRecord(
  //   'Steps',
  //   'a7bdea65-86ce-4eb2-a9ef-a87e6a7d9df2'
  // ).then((result) => {
  //   console.log('Retrieved record: ', JSON.stringify({ result }, null, 2));
  // });
};

const getGoogleFitData = async (startDate: string, endDate: string): Promise<CompetifiGoogleFitModel[]> => {
    // readSampleDataSingle();
    // console.log('Reading records: ');
    // const { records } = await readRecords('Steps', {
    //   timeRangeFilter: {
    //     operator: 'between',
    //     startTime: '2024-11-09T12:00:00.405Z',
    //     endTime: '2025-03-14T23:53:15.405Z',
    //   },
    // });
    // console.log('records', records);
    // let steps = await readRecord('Steps', 'a7bdea65-86ce-4eb2-a9ef-a87e6a7d9df2');
    // console.log('steps', steps);
    // readSampleDataSingle();

        // Transform the data into CompetifiGoogleFitModel format
        // const formattedData: CompetifiGoogleFitModel[] = [];
        // return formattedData;


    await authorizeGoogleFitDataFetch();
    const options = {
        startDate: startDate, // Start date in ISO8601 format
        endDate: endDate || new Date().toISOString(), // End date as provided or current time
    };
    const opt = {
      startDate: "2025-03-01T00:00:17.971Z", // required ISO8601Timestamp
      endDate: endDate || new Date().toISOString(), // required ISO8601Timestamp
      bucketUnit: BucketUnit.MINUTE, // optional - default "DAY". Valid values: "NANOSECOND" | "MICROSECOND" | "MILLISECOND" | "SECOND" | "MINUTE" | "HOUR" | "DAY"
      bucketInterval: 15, // optional - default 1. 
    };
    console.log('options', opt);
  
    try {
        const res = await GoogleFit.getDailyStepCountSamples(opt);
        // console.log('daily steps count samples', res);
        // const weights = await GoogleFit.getWeightSamples(opt);
        // console.log('daily weight', weights);
        const dailySteps = await GoogleFit.getDailySteps();
        // const r1 = await GoogleFit.startRecording(options);
        console.log('daily steps', dailySteps);
        // const stepsData = dailySteps.find(data => data.source === 'com.google.android.gms:estimated_steps');
        const stepsData = res.find(data => data.source === 'com.google.android.gms:estimated_steps');
      
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