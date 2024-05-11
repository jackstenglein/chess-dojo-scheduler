import {
    AllInclusive,
    Biotech,
    BorderColor,
    CrisisAlert,
    Groups,
    LiveTv,
    MenuBook,
    Speed,
    SportsScore,
    ThumbUp,
    WavingHand,
} from '@mui/icons-material';
import { SvgIconProps } from '@mui/material';
import React from 'react';
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
    followers: ThumbUp,
    'All Categories': AllInclusive,
    clubs: Groups,
};

export const Icon: React.FC<SvgIconProps> = ({ name, ...props }) => {
    if (!name || !icons[name]) {
        return null;
    }

    const InternalIcon = icons[name];
    return <InternalIcon {...props} />;
};

export default Icon;
