import { ChallengeItem } from "../models/ChallengeItem";

export const getApiBaseUrl = () => {
    let apiUrl = process.env.EXPO_PUBLIC_REST_API_URL;
    console.log('ENV apiUrl: ', apiUrl);
    if (!apiUrl) {
        apiUrl = 'http://localhost:3000';
    }
    return apiUrl;
}

export async function apiPost(apiEndpointUrl: string, requestData: any) {
    const url = `${getApiBaseUrl()}/${apiEndpointUrl}`;
    console.log('apiPost url', url);
    console.log('apiPost data', JSON.stringify(requestData));
    return await fetch(url, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestData)
    });
}

export async function apiGet(apiEndpointUrl: string, isTestMode: boolean = false) {
    if(isTestMode) {
        return new Promise((resolve, reject) => {
            setTimeout(() => {
                resolve(getDummyChallenges())
            }, 1000)
        }) 
    }
    const url = `${getApiBaseUrl()}/${apiEndpointUrl}`;
    console.log('apiGet url', url);
    return await fetch(url, {
        method: 'GET',
        headers: {
            'Content-Type': 'application/json',
        },
    });
}

function getDummyChallenges(): { data: ChallengeItem[] } {
    return {
        data: [
            {
                name: 'Challenge 1',
                startDate: '2023-01-01',
                endDate: '2023-01-31',
                entryFees: 10,
                goalType: 'Steps',
                goalTarget: 5000,
                participants: [
                    { name: 'Participant 1', steps: 1000 },
                    { name: 'Participant 2', steps: 1200 },
                    { name: 'Participant 3', steps: 1500 },
                ],
            },
            {
                name: 'Challenge 2',
                startDate: '2023-02-01',
                endDate: '2023-02-28',
                entryFees: 15,
                goalType: 'Cycling',
                goalTarget: 50,
                participants: [
                    { name: 'Participant 4', steps: 1100 },
                    { name: 'Participant 5', steps: 1300 },
                    { name: 'Participant 6', steps: 1400 },
                ],
            }
        ]
    } 
}