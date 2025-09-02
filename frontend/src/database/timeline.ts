import {
    Reaction,
    TimelineEntry,
    TimelineGameInfo,
    TimelineGraduationInfo,
} from '@jackstenglein/chess-dojo-common/src/database/timeline';

export type { Reaction, TimelineEntry, TimelineGameInfo, TimelineGraduationInfo };

export enum TimelineSpecialRequirementId {
    GameSubmission = 'GameSubmission',
    Graduation = 'Graduation',
}
