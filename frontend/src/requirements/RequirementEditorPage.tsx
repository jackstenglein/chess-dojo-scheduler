import {
    Alert,
    Button,
    Container,
    Divider,
    IconButton,
    MenuItem,
    Stack,
    TextField,
    Typography,
} from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useRequirement } from '../api/cache/requirements';
import { useAuth } from '../auth/Auth';
import { RequirementStatus, ScoreboardDisplay } from '../database/requirement';
import NotFoundPage from '../NotFoundPage';
import RequirementDisplay from './RequirementDisplay';
import { compareCohorts, dojoCohorts } from '../database/user';
import { useApi } from '../api/Api';
import { useCache } from '../api/cache/Cache';
import { RequestSnackbar, useRequest } from '../api/Request';
import { LoadingButton } from '@mui/lab';

const vimeoRegex = /^https:\/\/player.vimeo.com\/video\/\d*$/;
const youtubeRegex = /^https:\/\/www.youtube.com\/embed\/[a-zA-Z0-9-]*$/;
const videoUrlError =
    'URL must match the form https://player.vimeo.com/video/123456789 or https://www.youtube.com/embed/abcd1234';

const positionRegex = /^\/\/www.chess.com\/emboard\?id=\d*$/;
const positionUrlError = 'URL must match the form //www.chess.com/emboard?id=12345678';

const categories = [
    'Welcome to the Dojo',
    'Games + Analysis',
    'Tactics',
    'Middlegames + Strategy',
    'Endgame',
    'Opening',
];

interface EditorCount {
    cohort: string;
    count: string;
}

function getEditorCounts(
    counts:
        | {
              [cohort: string]: number;
          }
        | undefined
): EditorCount[] {
    if (counts === undefined) {
        return [];
    }
    return Object.entries(counts)
        .map(([cohort, count]) => ({
            cohort,
            count: `${count}`,
        }))
        .sort((lhs, rhs) => compareCohorts(lhs.cohort, rhs.cohort));
}

interface RequirementEditorErrors {
    category?: string;
    name?: string;
    description?: string;
    numberOfCohorts?: string;
    unitScore?: string;
    totalScore?: string;
    startCount?: string;
    counts?: {
        [idx: number]: string;
    };
    videoUrls?: {
        [idx: number]: string;
    };
    positionUrls?: {
        [idx: number]: string;
    };
    scoreboardDisplay?: string;
    sortPriority?: string;
}

type RequirementEditorErrorsMapKey = 'counts' | 'videoUrls' | 'positionUrls';

function addMapError(
    errors: RequirementEditorErrors,
    key: RequirementEditorErrorsMapKey,
    idx: number,
    value: string
) {
    const map = errors[key];
    if (map) {
        map[idx] = value;
    } else {
        errors[key] = {
            [idx]: value,
        };
    }
}

type RequirementEditorPageProps = {
    id: string;
};

