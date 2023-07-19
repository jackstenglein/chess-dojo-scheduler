export enum TournamentType {
    Swiss = 'SWISS',
    Arena = 'ARENA',
}

export interface Tournament {
    type: TournamentType;
    startsAt: string;
    id: string;
    name: string;
    description: string;
    rated: boolean;
    limitSeconds: number;
    incrementSeconds: number;
    fen?: string;
    url: string;
    lengthMinutes?: number;
    numRounds?: number;
}
