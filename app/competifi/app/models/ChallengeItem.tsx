export interface ChallengeItem {
    name: string;
    startDate: string;
    endDate: string;
    entryFees: number;
    goalType: string;
    goalTarget: number;
    participants: Participant[];
}

export interface Participant {
    name: string;
    steps: number;
}