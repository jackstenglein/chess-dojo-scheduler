import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import {
    Button,
    Checkbox,
    Container,
    Divider,
    FormControl,
    FormControlLabel,
    FormGroup,
    FormHelperText,
    FormLabel,
    IconButton,
    InputAdornment,
    MenuItem,
    Radio,
    RadioGroup,
    Stack,
    TextField,
    Tooltip,
    Typography,
} from '@mui/material';
import Grid2 from '@mui/material/Unstable_Grid2/Grid2';
import { ArrowUpward, Delete } from '@mui/icons-material';

import { useRequest } from '../../api/Request';
import { GetCourseResponse } from '../../api/courseApi';
import { Course, CourseSellingPoint, CourseType } from '../../database/course';
import { useApi } from '../../api/Api';
import { useAuth } from '../../auth/Auth';
import { dojoCohorts, getCohortRange } from '../../database/user';
import PurchaseCoursePreview from './PurchaseCoursePreview';
import LoadingPage from '../../loading/LoadingPage';

interface CoursePurchaseOptionEditor {
    name: string;
    fullPrice: string;
    currentPrice: string;
    sellingPoints: CourseSellingPoint[];
}

const defaultCoursePurchaseOptionEditor = {
    name: '',
    fullPrice: '',
    currentPrice: '',
    sellingPoints: [],
};

function getCohortRangeDescription(cohortRange: string[]): string {
    if (cohortRange.length === dojoCohorts.length) {
        return 'Any Rating';
    }
    if (cohortRange.length === 1) {
        return cohortRange[0];
    }
    const minCohort = cohortRange[0].split('-')[0];
    let maxCohort = cohortRange[cohortRange.length - 1];
    if (maxCohort === '2400+') {
        return `${minCohort}+`;
    }
    maxCohort = maxCohort.split('-')[1];
    return `${minCohort}-${maxCohort}`;
}

type CourseEditorPageParams = {
    type: CourseType;
    id: string;
};

