import {
    AllInclusive,
    Biotech,
    BorderColor,
    CrisisAlert,
    LiveTv,
    MenuBook,
    Speed,
    SportsScore,
    ThumbUp,
    WavingHand,
} from '@mui/icons-material';
import { RequirementCategory } from '../database/requirement';

export const icons: Record<string, typeof WavingHand> = {
    [RequirementCategory.Welcome]: WavingHand,
    [RequirementCategory.Games]: Biotech,
    [RequirementCategory.Tactics]: Speed,
    [RequirementCategory.Middlegames]: MenuBook,
    [RequirementCategory.Endgame]: SportsScore,
    [RequirementCategory.Opening]: CrisisAlert,
    [RequirementCategory.NonDojo]: LiveTv,
    Annotations: BorderColor,
    Followers: ThumbUp,
    'All Categories': AllInclusive,
};
