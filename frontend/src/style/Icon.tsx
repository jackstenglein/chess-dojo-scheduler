import {
    AllInclusive,
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
    HealthAndSafety,
    LiveTv,
    LocationOn,
    MenuBook,
    MilitaryTech,
    PeopleOutline,
    Person,
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
    Login,
    Notes,
    PersonOutline
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
    'Opening Sparring': CrisisAlert,
    'Middlegame Sparring': MenuBook,
    'Endgame Sparring': SportsScore,
    'Analyze Classic Game': Science,
    'Analyze Own Game': Biotech,
    'Book Study': AutoStories,
    'Rook Endgame Progression': HealthAndSafety,
    reset: RestartAlt,
    cancel: DoDisturb,
    save: Save,
    location: LocationOn,
    write: Create,
    join: Login,
    notes: Notes,
    participant: PersonOutline
};

export const Icon: React.FC<SvgIconProps> = ({ name, ...props }) => {
    if (!name || !icons[name]) {
        return null;
    }

    const InternalIcon = icons[name];
    return <InternalIcon {...props} />;
};

export default Icon;