const RequirementEditorPage = () => {
    const { id } = useParams<RequirementEditorPageProps>();
    const { requirement } = useRequirement(id);
    const user = useAuth().user!;
    const navigate = useNavigate();
    const api = useApi();
    const cache = useCache();
    const request = useRequest();

    const isNew = id === undefined;

    const [category, setCategory] = useState(requirement?.category ?? '');
    const [name, setName] = useState(requirement?.name ?? '');
    const [description, setDescription] = useState(requirement?.description ?? '');
    const [counts, setCounts] = useState(getEditorCounts(requirement?.counts));
    const [numberOfCohorts, setNumberOfCohorts] = useState(
        `${requirement?.numberOfCohorts ?? 1}`
    );
    const [unitScore, setUnitScore] = useState(`${requirement?.unitScore ?? 0}`);
    const [totalScore, setTotalScore] = useState(`${requirement?.totalScore ?? 0}`);
    const [startCount, setStartCount] = useState(`${requirement?.startCount ?? 0}`);
    const [videoUrls, setVideoUrls] = useState(requirement?.videoUrls ?? []);
    const [positionUrls, setPositionUrls] = useState(requirement?.positionUrls ?? []);
    const [scoreboardDisplay, setScoreboardDisplay] = useState(
        requirement?.scoreboardDisplay ?? ScoreboardDisplay.Unspecified
    );
    const [sortPriority, setSortPriority] = useState(requirement?.sortPriority ?? '');

    const [errors, setErrors] = useState<RequirementEditorErrors>({});
    const [showPreview, setShowPreview] = useState(false);

    useEffect(() => {
        if (requirement) {
            setCategory(requirement.category);
            setName(requirement.name);
            setDescription(requirement.description);
            setCounts(getEditorCounts(requirement.counts));
            setNumberOfCohorts(`${requirement.numberOfCohorts}`);
            setUnitScore(`${requirement.unitScore}`);
            setTotalScore(`${requirement.totalScore}`);
            setStartCount(`${requirement.startCount}`);
            setVideoUrls(requirement.videoUrls ?? []);
            setPositionUrls(requirement.positionUrls ?? []);
            setScoreboardDisplay(requirement.scoreboardDisplay);
            setSortPriority(requirement.sortPriority);
        }
    }, [requirement]);

    if (!user.isAdmin) {
        return <NotFoundPage />;
    }

    const newCounts = counts.reduce((map, curr) => {
        map[curr.cohort] = parseInt(curr.count) || 0;
        return map;
    }, {} as { [cohort: string]: number });

    const newRequirement = {
        ...requirement,
        status: RequirementStatus.Active,
        id: requirement?.id || '',
        category,
        name,
        description,
        counts: newCounts,
        numberOfCohorts: parseInt(numberOfCohorts),
        unitScore: parseFloat(unitScore),
        unitScoreOverride: requirement?.unitScoreOverride ?? {},
        totalScore: parseFloat(totalScore),
        startCount: parseInt(startCount),
        videoUrls,
        positionUrls,
        scoreboardDisplay,
        sortPriority,
        progressBarSuffix: requirement?.progressBarSuffix ?? '',
        updatedAt: 'now',
    };

    const onSave = () => {
        let errors: RequirementEditorErrors = {};
        if (newRequirement.category === '') {
            errors.category = 'This field is required';
        }
        if (newRequirement.name === '') {
            errors.name = 'This field is required';
        }
        if (newRequirement.description === '') {
            errors.description = 'This field is required';
        }
        if (
            newRequirement.numberOfCohorts !== -1 &&
            newRequirement.numberOfCohorts <= 0
        ) {
            errors.numberOfCohorts = 'Only positive integers or -1 are allowed';
        }
        if (newRequirement.scoreboardDisplay === ScoreboardDisplay.Unspecified) {
            errors.scoreboardDisplay = 'This field is required';
        }
        if (newRequirement.sortPriority === '') {
            errors.sortPriority = 'This field is required';
        }

        if (counts.length === 0) {
            errors.counts = {
                [-1]: 'At least one cohort is required',
            };
        }

        counts.reduce((map, curr, idx) => {
            if (curr.cohort === '') {
                addMapError(errors, 'counts', idx, 'This field is required');
            } else if (map[curr.cohort]) {
                addMapError(errors, 'counts', idx, 'Duplicated cohort');
            } else {
                const count = parseInt(curr.count) || 0;
                if (count <= 0) {
                    addMapError(errors, 'counts', idx, 'A positive integer is required');
                }
            }
            map[curr.cohort] = parseInt(curr.count);
            return map;
        }, {} as { [cohort: string]: number });

        for (let i = 0; i < videoUrls.length; i++) {
            const url = videoUrls[i];
            if (!vimeoRegex.test(url) && !youtubeRegex.test(url)) {
                addMapError(errors, 'videoUrls', i, videoUrlError);
            }
        }

        for (let i = 0; i < positionUrls.length; i++) {
            const url = positionUrls[i];
            if (!positionRegex.test(url)) {
                addMapError(errors, 'positionUrls', i, positionUrlError);
            }
        }

        setErrors(errors);
        if (Object.entries(errors).length > 0) {
            return;
        }

        request.onStart();
        api.setRequirement(newRequirement)
            .then((response) => {
                cache.requirements.put(response.data);
                if (isNew) {
                    navigate(`/requirements/${response.data.id}`);
                } else {
                    navigate(-1);
                }
            })
            .catch((err) => {
                console.error('setRequirement: ', err);
                request.onFailure(err);
            });
    };

    const onAddCount = () => {
        setCounts(counts.concat({ cohort: '', count: '' }));
    };

    const onDeleteCount = (idx: number) => {
        setCounts([...counts.slice(0, idx), ...counts.slice(idx + 1)]);
    };

    const onUpdateCountCohort = (idx: number, cohort: string) => {
        setCounts([
            ...counts.slice(0, idx),
            { ...counts[idx], cohort },
            ...counts.slice(idx + 1),
        ]);
    };

    const onUpdateCountValue = (idx: number, value: string) => {
        setCounts([
            ...counts.slice(0, idx),
            { ...counts[idx], count: value },
            ...counts.slice(idx + 1),
        ]);
    };

    const onAddVideo = () => {
        setVideoUrls(videoUrls.concat(''));
    };

    const onDeleteVideo = (idx: number) => {
        setVideoUrls([...videoUrls.slice(0, idx), ...videoUrls.slice(idx + 1)]);
    };

    const updateVideoUrl = (idx: number, value: string) => {
        setVideoUrls([...videoUrls.slice(0, idx), value, ...videoUrls.slice(idx + 1)]);
    };

    const onAddPosition = () => {
        setPositionUrls(positionUrls.concat(''));
    };

    const onDeletePosition = (idx: number) => {
        setPositionUrls([...positionUrls.slice(0, idx), ...positionUrls.slice(idx + 1)]);
    };

    const updatePositionUrl = (idx: number, value: string) => {
        setPositionUrls([
            ...positionUrls.slice(0, idx),
            value,
            ...positionUrls.slice(idx + 1),
        ]);
    };

    return (
        <Container maxWidth='md' sx={{ pt: 6, pb: 6 }}>
            {Object.entries(errors).length > 0 && (
                <Alert severity='error' sx={{ mb: 4 }}>
                    Please fix the errors below and then save again
                </Alert>
            )}
            <RequestSnackbar request={request} />

            <Stack direction='row' justifyContent='space-between'>
                <Typography variant='h4'>
                    {isNew ? 'Create' : 'Edit'} Requirement
                </Typography>
                <Stack direction='row' spacing={2}>
                    <Button
                        variant='contained'
                        onClick={() => setShowPreview(!showPreview)}
                        disabled={request.isLoading()}
                    >
                        {showPreview ? 'Hide Preview' : 'Show Preview'}
                    </Button>
                    <LoadingButton
                        variant='contained'
                        onClick={onSave}
                        loading={request.isLoading()}
                    >
                        Save
                    </LoadingButton>

                    <Button
                        variant='contained'
                        color='error'
                        onClick={() => navigate(-1)}
                        disabled={request.isLoading()}
                    >
                        Cancel
                    </Button>
                </Stack>
            </Stack>

            {!showPreview && (
                <Stack pt={5} spacing={4}>
                    <TextField
                        select
                        required
                        label='Category'
                        value={category}
                        onChange={(event) => setCategory(event.target.value)}
                        error={!!errors.category}
                        helperText={errors.category}
                    >
                        {categories.map((c) => (
                            <MenuItem key={c} value={c}>
                                {c}
                            </MenuItem>
                        ))}
                    </TextField>

                    <TextField
                        required
                        label='Name'
                        value={name}
                        onChange={(event) => setName(event.target.value)}
                        error={!!errors.name}
                        helperText={errors.name}
                    />

                    <TextField
                        required
                        multiline
                        minRows={3}
                        label='Description'
                        value={description}
                        onChange={(event) => setDescription(event.target.value)}
                        error={!!errors.description}
                        helperText={errors.description}
                    />

                    <TextField
                        select
                        required
                        label='Scoreboard Display'
                        value={scoreboardDisplay}
                        onChange={(event) =>
                            setScoreboardDisplay(event.target.value as ScoreboardDisplay)
                        }
                        error={!!errors.scoreboardDisplay}
                        helperText={errors.scoreboardDisplay}
                    >
                        <MenuItem value={ScoreboardDisplay.Hidden}>
                            Hidden (requirement will appear only on profile)
                        </MenuItem>
                        <MenuItem value={ScoreboardDisplay.Checkbox}>Checkbox</MenuItem>
                        <MenuItem value={ScoreboardDisplay.ProgressBar}>
                            Progress Bar
                        </MenuItem>
                    </TextField>

                    <TextField
                        required
                        label='Unit Score'
                        value={unitScore}
                        onChange={(event) => setUnitScore(event.target.value)}
                        error={!!errors.unitScore}
                        helperText='The dojo score received per unit completed'
                    />

                    <TextField
                        required
                        label='Total Score'
                        value={totalScore}
                        onChange={(event) => setTotalScore(event.target.value)}
                        error={!!errors.totalScore}
                        helperText='The dojo score received only when the requirement is fully complete. Overrides Unit Score if non-zero.'
                    />

                    <TextField
                        required
                        label='Start Count'
                        value={startCount}
                        onChange={(event) => setStartCount(event.target.value)}
                        error={!!errors.startCount}
                        helperText='The starting count applied to all cohorts. For example, Polgar M2s start at 306 instead of 0.'
                    />

                    <TextField
                        required
                        label='Number of Cohorts'
                        value={numberOfCohorts}
                        onChange={(event) => setNumberOfCohorts(event.target.value)}
                        error={!!errors.numberOfCohorts}
                        helperText={errors.numberOfCohorts}
                    />

                    <TextField
                        required
                        label='Sort Priority'
                        value={sortPriority}
                        onChange={(event) => setSortPriority(event.target.value)}
                        error={!!errors.sortPriority}
                        helperText={errors.sortPriority}
                    />

                    <Stack>
                        <Stack direction='row' justifyContent='space-between'>
                            <Typography variant='subtitle1'>Counts by Cohort</Typography>
                            <Button
                                variant='text'
                                onClick={onAddCount}
                                disabled={counts.length === dojoCohorts.length}
                            >
                                Add Cohort
                            </Button>
                        </Stack>
                        <Divider />
                        {counts.length === 0 &&
                            (errors.counts ? (
                                <Typography mt={2} color='error'>
                                    At least one cohort is required
                                </Typography>
                            ) : (
                                <Typography mt={2}>No Counts</Typography>
                            ))}
                        {counts.map((c, idx) => (
                            <Stack
                                key={idx}
                                sx={{ mt: 3 }}
                                direction='row'
                                width={1}
                                alignItems='center'
                            >
                                <TextField
                                    select
                                    label='Cohort'
                                    value={c.cohort}
                                    onChange={(event) =>
                                        onUpdateCountCohort(idx, event.target.value)
                                    }
                                    error={errors.counts && !!errors.counts[idx]}
                                    helperText={errors.counts && errors.counts[idx]}
                                    sx={{ flexGrow: 1.5 }}
                                >
                                    {dojoCohorts
                                        .filter(
                                            (cohort) =>
                                                c.cohort === cohort ||
                                                !counts.some(
                                                    (count) => count.cohort === cohort
                                                )
                                        )
                                        .map((option) => (
                                            <MenuItem key={option} value={option}>
                                                {option}
                                            </MenuItem>
                                        ))}
                                </TextField>
                                <TextField
                                    required
                                    label='Count'
                                    value={c.count}
                                    onChange={(event) =>
                                        onUpdateCountValue(idx, event.target.value)
                                    }
                                    sx={{ flexGrow: 0.5, ml: 2, maxWidth: '300px' }}
                                    error={errors.counts && !!errors.counts[idx]}
                                    helperText={errors.counts && errors.counts[idx]}
                                />
                                <IconButton
                                    aria-label='delete'
                                    sx={{ ml: 2 }}
                                    onClick={() => onDeleteCount(idx)}
                                >
                                    <DeleteIcon />
                                </IconButton>
                            </Stack>
                        ))}
                    </Stack>

                    <Stack>
                        <Stack direction='row' justifyContent='space-between'>
                            <Typography variant='subtitle1'>Video URLs</Typography>
                            <Button variant='text' onClick={onAddVideo}>
                                Add Video
                            </Button>
                        </Stack>
                        <Divider />
                        {videoUrls.length === 0 && (
                            <Typography mt={2}>No Videos</Typography>
                        )}
                        {videoUrls.map((url, idx) => (
                            <Stack
                                key={idx}
                                sx={{ mt: 3 }}
                                direction='row'
                                width={1}
                                alignItems='center'
                            >
                                <TextField
                                    required
                                    label={`Video ${idx + 1} Embed URL`}
                                    value={url}
                                    onChange={(event) =>
                                        updateVideoUrl(idx, event.target.value)
                                    }
                                    sx={{ flexGrow: 1 }}
                                    error={errors.videoUrls && !!errors.videoUrls[idx]}
                                    helperText={videoUrlError}
                                />
                                <IconButton
                                    aria-label='delete'
                                    sx={{ ml: 2 }}
                                    onClick={() => onDeleteVideo(idx)}
                                >
                                    <DeleteIcon />
                                </IconButton>
                            </Stack>
                        ))}
                    </Stack>

                    <Stack>
                        <Stack direction='row' justifyContent='space-between'>
                            <Typography variant='subtitle1'>Position URLs</Typography>
                            <Button variant='text' onClick={onAddPosition}>
                                Add Position
                            </Button>
                        </Stack>
                        <Divider />
                        {positionUrls.length === 0 && (
                            <Typography mt={2}>No Positions</Typography>
                        )}
                        {positionUrls.map((url, idx) => (
                            <Stack
                                key={idx}
                                sx={{ mt: 3 }}
                                direction='row'
                                width={1}
                                alignItems='center'
                            >
                                <TextField
                                    required
                                    label={`Position ${idx + 1} Embed URL`}
                                    value={url}
                                    onChange={(event) =>
                                        updatePositionUrl(idx, event.target.value)
                                    }
                                    sx={{ flexGrow: 1 }}
                                    error={
                                        errors.positionUrls && !!errors.positionUrls[idx]
                                    }
                                    helperText={positionUrlError}
                                />
                                <IconButton
                                    aria-label='delete'
                                    sx={{ ml: 2 }}
                                    onClick={() => onDeletePosition(idx)}
                                >
                                    <DeleteIcon />
                                </IconButton>
                            </Stack>
                        ))}
                    </Stack>
                </Stack>
            )}

            {showPreview && (
                <Stack pt={5}>
                    <Typography variant='subtitle1'>Preview</Typography>
                    <Divider sx={{ mb: 3 }} />
                    <RequirementDisplay requirement={newRequirement} preview />
                </Stack>
            )}
        </Container>
    );
};

export default RequirementEditorPage;
