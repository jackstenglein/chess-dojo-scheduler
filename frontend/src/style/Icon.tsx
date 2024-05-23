import {
    AllInclusiveRounded,
    AutoStories,
    Backup,
    Biotech,
    BorderColor,
    Create,
    CrisisAlert,
    DoDisturb,
    Download,
    EditCalendar,
    Event,
    EventAvailable,
    Explore,
    FlashOn,
    Group,
    Groups,
    LiveTv,
    LocationOn,
    Login,
    MenuBook,
    MilitaryTech,
    Notes,
    PeopleOutline,
    Person,
    PersonOutline,
    PunchClock,
    QueryBuilder,
    RestartAlt,
    RocketLaunch,
    Save,
    Science,
    Search,
    Speed,
    SportsScore,
    ThumbUp,
    Visibility,
    WavingHand,
    Whatshot,
} from '@mui/icons-material';
import { SvgIconProps } from '@mui/material';
import React from 'react';
import { AvailabilityType } from '../database/event';
import { RequirementCategory } from '../database/requirement';
import { RookIcon } from './ChessIcons';

export const icons = {
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
    'All Categories': AllInclusiveRounded,
    clubs: Groups,
    search: Search,
    explore: Explore,
    cohort: Group,
    player: Person,
    upload: Backup,
    line: PeopleOutline,
    download: Download,
    eye: Visibility,
    clock: QueryBuilder,
    eventCheck: EventAvailable,
    liga: MilitaryTech,
    meet: Event,
    all: AllInclusiveRounded,
    'All Types': AllInclusiveRounded,
    Blitz: Whatshot,
    Rapid: FlashOn,
    Classical: PunchClock,
    'Classical Game': PunchClock,
    'Dojo Events': LiveTv,
    'Coaching Sessions': RocketLaunch,
    avilb: EditCalendar,
    [AvailabilityType.AllTypes]: AllInclusiveRounded,
    [AvailabilityType.ClassicalGame]: PunchClock,
    [AvailabilityType.OpeningSparring]: CrisisAlert,
    [AvailabilityType.MiddlegameSparring]: MenuBook,
    [AvailabilityType.EndgameSparring]: SportsScore,
    [AvailabilityType.RookEndgameProgression]: RookIcon,
    [AvailabilityType.ClassicAnalysis]: Science,
    [AvailabilityType.AnalyzeOwnGame]: Biotech,
    [AvailabilityType.BookStudy]: AutoStories,
    'Opening Sparring': CrisisAlert,
    'Middlegame Sparring': MenuBook,
    'Endgame Sparring': SportsScore,
    'Analyze Classic Game': Science,
    'Analyze Own Game': Biotech,
    'Book Study': AutoStories,
    'Rook Endgame Progression': RookIcon,
    reset: RestartAlt,
    cancel: DoDisturb,
    save: Save,
    location: LocationOn,
    write: Create,
    join: Login,
    notes: Notes,
    participant: PersonOutline,
};

export interface IconProps extends SvgIconProps {
    name: keyof typeof icons | '';
}

export const Icon: React.FC<IconProps> = ({ name, ...props }) => {
    if (!name || !icons[name]) {
        return null;
    }

    const InternalIcon = icons[name];
    return <InternalIcon {...props} />;
};

export default Icon;
