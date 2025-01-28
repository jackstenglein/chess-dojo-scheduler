import { useFreeTier } from '@/auth/Auth';
import {
    CustomTask,
    CustomTaskCategory,
    isCustomTaskCategory,
    isRequirement,
    Requirement,
    RequirementCategory,
} from '@/database/requirement';
import { User } from '@/database/user';
import CustomTaskEditor from '@/profile/progress/CustomTaskEditor';
import ProgressItem from '@/profile/progress/ProgressItem';
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
import { useMemo, useState } from 'react';
import { TrainingPlanIcon } from './TrainingPlanCategory';

/** A section in the training plan view. */
export interface Section {
    /** The category of the section. */
    category: RequirementCategory;
    /** The tasks to display in the section. */
    tasks: (Requirement | CustomTask)[];
    /** The number of complete tasks in the section. */
    complete: number;
    /** The total number of tasks in the section. */
    total: number;
    /** The color of the icon in the section header. */
    color?: SvgIconOwnProps['color'];
}

interface TrainingPlanSectionProps {
    /** The section of the training plan to render. */
    section: Section;
    /** Whether the section is expanded. */
    expanded?: boolean;
    /** A callback invoked when the section expansion is toggled. */
    toggleExpand: (category: RequirementCategory) => void;
    /** The user whose training plan is being displayed. */
    user: User;
    /** Whether the user being displayed is the current authenticated user. */
    isCurrentUser: boolean;
    /** The cohort being displayed. */
    cohort: string;
    /** A callback invoked when the user toggles a pinned task. */
    togglePin: (req: Requirement | CustomTask) => void;
    /** The set of pinned tasks. */
    pinnedTasks: (Requirement | CustomTask)[];
}

export function TrainingPlanSection({
    section,
    expanded,
    toggleExpand,
    user,
    isCurrentUser,
    cohort,
    togglePin,
    pinnedTasks,
}: TrainingPlanSectionProps) {
    const isFreeTier = useFreeTier();
    const [showCustomTaskEditor, setShowCustomTaskEditor] = useState(false);

    const hiddenTaskCount = useMemo(() => {
        if (!isFreeTier) {
            return 0;
        }
        return section.tasks.filter((r) => isRequirement(r) && !r.isFree).length;
    }, [section.tasks, isFreeTier]);

    return (
        <Accordion
            key={section.category}
            expanded={expanded}
            onChange={() => toggleExpand(section.category)}
            sx={{ width: 1 }}
        >
            <AccordionSummary
                expandIcon={<ExpandMoreIcon />}
                aria-controls={`${section.category.replaceAll(' ', '-')}-content`}
                id={`${section.category.replaceAll(' ', '-')}-header`}
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
                        <TrainingPlanIcon
                            category={section.category}
                            color={section.color || 'primary'}
                            sx={{ marginRight: '0.6rem', verticalAlign: 'middle' }}
                        />
                        {section.category}
                    </Typography>
                    <ProgressText
                        value={section.complete}
                        max={section.total}
                        min={0}
                        suffix='Tasks'
                    />
                </Stack>
            </AccordionSummary>
            <AccordionDetails data-cy={`progress-category-${section.category}`}>
                <Divider />
                {section.tasks.map((r) => {
                    if (isFreeTier && isRequirement(r) && !r.isFree) {
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
                            togglePin={togglePin}
                            isPinned={pinnedTasks.some((t) => t.id === r.id)}
                        />
                    );
                })}

                {!isFreeTier &&
                    isCustomTaskCategory(section.category) &&
                    isCurrentUser && (
                        <Button
                            sx={{ mt: 2 }}
                            onClick={() => setShowCustomTaskEditor(true)}
                        >
                            Add Custom Task
                        </Button>
                    )}

                {isFreeTier &&
                    section.category !== RequirementCategory.NonDojo &&
                    hiddenTaskCount > 0 && (
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
            </AccordionDetails>

            <CustomTaskEditor
                open={showCustomTaskEditor}
                onClose={() => setShowCustomTaskEditor(false)}
                initialCategory={section.category as unknown as CustomTaskCategory}
            />
        </Accordion>
    );
}
