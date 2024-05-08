import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import {
    Accordion,
    AccordionDetails,
    AccordionSummary,
    Button,
    Divider,
    Stack,
    Typography,
} from '@mui/material';
import { useMemo } from 'react';
import { useFreeTier } from '../../auth/Auth';
import { CustomTask, Requirement } from '../../database/requirement';
import { User } from '../../database/user';
import { useTutorial } from '../../tutorial/TutorialContext';
import { TutorialName } from '../../tutorial/tutorialNames';
import ProgressItem from './ProgressItem';
import WavingHandIcon from '@mui/icons-material/WavingHand';
import BiotechIcon from '@mui/icons-material/Biotech';
import ExtensionIcon from '@mui/icons-material/Extension';
import CrisisAlertIcon from '@mui/icons-material/CrisisAlert';
import SportsScoreIcon from '@mui/icons-material/SportsScore';
import PawnIcon from '../../navbar/PawnIcon';
import IconComponent from './IconComponent';
import StyleIcon from '@mui/icons-material/Style';

import { OverridableComponent } from '@mui/material/OverridableComponent';

export interface Category {
    name: string;
    requirements: Array<Requirement | CustomTask>;
    totalComplete: number;
    
}

// export const IconMap : Record<string, OverridableComponent<SvgIconTypeMap<{}, "svg">>> = {
//     'Welcome to the Dojo': WavingHandIcon,
//     'Games + Analysis': BiotechIcon,
//     'Tactics': ExtensionIcon,
//     'Middlegames + Strategy': CrisisAlertIcon,
//     'Endgame': SportsScoreIcon,
//     'Opening': StyleIcon,
//     'Non-Dojo': StyleIcon,
// }

interface ProgressCategoryProps {
    c: Category;
    expanded: boolean;
    toggleExpand: (name: string) => void;
    user: User;
    isCurrentUser: boolean;
    cohort: string;
    setShowCustomTaskEditor: (v: boolean) => void;
}

const TutorialProgressCategory: React.FC<ProgressCategoryProps> = (props) => {
    const { tutorialState } = useTutorial();

    const forceExpand = useMemo(() => {
        return tutorialState.activeTutorial === TutorialName.ProfilePage;
    }, [tutorialState.activeTutorial]);

    return (
        <DefaultProgressCategory {...props} expanded={forceExpand || props.expanded} />
    );
};

const DefaultProgressCategory: React.FC<ProgressCategoryProps> = ({
    c,
    expanded,
    toggleExpand,
    user,
    isCurrentUser,
    cohort,
    setShowCustomTaskEditor,
}) => {
    const isFreeTier = useFreeTier();

    const hiddenTaskCount = useMemo(() => {
        if (!isFreeTier) {
            return 0;
        }
        return c.requirements.filter((r) => !r.isFree).length;
    }, [c.requirements, isFreeTier]);

    return (
        <Accordion
            key={c.name}
            expanded={expanded}
            onChange={() => toggleExpand(c.name)}
            sx={{ width: 1 }}
        >
            <AccordionSummary
                expandIcon={<ExpandMoreIcon />}
                aria-controls={`${c.name.replaceAll(' ', '-')}-content`}
                id={`${c.name.replaceAll(' ', '-')}-header`}
            >
                <Stack
                    direction='row'
                    justifyContent='space-between'
                    sx={{ width: 1, mr: 2 }}
                >   
                    <Typography fontWeight='bold'>  <> 
                    
                    <IconComponent iconName={c.name} /> 

                    {c.name}
                    
                    </></Typography>
                    {c.name === 'Non-Dojo' ? (
                        <Typography color='text.secondary'>
                            {c.requirements.length} Activities
                        </Typography>
                    ) : (
                        <Typography color='text.secondary'>
                            {`${c.totalComplete}/${c.requirements.length} Tasks`}
                        </Typography>
                    )}
                </Stack>
            </AccordionSummary>
            <AccordionDetails>
                <Divider />
                {c.requirements.map((r) => {
                    if (isFreeTier && !r.isFree) {
                        return null;
                    }
                    return (
                        <ProgressItem
                            key={r.id}
                            requirement={r}
                            progress={user.progress[r.id]}
                            cohort={cohort}
                            isCurrentUser={isCurrentUser}
                            user={user}
                        />
                    );
                })}

                {!isFreeTier && c.name === 'Non-Dojo' && isCurrentUser && (
                    <Button sx={{ mt: 2 }} onClick={() => setShowCustomTaskEditor(true)}>
                        Add Custom Activity
                    </Button>
                )}

                {isFreeTier && c.name !== 'Non-Dojo' && hiddenTaskCount > 0 && (
                    <Stack mt={2} spacing={2} alignItems='center'>
                        <Typography>
                            Unlock {hiddenTaskCount} more task
                            {hiddenTaskCount > 1 ? 's' : ''} by upgrading to a full
                            account
                        </Typography>
                        <Button variant='outlined' href='/prices'>
                            View Prices
                        </Button>
                    </Stack>
                )}

                {isFreeTier && c.name === 'Non-Dojo' && (
                    <Stack mt={2} spacing={2} alignItems='center'>
                        <Typography>
                            Upgrade to a full account to create your own custom tasks
                        </Typography>
                        <Button variant='outlined' href='/prices'>
                            View Prices
                        </Button>
                    </Stack>
                )}
            </AccordionDetails>
        </Accordion>
    );
};

const ProgressCategory: React.FC<ProgressCategoryProps> = (props) => {
    if (props.c.name === 'Welcome to the Dojo') {
        return <TutorialProgressCategory {...props} />;
    }
    return <DefaultProgressCategory {...props} />;
};

export default ProgressCategory;
