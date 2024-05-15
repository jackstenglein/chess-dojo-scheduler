import { ArrowUpward, Delete } from '@mui/icons-material';
import { LoadingButton } from '@mui/lab';
import {
    Alert,
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
import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { useApi } from '../../../api/Api';
import { RequestSnackbar, useRequest } from '../../../api/Request';
import { useAuth } from '../../../auth/Auth';
import { Course, CourseSellingPoint, CourseType } from '../../../database/course';
import { dojoCohorts, getCohortRange } from '../../../database/user';
import LoadingPage from '../../../loading/LoadingPage';
import CohortIcon from '../../../scoreboard/CohortIcon';
import PurchaseCoursePreview from './PurchaseCoursePreview';

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

interface CourseEditorErrors {
    type?: string;
    name?: string;
    description?: string;
    whatsIncluded?: {
        overall?: string;
        [key: number]: string;
    };
    purchaseOptions?: {
        overall?: string;
        [key: number]: {
            name?: string;
            fullPrice?: string;
            currentPrice?: string;
        };
    };
}

interface CourseEditorPageParams {
    type: CourseType;
    id: string;
}

const CourseEditorPage = () => {
    const params = useParams<CourseEditorPageParams>();
    const request = useRequest<Course>();
    const saveRequest = useRequest<string>();
    const api = useApi();
    const user = useAuth().user!;

    const [type, setType] = useState<CourseType>(CourseType.Opening);
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
    const [errors, setErrors] = useState<CourseEditorErrors>({});

    const [showPreview, setShowPreview] = useState(false);

    useEffect(() => {
        if (!request.isSent() && params.type && params.id) {
            request.onStart();
            api.getCourse(params.type, params.id)
                .then((resp) => {
                    console.log('getCourse: ', resp);
                    const course = resp.data.course;
                    request.onSuccess(course);
                    setType(course.type);
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
                                ...option,
                                name: option.name,
                                fullPrice: `${option.fullPrice / 100}`,
                                currentPrice: `${option.currentPrice / 100}`,
                                sellingPoints: option.sellingPoints || [],
                            })),
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

    if (params.type && params.id && request.isFailure()) {
        return (
            <Container sx={{ py: 4 }}>
                <RequestSnackbar request={request} />
                <Typography>Unable to fetch course details</Typography>
            </Container>
        );
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
        value: string,
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
        value: string | boolean,
    ) => {
        setPurchaseOptions([
            ...purchaseOptions.slice(0, purchaseOptionIdx),
            {
                ...purchaseOptions[purchaseOptionIdx],
                sellingPoints: [
                    ...purchaseOptions[purchaseOptionIdx].sellingPoints.slice(
                        0,
                        sellingPointIdx,
                    ),
                    {
                        ...purchaseOptions[purchaseOptionIdx].sellingPoints[
                            sellingPointIdx
                        ],
                        [key]: value,
                    },
                    ...purchaseOptions[purchaseOptionIdx].sellingPoints.slice(
                        sellingPointIdx + 1,
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
                        sellingPointIdx,
                    ),
                    ...purchaseOptions[purchaseOptionIdx].sellingPoints.slice(
                        sellingPointIdx + 1,
                    ),
                ],
            },
            ...purchaseOptions.slice(purchaseOptionIdx + 1),
        ]);
    };

    const cohorts = getCohortRange(minCohort, maxCohort);
    const cohortRange = getCohortRangeDescription(cohorts);

    const course: Course = {
        ...request.data,
        owner: user.username,
        ownerDisplayName: ownerDisplayName.trim() || user.displayName,
        stripeId: user.coachInfo?.stripeId || '',
        id: request.data?.id || '',
        name: name.trim(),
        description: description.trim(),
        whatsIncluded,
        color,
        type,
        cohorts,
        cohortRange: cohortRangeStr.trim() ? cohortRangeStr.trim() : cohortRange,
        includedWithSubscription,
        availableForFreeUsers,
        purchaseOptions: purchaseOptions.map((option) => {
            const fullPrice = option.fullPrice.trim()
                ? 100 * parseFloat(option.fullPrice)
                : 0;
            const currentPrice = option.currentPrice.trim()
                ? 100 * parseFloat(option.currentPrice)
                : 0;
            return {
                ...option,
                fullPrice: isNaN(fullPrice) ? 0 : fullPrice,
                currentPrice: isNaN(currentPrice) ? 0 : currentPrice,
            };
        }),
    };

    if (showPreview) {
        return (
            <PurchaseCoursePreview
                course={course}
                closePreview={() => setShowPreview(false)}
            />
        );
    }

    const onSave = () => {
        const newErrors: CourseEditorErrors = {};
        if (!course.name) {
            newErrors.name = 'This field is required';
        }

        if (!course.description) {
            newErrors.description = 'This field is required';
        }

        if (whatsIncluded.length === 0) {
            newErrors.whatsIncluded = {
                overall: 'At least one item is required',
            };
        }
        whatsIncluded.forEach((item, idx) => {
            if (!item.trim()) {
                if (!newErrors.whatsIncluded) {
                    newErrors.whatsIncluded = {};
                }
                newErrors.whatsIncluded[idx] = 'This field cannot be blank';
            }
        });

        if (
            (course.availableForFreeUsers || !course.includedWithSubscription) &&
            !course.purchaseOptions?.length
        ) {
            newErrors.purchaseOptions = {
                overall:
                    'At least one purchase option is required when the course is available for free users or not included with a subscription',
            };
        }
        course.purchaseOptions?.forEach((item, idx) => {
            const error: Record<string, string> = {};
            if (item.fullPrice < 100) {
                error.fullPrice = 'Must be at least $1';
            }
            if (item.currentPrice > 0 && item.currentPrice < 1) {
                error.currentPrice = 'Must be at least $1';
            }
            if (item.currentPrice > item.fullPrice) {
                error.currentPrice = 'Must be less than full price';
            }
            if (Object.values(error).length > 0) {
                if (!newErrors.purchaseOptions) {
                    newErrors.purchaseOptions = {};
                }
                newErrors.purchaseOptions[idx] = error;
            }
        });

        setErrors(newErrors);
        if (Object.values(newErrors).length > 0) {
            return;
        }

        saveRequest.onStart();
        api.setCourse(course)
            .then((resp) => {
                console.log('setCourse: ', resp);
                saveRequest.onSuccess('Course updated');
                request.onSuccess(resp.data);
            })
            .catch((err) => {
                console.error('setCourse: ', err);
                saveRequest.onFailure(err);
            });
    };

    return (
        <Container
            maxWidth={false}
            sx={{
                py: 4,
            }}
        >
            <RequestSnackbar request={saveRequest} showSuccess />

            {Object.values(errors).length > 0 && (
                <Alert severity='error' variant='filled' sx={{ mb: 3 }}>
                    Unable to save. Please fix the errors below and try again.
                </Alert>
            )}

            <Stack direction='row' justifyContent='space-between' alignItems='center'>
                <Typography variant='h4'>Edit Course</Typography>
                <Stack direction='row' spacing={2}>
                    <Button
                        size='small'
                        variant='contained'
                        onClick={() => setShowPreview(true)}
                    >
                        Show Preview
                    </Button>
                    <LoadingButton
                        size='small'
                        variant='outlined'
                        loading={saveRequest.isLoading()}
                        onClick={onSave}
                    >
                        Save
                    </LoadingButton>
                </Stack>
            </Stack>
            <Divider />

            <Stack spacing={4} mt={3}>
                <TextField
                    disabled
                    select
                    label='Course Type'
                    value={type}
                    onChange={(e) => setType(e.target.value as CourseType)}
                    helperText='Changing course type is not implemented yet'
                >
                    {Object.values(CourseType).map((t) => (
                        <MenuItem key={t} value={t}>
                            {t}
                        </MenuItem>
                    ))}
                </TextField>

                <TextField
                    label='Name'
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    error={Boolean(errors.name)}
                    helperText={errors.name}
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
                    error={Boolean(errors.description)}
                    helperText={errors.description}
                />

                <FormGroup>
                    <FormLabel error={Boolean(errors.whatsIncluded)}>
                        What's Included
                    </FormLabel>

                    {errors.whatsIncluded?.overall && (
                        <FormHelperText error>
                            {errors.whatsIncluded.overall}
                        </FormHelperText>
                    )}

                    <Stack mt={2} spacing={3}>
                        {whatsIncluded.map((item, idx) => (
                            <Stack
                                key={idx}
                                direction='row'
                                spacing={1}
                                alignItems='center'
                            >
                                <TextField
                                    key={idx}
                                    fullWidth
                                    label='Bullet Point'
                                    value={item}
                                    onChange={(e) =>
                                        onChangeWhatsIncluded(idx, e.target.value)
                                    }
                                    error={Boolean(errors.whatsIncluded?.[idx])}
                                    helperText={errors.whatsIncluded?.[idx]}
                                />
                                <Tooltip title='Move Up'>
                                    <span>
                                        <IconButton
                                            disabled={idx === 0}
                                            onClick={() => onMoveUpWhatsIncluded(idx)}
                                        >
                                            <ArrowUpward />
                                        </IconButton>
                                    </span>
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
                                        <CohortIcon
                                            cohort={cohort}
                                            size={40}
                                            sx={{
                                                marginRight: '0.6rem',
                                                verticalAlign: 'middle',
                                            }}
                                            tooltip=''
                                            color='primary'
                                        />
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
                    <Typography
                        variant='h6'
                        color={errors.purchaseOptions ? 'error' : 'undefined'}
                    >
                        Purchase Options
                    </Typography>
                    {errors.purchaseOptions?.overall && (
                        <FormHelperText error sx={{ mb: 2 }}>
                            {errors.purchaseOptions.overall}
                        </FormHelperText>
                    )}
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
                                        <span>
                                            <IconButton
                                                disabled={idx === 0}
                                                onClick={() =>
                                                    onMoveUpPurchaseOption(idx)
                                                }
                                            >
                                                <ArrowUpward />
                                            </IconButton>
                                        </span>
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
                                                e.target.value,
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
                                                e.target.value,
                                            )
                                        }
                                        InputProps={{
                                            startAdornment: (
                                                <InputAdornment position='start'>
                                                    $
                                                </InputAdornment>
                                            ),
                                        }}
                                        error={Boolean(
                                            errors.purchaseOptions?.[idx]?.fullPrice,
                                        )}
                                        helperText={
                                            errors.purchaseOptions?.[idx]?.fullPrice
                                        }
                                    />
                                    <TextField
                                        label='Sale Price'
                                        variant='outlined'
                                        value={option.currentPrice}
                                        onChange={(e) =>
                                            onChangePurchaseOption(
                                                idx,
                                                'currentPrice',
                                                e.target.value,
                                            )
                                        }
                                        helperText={
                                            errors.purchaseOptions?.[idx]?.currentPrice ||
                                            'If you want this option to display as being on sale, enter a sale price and it will be shown as a discount off the full price. If left blank, users must pay the full price.'
                                        }
                                        InputProps={{
                                            startAdornment: (
                                                <InputAdornment position='start'>
                                                    $
                                                </InputAdornment>
                                            ),
                                        }}
                                        error={Boolean(
                                            errors.purchaseOptions?.[idx]?.currentPrice,
                                        )}
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
                                                            e.target.value,
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
                                                                    e.target.checked,
                                                                )
                                                            }
                                                        />
                                                    }
                                                />
                                                <Tooltip title='Move Up'>
                                                    <span>
                                                        <IconButton
                                                            disabled={spIdx === 0}
                                                            onClick={() =>
                                                                onMoveUpSellingPoint(
                                                                    idx,
                                                                    spIdx,
                                                                )
                                                            }
                                                        >
                                                            <ArrowUpward />
                                                        </IconButton>
                                                    </span>
                                                </Tooltip>
                                                <Tooltip title='Delete'>
                                                    <IconButton
                                                        onClick={() =>
                                                            onDeleteSellingPoint(
                                                                idx,
                                                                spIdx,
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
