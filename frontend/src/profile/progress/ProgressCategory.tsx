import { ProgressText } from '@/scoreboard/ScoreboardProgress';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import {
    Accordion,
    AccordionDetails,
    AccordionSummary,
    Button,
    Divider,
    Stack,
    SvgIconOwnProps,
    Typography,
} from '@mui/material';
import { useMemo } from 'react';
import { useFreeTier } from '../../auth/Auth';
import { CustomTask, Requirement, RequirementCategory } from '../../database/requirement';
import { User } from '../../database/user';
import Icon from '../../style/Icon';
import ProgressItem from './ProgressItem';

export interface Category {
    name: RequirementCategory;
    requirements: (Requirement | CustomTask)[];
    totalComplete: number;
    totalRequirements: number;
}

interface ProgressCategoryProps {
    c: Category;
    expanded: boolean;
    toggleExpand: (name: string) => void;
    user: User;
    isCurrentUser: boolean;
    cohort: string;
    setShowCustomTaskEditor: (v: boolean) => void;
    color?: SvgIconOwnProps['color'];
}

const ProgressCategory: React.FC<ProgressCategoryProps> = ({
    c,
    expanded,
    toggleExpand,
    user,
    isCurrentUser,
    cohort,
    setShowCustomTaskEditor,
    color,
}) => {
    const isFreeTier = useFreeTier();

    const hiddenTaskCount = useMemo(() => {
        if (!isFreeTier) {
            return 0;
        }
        return c.requirements.filter((r) => !r.isFree).length;
    }, [c.requirements, isFreeTier]);

    if (!color) {
        color = 'primary';
    }

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
                    alignItems='center'
                    flexWrap='wrap'
                    columnGap='1rem'
                    rowGap={0.5}
                    sx={{ width: 1, mr: 2 }}
                >
                    <Typography fontWeight='bold'>
                        <Icon
                            name={c.name}
                            color={color}
                            sx={{ marginRight: '0.6rem', verticalAlign: 'middle' }}
                        />
                        {c.name}
                    </Typography>
                    {c.name === 'Non-Dojo' ? (
                        <ProgressText label={`${c.requirements.length} Activities`} />
                    ) : (
                        <ProgressText
                            value={c.totalComplete}
                            max={c.totalRequirements}
                            min={0}
                            suffix='Tasks'
                        />
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

export default ProgressCategory;
