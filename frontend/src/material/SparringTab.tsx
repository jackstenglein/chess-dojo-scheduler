import {
    Box,
    Collapse,
    Divider,
    Grid,
    IconButton,
    Stack,
    Typography,
} from '@mui/material';
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown';
import KeyboardArrowUpIcon from '@mui/icons-material/KeyboardArrowUp';

import React, { useMemo, useState } from 'react';
import { RequestSnackbar } from '../api/Request';
import { useRequirements } from '../api/cache/requirements';
import { ALL_COHORTS, dojoCohorts } from '../database/user';
import LoadingPage from '../loading/LoadingPage';
import { Requirement } from '../database/requirement';
import Position from '../requirements/Position';

interface SparringRequirementProps {
    requirement: Requirement;
    forceExpanded?: boolean;
    stacked?: boolean;
}

const SparringRequirement: React.FC<SparringRequirementProps> = ({
    requirement,
    forceExpanded,
    stacked,
}) => {
    const [open, setOpen] = useState(false);
    const toggleOpen = () => {
        setOpen(!open);
    };

    if (!requirement.positions) {
        return null;
    }

    if (!forceExpanded && requirement.positions.length > 1) {
        return (
            <Box>
                <Stack direction='row' alignItems='center'>
                    <IconButton size='small' onClick={toggleOpen}>
                        {open ? <KeyboardArrowUpIcon /> : <KeyboardArrowDownIcon />}
                    </IconButton>
                    <Typography
                        variant='subtitle1'
                        fontWeight='bold'
                        color='text.secondary'
                        onClick={toggleOpen}
                        sx={{ cursor: 'pointer' }}
                    >
                        {requirement.name}
                    </Typography>
                </Stack>

                <Collapse in={open} timeout='auto' unmountOnExit>
                    <Grid container spacing={2}>
                        {requirement.positions.map((p) => (
                            <Grid item xs='auto' key={p.fen}>
                                <Position position={p} />
                            </Grid>
                        ))}
                    </Grid>
                </Collapse>
            </Box>
        );
    }

    if (stacked) {
        return (
            <Grid container spacing={2}>
                {requirement.positions.map((p) => (
                    <Grid item xs='auto' key={p.fen}>
                        <Position position={p} />
                    </Grid>
                ))}
            </Grid>
        );
    }

    return (
        <>
            {requirement.positions.map((p) => (
                <Grid item xs='auto' key={p.fen}>
                    <Position position={p} />
                </Grid>
            ))}
        </>
    );
};

interface SparringSubsectionProps {
    subsection: Subsection;
}

const SparringSubsection: React.FC<SparringSubsectionProps> = ({ subsection }) => {
    const [open, setOpen] = useState(false);

    const toggleOpen = () => {
        setOpen(!open);
    };

    return (
        <Box>
            <Stack direction='row' alignItems='center'>
                <IconButton size='small' onClick={toggleOpen}>
                    {open ? <KeyboardArrowUpIcon /> : <KeyboardArrowDownIcon />}
                </IconButton>
                <Typography
                    variant='subtitle1'
                    fontWeight='bold'
                    color='text.secondary'
                    onClick={toggleOpen}
                    sx={{ cursor: 'pointer' }}
                >
                    {subsection.name}
                </Typography>
            </Stack>

            <Collapse in={open} timeout='auto' unmountOnExit>
                {subsection.stacked ? (
                    <Stack pl={{ xs: 0, sm: 2 }} spacing={1}>
                        {subsection.requirements.map((r) => (
                            <SparringRequirement key={r.id} requirement={r} stacked />
                        ))}
                    </Stack>
                ) : (
                    <Grid container spacing={2}>
                        {subsection.requirements.map((r) => (
                            <SparringRequirement
                                key={r.id}
                                requirement={r}
                                forceExpanded={subsection.requirements.length === 1}
                            />
                        ))}
                    </Grid>
                )}
            </Collapse>
        </Box>
    );
};

interface SparringSectionProps {
    section: Section;
}

