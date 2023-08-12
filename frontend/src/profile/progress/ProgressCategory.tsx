import {
    Accordion,
    AccordionDetails,
    AccordionSummary,
    Button,
    Divider,
    Stack,
    Typography,
} from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';

import ProgressItem from './ProgressItem';
import { CustomTask, Requirement } from '../../database/requirement';
import { User } from '../../database/user';
import { useTutorial } from '../../tutorial/TutorialContext';

export interface Category {
    name: string;
    requirements: Array<Requirement | CustomTask>;
    totalComplete: number;
}

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
    const { setTutorialState } = useTutorial();

    const handleExpand = () => {
        props.toggleExpand(props.c.name);
        setTutorialState((s) => {
            return { ...s, nextDisabled: false };
        });
    };

    return <DefaultProgressCategory {...props} toggleExpand={handleExpand} />;
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
                    <Typography fontWeight='bold'>{c.name}</Typography>
                    {c.name === 'Non-Dojo' ? (
                        <Typography color='text.secondary'>
                            {c.requirements.length} activities
                        </Typography>
                    ) : (
                        <Typography color='text.secondary'>
                            {`${c.totalComplete}/${c.requirements.length} steps`}
                        </Typography>
                    )}
                </Stack>
            </AccordionSummary>
            <AccordionDetails>
                <Divider />
                {c.requirements.map((r) => (
                    <ProgressItem
                        key={r.id}
                        requirement={r}
                        progress={user.progress[r.id]}
                        cohort={cohort}
                        isCurrentUser={isCurrentUser}
                    />
                ))}
                {c.name === 'Non-Dojo' && isCurrentUser && (
                    <Button sx={{ mt: 2 }} onClick={() => setShowCustomTaskEditor(true)}>
                        Add Custom Activity
                    </Button>
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
