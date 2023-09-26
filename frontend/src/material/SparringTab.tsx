import {
    Box,
    Button,
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
import { useFreeTier } from '../auth/Auth';

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

                        {subsection.hidden > 0 && (
                            <Grid item xs='auto'>
                                <Stack
                                    data-cy='upsell-message'
                                    px={1}
                                    mt={2}
                                    spacing={2}
                                    alignItems='center'
                                    justifyContent='center'
                                    height={1}
                                >
                                    <Typography textAlign='center'>
                                        Unlock {subsection.hidden} more position
                                        {subsection.hidden > 1 ? 's' : ''} by upgrading to
                                        a full account
                                    </Typography>
                                    <Button
                                        variant='outlined'
                                        href='https://www.chessdojo.club/plans-pricing'
                                        target='_blank'
                                        rel='noopener'
                                    >
                                        View Prices
                                    </Button>
                                </Stack>
                            </Grid>
                        )}
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
    hidden: number;
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
        title: 'Endgame Sparring',
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
    const isFreeTier = useFreeTier();

    const sections = useMemo(() => {
        const sections = [];
        for (const datum of sectionData) {
            const section: Section = {
                name: datum.title,
                subsections: [],
            };
            if (datum.subsections) {
                section.subsections = datum.subsections.map((s) => {
                    let reqs = requirements.filter(s.selector);
                    const originalCount = reqs.length;
                    if (isFreeTier) {
                        reqs = reqs.filter((r) => r.isFree);
                    }

                    return {
                        name: s.title,
                        requirements: reqs,
                        hidden: originalCount - reqs.length,
                    };
                });
            } else {
                section.subsections = dojoCohorts.map((cohort) => {
                    let reqs = requirements.filter(
                        (r) => datum.selector(r) && r.counts[cohort]
                    );
                    const originalCount = reqs.length;
                    if (isFreeTier) {
                        reqs = reqs.filter((r) => r.isFree);
                    }

                    return {
                        name: cohort,
                        stacked: datum.stacked,
                        requirements: reqs,
                        hidden: originalCount - reqs.length,
                    };
                });
            }
            sections.push(section);
        }
        return sections;
    }, [requirements, isFreeTier]);

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