const SparringSection: React.FC<SparringSectionProps> = ({ section }) => {
    const [open, setOpen] = useState(false);
    const toggleOpen = () => {
        setOpen(!open);
    };

    return (
        <Box>
            <Stack direction='row' alignItems='center'>
                <IconButton size='small' onClick={toggleOpen}>
                    {open ? <KeyboardArrowUpIcon /> : <KeyboardArrowDownIcon />}
                </IconButton>
                <Typography variant='h6' onClick={toggleOpen} sx={{ cursor: 'pointer' }}>
                    {section.name}
                </Typography>
            </Stack>
            <Divider />

            <Collapse in={open} timeout='auto' unmountOnExit>
                <Stack spacing={2}>
                    {section.subsections.map((subsection) => {
                        if (subsection.requirements.length === 0) {
                            return null;
                        }

                        return (
                            <SparringSubsection
                                key={subsection.name}
                                subsection={subsection}
                            />
                        );
                    })}
                </Stack>
            </Collapse>
        </Box>
    );
};

interface Subsection {
    name: string;
    requirements: Requirement[];
    stacked?: boolean;
}

interface Section {
    name: string;
    subsections: Subsection[];
}

const sectionData = [
    {
        title: 'Middlegame Win Conversions',
        selector: (r: Requirement) =>
            r.category === 'Middlegames + Strategy' &&
            r.name.startsWith('Win Conversion'),
    },
    {
        title: 'Middlegame Sparring',
        selector: (r: Requirement) =>
            r.category === 'Middlegames + Strategy' &&
            r.name.startsWith('Middlegame Sparring'),
    },
    {
        title: 'Endgame Algorithms',
        stacked: true,
        selector: (r: Requirement) =>
            r.category === 'Endgame' && r.name.startsWith('Algorithm'),
    },
    {
        title: 'Endgame Win Conversions',
        selector: (r: Requirement) =>
            r.category === 'Endgame' && r.name.startsWith('Win Conversion'),
    },
    {
        title: 'Endgame Positional Sparring',
        selector: (r: Requirement) =>
            r.category === 'Endgame' && r.name.startsWith('Positional Sparring'),
    },
    {
        title: 'Rook Endgame Progression',
        subsections: [
            {
                title: 'Match #1',
                selector: (r: Requirement) =>
                    r.category === 'Endgame' && r.name === 'REP Match #1',
            },
            {
                title: 'Match #2',
                selector: (r: Requirement) =>
                    r.category === 'Endgame' && r.name === 'REP Match #2',
            },
            {
                title: 'Match #3',
                selector: (r: Requirement) =>
                    r.category === 'Endgame' && r.name === 'REP Match #3',
            },
            {
                title: 'Match #4',
                selector: (r: Requirement) =>
                    r.category === 'Endgame' && r.name === 'REP Match #4',
            },
            {
                title: 'Match #5',
                selector: (r: Requirement) =>
                    r.category === 'Endgame' && r.name === 'REP Match #5',
            },
        ],
    },
];

const SparringTab = () => {
    const { requirements, request } = useRequirements(ALL_COHORTS, true);

    const sections = useMemo(() => {
        const sections = [];
        for (const datum of sectionData) {
            const section: Section = {
                name: datum.title,
                subsections: [],
            };
            if (datum.subsections) {
                section.subsections = datum.subsections.map((s) => ({
                    name: s.title,
                    requirements: requirements.filter(s.selector),
                }));
            } else {
                section.subsections = dojoCohorts.map((cohort) => ({
                    name: cohort,
                    stacked: datum.stacked,
                    requirements: requirements.filter(
                        (r) => datum.selector(r) && r.counts[cohort]
                    ),
                }));
            }
            sections.push(section);
        }
        return sections;
    }, [requirements]);

    if (request.isLoading()) {
        return <LoadingPage />;
    }

    return (
        <Stack spacing={4}>
            <RequestSnackbar request={request} />

            {sections.map((s) => (
                <SparringSection key={s.name} section={s} />
            ))}
        </Stack>
    );
};

export default SparringTab;