const CourseEditorPage = () => {
    const params = useParams<CourseEditorPageParams>();
    const request = useRequest<GetCourseResponse>();
    const api = useApi();
    const user = useAuth().user!;

    const [name, setName] = useState('');
    const [ownerDisplayName, setOwnerDisplayName] = useState(user.displayName);
    const [description, setDescription] = useState('');
    const [whatsIncluded, setWhatsIncluded] = useState<string[]>([]);
    const [color, setColor] = useState('None');
    const [minCohort, setMinCohort] = useState('');
    const [maxCohort, setMaxCohort] = useState('');
    const [cohortRangeStr, setCohortRangeStr] = useState('');
    const [includedWithSubscription, setIncludedWithSubscription] = useState(false);
    const [availableForFreeUsers, setAvailableForFreeUsers] = useState(true);
    const [purchaseOptions, setPurchaseOptions] = useState<CoursePurchaseOptionEditor[]>([
        defaultCoursePurchaseOptionEditor,
    ]);

    const [showPreview, setShowPreview] = useState(false);

    useEffect(() => {
        if (!request.isSent() && params.type && params.id) {
            request.onStart();
            api.getCourse(params.type, params.id)
                .then((resp) => {
                    console.log('getCourse: ', resp);
                    const course = resp.data.course;
                    request.onSuccess(resp.data);
                    setName(course.name);
                    setDescription(course.description);
                    setWhatsIncluded(course.whatsIncluded || []);
                    setColor(course.color);
                    setMinCohort(course.cohorts[0]);
                    setMaxCohort(course.cohorts[course.cohorts.length - 1]);
                    setCohortRangeStr(course.cohortRange);
                    setIncludedWithSubscription(course.includedWithSubscription);
                    setAvailableForFreeUsers(course.availableForFreeUsers);

                    if (course.purchaseOptions && course.purchaseOptions.length > 0) {
                        setPurchaseOptions(
                            course.purchaseOptions.map((option) => ({
                                name: option.name,
                                fullPrice: `${option.fullPrice / 100}`,
                                currentPrice: `${option.currentPrice / 100}`,
                                sellingPoints: option.sellingPoints || [],
                            }))
                        );
                    }
                })
                .catch((err) => {
                    request.onFailure(err);
                    console.error('getCourse: ', err);
                });
        }
    }, [request, api, params]);

    if (params.type && params.id && (!request.isSent() || request.isLoading())) {
        return <LoadingPage />;
    }

    const onChangeWhatsIncluded = (idx: number, value: string) => {
        setWhatsIncluded([
            ...whatsIncluded.slice(0, idx),
            value,
            ...whatsIncluded.slice(idx + 1),
        ]);
    };

    const onMoveUpWhatsIncluded = (idx: number) => {
        setWhatsIncluded([
            ...whatsIncluded.slice(0, idx - 1),
            whatsIncluded[idx],
            whatsIncluded[idx - 1],
            ...whatsIncluded.slice(idx + 1),
        ]);
    };

    const onDeleteWhatsIncluded = (idx: number) => {
        setWhatsIncluded([
            ...whatsIncluded.slice(0, idx),
            ...whatsIncluded.slice(idx + 1),
        ]);
    };

    const onAddPurchaseOption = () => {
        setPurchaseOptions([...purchaseOptions, defaultCoursePurchaseOptionEditor]);
    };

    const onChangePurchaseOption = (
        idx: number,
        key: Omit<keyof CoursePurchaseOptionEditor, 'sellingPoints'>,
        value: string
    ) => {
        setPurchaseOptions([
            ...purchaseOptions.slice(0, idx),
            {
                ...purchaseOptions[idx],
                [key as string]: value,
            },
            ...purchaseOptions.slice(idx + 1),
        ]);
    };

    const onMoveUpPurchaseOption = (idx: number) => {
        setPurchaseOptions([
            ...purchaseOptions.slice(0, idx - 1),
            purchaseOptions[idx],
            purchaseOptions[idx - 1],
            ...purchaseOptions.slice(idx + 1),
        ]);
    };

    const onDeletePurchaseOption = (idx: number) => {
        setPurchaseOptions([
            ...purchaseOptions.slice(0, idx),
            ...purchaseOptions.slice(idx + 1),
        ]);
    };

    const onAddSellingPoint = (purchaseOptionIdx: number) => {
        setPurchaseOptions([
            ...purchaseOptions.slice(0, purchaseOptionIdx),
            {
                ...purchaseOptions[purchaseOptionIdx],
                sellingPoints: [
                    ...purchaseOptions[purchaseOptionIdx].sellingPoints,
                    {
                        description: '',
                        included: true,
                    },
                ],
            },
            ...purchaseOptions.slice(purchaseOptionIdx + 1),
        ]);
    };

    const onChangeSellingPoint = (
        purchaseOptionIdx: number,
        sellingPointIdx: number,
        key: keyof CourseSellingPoint,
        value: string | boolean
    ) => {
        setPurchaseOptions([
            ...purchaseOptions.slice(0, purchaseOptionIdx),
            {
                ...purchaseOptions[purchaseOptionIdx],
                sellingPoints: [
                    ...purchaseOptions[purchaseOptionIdx].sellingPoints.slice(
                        0,
                        sellingPointIdx
                    ),
                    {
                        ...purchaseOptions[purchaseOptionIdx].sellingPoints[
                            sellingPointIdx
                        ],
                        [key]: value,
                    },
                    ...purchaseOptions[purchaseOptionIdx].sellingPoints.slice(
                        sellingPointIdx + 1
                    ),
                ],
            },
            ...purchaseOptions.slice(purchaseOptionIdx + 1),
        ]);
    };

    const onMoveUpSellingPoint = (purchaseOptionIdx: number, sellingPointIdx: number) => {
        const purchaseOption = purchaseOptions[purchaseOptionIdx];
        setPurchaseOptions([
            ...purchaseOptions.slice(0, purchaseOptionIdx),
            {
                ...purchaseOption,
                sellingPoints: [
                    ...purchaseOption.sellingPoints.slice(0, sellingPointIdx - 1),
                    purchaseOption.sellingPoints[sellingPointIdx],
                    purchaseOption.sellingPoints[sellingPointIdx - 1],
                    ...purchaseOption.sellingPoints.slice(sellingPointIdx + 1),
                ],
            },
            ...purchaseOptions.slice(purchaseOptionIdx + 1),
        ]);
    };

    const onDeleteSellingPoint = (purchaseOptionIdx: number, sellingPointIdx: number) => {
        setPurchaseOptions([
            ...purchaseOptions.slice(0, purchaseOptionIdx),
            {
                ...purchaseOptions[purchaseOptionIdx],
                sellingPoints: [
                    ...purchaseOptions[purchaseOptionIdx].sellingPoints.slice(
                        0,
                        sellingPointIdx
                    ),
                    ...purchaseOptions[purchaseOptionIdx].sellingPoints.slice(
                        sellingPointIdx + 1
                    ),
                ],
            },
            ...purchaseOptions.slice(purchaseOptionIdx + 1),
        ]);
    };

    const cohorts = getCohortRange(minCohort, maxCohort);
    const cohortRange = getCohortRangeDescription(cohorts);

    const course: Course = {
        owner: user.username,
        ownerDisplayName,
        stripeId: user.coachInfo?.stripeId || '',
        id: 'edit-course',
        name,
        description,
        whatsIncluded,
        color,
        type: CourseType.Opening,
        cohorts,
        cohortRange: cohortRangeStr.trim() ? cohortRangeStr.trim() : cohortRange,
        includedWithSubscription,
        availableForFreeUsers,
        purchaseOptions: purchaseOptions.map((option) => ({
            ...option,
            fullPrice: 100 * parseFloat(option.fullPrice),
            currentPrice: 100 * parseFloat(option.currentPrice),
        })),
    };

    if (showPreview) {
        return (
            <PurchaseCoursePreview
                course={course}
                closePreview={() => setShowPreview(false)}
            />
        );
    }

    return (
        <Container
            maxWidth={false}
            sx={{
                py: 4,
            }}
        >
            <Stack direction='row' justifyContent='space-between' alignItems='center'>
                <Typography variant='h4'>Edit Course</Typography>
                <Button
                    size='small'
                    variant='contained'
                    onClick={() => setShowPreview(true)}
                >
                    Show Preview
                </Button>
            </Stack>
            <Divider />

            <Stack spacing={4} mt={3}>
                <TextField
                    label='Name'
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                />

                <TextField
                    label='Author'
                    value={ownerDisplayName}
                    onChange={(e) => setOwnerDisplayName(e.target.value)}
                    helperText='Defaults to your account display name if left blank'
                />

                <TextField
                    label='Description'
                    multiline
                    minRows={3}
                    maxRows={8}
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                />

                <FormGroup>
                    <FormLabel>What's Included</FormLabel>
                    <Stack mt={2} spacing={3}>
                        {whatsIncluded.map((item, idx) => (
                            <Stack direction='row' spacing={1} alignItems='center'>
                                <TextField
                                    key={idx}
                                    fullWidth
                                    label='Bullet Point'
                                    value={item}
                                    onChange={(e) =>
                                        onChangeWhatsIncluded(idx, e.target.value)
                                    }
                                />
                                <Tooltip title='Move Up'>
                                    <IconButton
                                        disabled={idx === 0}
                                        onClick={() => onMoveUpWhatsIncluded(idx)}
                                    >
                                        <ArrowUpward />
                                    </IconButton>
                                </Tooltip>
                                <Tooltip title='Delete'>
                                    <IconButton
                                        onClick={() => onDeleteWhatsIncluded(idx)}
                                    >
                                        <Delete />
                                    </IconButton>
                                </Tooltip>
                            </Stack>
                        ))}
                        <Button
                            sx={{ alignSelf: 'start' }}
                            onClick={() => setWhatsIncluded([...whatsIncluded, ''])}
                        >
                            Add Bullet Point
                        </Button>
                    </Stack>
                </FormGroup>

                <FormControl>
                    <FormLabel>Color</FormLabel>

                    <RadioGroup
                        row
                        value={color}
                        onChange={(e) => setColor(e.target.value)}
                    >
                        <FormControlLabel label='None' value='None' control={<Radio />} />
                        <FormControlLabel
                            label='White'
                            value='White'
                            control={<Radio />}
                        />
                        <FormControlLabel
                            label='Black'
                            value='Black'
                            control={<Radio />}
                        />
                    </RadioGroup>
                    <FormHelperText>
                        Select only if your course is from the perspective of a specific
                        color
                    </FormHelperText>
                </FormControl>

                <FormGroup>
                    <FormLabel>Cohort Range</FormLabel>
                    <Grid2 container columnSpacing={1} rowSpacing={3} mt={0.5}>
                        <Grid2 xs={6}>
                            <TextField
                                select
                                fullWidth
                                label='Min Cohort'
                                value={minCohort}
                                onChange={(e) => setMinCohort(e.target.value)}
                            >
                                {dojoCohorts.map((cohort) => (
                                    <MenuItem key={cohort} value={cohort}>
                                        {cohort}
                                    </MenuItem>
                                ))}
                            </TextField>
                        </Grid2>
                        <Grid2 xs={6}>
                            <TextField
                                select
                                fullWidth
                                label='Max Cohort'
                                value={maxCohort}
                                onChange={(e) => setMaxCohort(e.target.value)}
                            >
                                {dojoCohorts.map((cohort, i) => (
                                    <MenuItem
                                        key={cohort}
                                        value={cohort}
                                        disabled={
                                            Boolean(minCohort) &&
                                            dojoCohorts.indexOf(minCohort) > i
                                        }
                                    >
                                        {cohort}
                                    </MenuItem>
                                ))}
                            </TextField>
                        </Grid2>
                        <Grid2 xs={12}>
                            <TextField
                                fullWidth
                                label='Cohort Range Description'
                                value={cohortRangeStr}
                                onChange={(e) => setCohortRangeStr(e.target.value)}
                                helperText={`Defaults to ${cohortRange} if left blank`}
                            />
                        </Grid2>
                    </Grid2>
                </FormGroup>

                <FormGroup>
                    <FormLabel>Availability</FormLabel>
                    <FormControlLabel
                        control={
                            <Checkbox
                                checked={includedWithSubscription}
                                onChange={(e) =>
                                    setIncludedWithSubscription(e.target.checked)
                                }
                            />
                        }
                        label='Included for free with Training Plan subscription?'
                    />
                    <FormControlLabel
                        control={
                            <Checkbox
                                checked={availableForFreeUsers}
                                onChange={(e) =>
                                    setAvailableForFreeUsers(e.target.checked)
                                }
                            />
                        }
                        label='Available for purchase by free users?'
                    />
                </FormGroup>

                <FormGroup>
                    <Typography variant='h6'>Purchase Options</Typography>
                    <Typography color='text.secondary'>
                        Each purchase option represents a different price point for your
                        course. Most courses only require one purchase option. You should
                        generally use multiple purchase options only if you are bundling
                        this course with another course. If you have multiple purchase
                        options, the first is used to display the price on the course list
                        page.
                    </Typography>

                    <Stack spacing={5} mt={4}>
                        {purchaseOptions.map((option, idx) => (
                            <Stack key={idx} spacing={2} mt={2}>
                                <Stack direction='row' spacing={1} alignItems='center'>
                                    <Typography>Purchase Option {idx + 1}</Typography>
                                    <Tooltip title='Move Up'>
                                        <IconButton
                                            disabled={idx === 0}
                                            onClick={() => onMoveUpPurchaseOption(idx)}
                                        >
                                            <ArrowUpward />
                                        </IconButton>
                                    </Tooltip>
                                    <Tooltip title='Delete'>
                                        <IconButton
                                            onClick={() => onDeletePurchaseOption(idx)}
                                        >
                                            <Delete />
                                        </IconButton>
                                    </Tooltip>
                                </Stack>

                                <Stack direction='row' spacing={1}>
                                    <TextField
                                        label='Name'
                                        value={option.name}
                                        onChange={(e) =>
                                            onChangePurchaseOption(
                                                idx,
                                                'name',
                                                e.target.value
                                            )
                                        }
                                        helperText='If left blank, it defaults to the course name. Generally set this only if you have multiple purchase options.'
                                    />
                                    <TextField
                                        label='Full Price'
                                        value={option.fullPrice}
                                        onChange={(e) =>
                                            onChangePurchaseOption(
                                                idx,
                                                'fullPrice',
                                                e.target.value
                                            )
                                        }
                                        InputProps={{
                                            startAdornment: (
                                                <InputAdornment position='start'>
                                                    $
                                                </InputAdornment>
                                            ),
                                        }}
                                    />
                                    <TextField
                                        label='Sale Price'
                                        variant='outlined'
                                        value={option.currentPrice}
                                        onChange={(e) =>
                                            onChangePurchaseOption(
                                                idx,
                                                'currentPrice',
                                                e.target.value
                                            )
                                        }
                                        helperText={
                                            'If you want this option to display as being on sale, enter a sale price and it will be shown as a discount off the full price. If left blank, users must pay the full price.'
                                        }
                                        InputProps={{
                                            startAdornment: (
                                                <InputAdornment position='start'>
                                                    $
                                                </InputAdornment>
                                            ),
                                        }}
                                    />
                                </Stack>

                                <FormGroup>
                                    <FormLabel>Selling Points</FormLabel>
                                    <FormHelperText>
                                        Generally add selling points only if you have
                                        multiple purchase options and need to distinguish
                                        between them. Mark a selling point as excluded if
                                        you want to highlight that one purchase option
                                        doesn't provide a specific feature.
                                    </FormHelperText>
                                    <Stack mt={2} spacing={3}>
                                        {option.sellingPoints.map((item, spIdx) => (
                                            <Stack
                                                direction='row'
                                                spacing={1}
                                                alignItems='center'
                                            >
                                                <TextField
                                                    key={spIdx}
                                                    fullWidth
                                                    label='Description'
                                                    value={item.description}
                                                    onChange={(e) =>
                                                        onChangeSellingPoint(
                                                            idx,
                                                            spIdx,
                                                            'description',
                                                            e.target.value
                                                        )
                                                    }
                                                />
                                                <FormControlLabel
                                                    label='Included?'
                                                    control={
                                                        <Checkbox
                                                            checked={item.included}
                                                            onChange={(e) =>
                                                                onChangeSellingPoint(
                                                                    idx,
                                                                    spIdx,
                                                                    'included',
                                                                    e.target.checked
                                                                )
                                                            }
                                                        />
                                                    }
                                                />
                                                <Tooltip title='Move Up'>
                                                    <IconButton
                                                        disabled={spIdx === 0}
                                                        onClick={() =>
                                                            onMoveUpSellingPoint(
                                                                idx,
                                                                spIdx
                                                            )
                                                        }
                                                    >
                                                        <ArrowUpward />
                                                    </IconButton>
                                                </Tooltip>
                                                <Tooltip title='Delete'>
                                                    <IconButton
                                                        onClick={() =>
                                                            onDeleteSellingPoint(
                                                                idx,
                                                                spIdx
                                                            )
                                                        }
                                                    >
                                                        <Delete />
                                                    </IconButton>
                                                </Tooltip>
                                            </Stack>
                                        ))}
                                        <Button
                                            sx={{ alignSelf: 'start' }}
                                            onClick={() => onAddSellingPoint(idx)}
                                        >
                                            Add Selling Point
                                        </Button>
                                    </Stack>
                                </FormGroup>

                                <Divider />
                            </Stack>
                        ))}

                        <Button sx={{ alignSelf: 'start' }} onClick={onAddPurchaseOption}>
                            Add Purchase Option
                        </Button>
                    </Stack>
                </FormGroup>
            </Stack>
        </Container>
    );
};

export default CourseEditorPage;
