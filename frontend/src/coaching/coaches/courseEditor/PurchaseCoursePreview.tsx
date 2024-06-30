import { TabContext, TabList, TabPanel } from '@mui/lab';
import {
    Box,
    Button,
    Checkbox,
    Container,
    Divider,
    FormControlLabel,
    Stack,
    Tab,
    Typography,
} from '@mui/material';
import Grid2 from '@mui/material/Unstable_Grid2';
import { useState } from 'react';
import CourseListItem from '../../../courses/list/CourseListItem';
import PurchaseCoursePage from '../../../courses/view/PurchaseCoursePage';
import { Course } from '../../../database/course';

interface PurchaseCoursePreviewProps {
    course: Course;
    closePreview: () => void;
}

const PurchaseCoursePreview: React.FC<PurchaseCoursePreviewProps> = ({
    course,
    closePreview,
}) => {
    const [isFreeTier, setIsFreeTier] = useState(false);
    const [previewTab, setPreviewTab] = useState('listCourses');

    return (
        <Container maxWidth={false} sx={{ py: 4 }}>
            <Stack>
                <Stack direction='row' justifyContent='space-between' alignItems='center'>
                    <Typography variant='h4'>Preview</Typography>
                    <Button size='small' variant='contained' onClick={closePreview}>
                        Close Preview
                    </Button>
                </Stack>
                <Divider />

                <FormControlLabel
                    sx={{ my: 2 }}
                    control={
                        <Checkbox
                            checked={isFreeTier}
                            onChange={(e) => setIsFreeTier(e.target.checked)}
                        />
                    }
                    label='Preview as free-tier user'
                />

                <Stack>
                    <TabContext value={previewTab}>
                        <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
                            <TabList
                                onChange={(_, value: string) => setPreviewTab(value)}
                                aria-label='lab API tabs example'
                            >
                                <Tab label='Course List Page' value='listCourses' />
                                <Tab label='Your Course Page' value='viewCourse' />
                            </TabList>
                        </Box>
                        <TabPanel value='listCourses'>
                            <Grid2 container>
                                <Grid2 key={course.id} xs={12} md={6} lg={4}>
                                    <CourseListItem
                                        preview
                                        course={course}
                                        isFreeTier={isFreeTier}
                                        isPurchased={false}
                                    />
                                </Grid2>
                            </Grid2>
                        </TabPanel>
                        <TabPanel value='viewCourse'>
                            {!isFreeTier && course.includedWithSubscription ? (
                                <Typography>
                                    This course is included with a subscription, so
                                    subscribers will see the course content instead of the
                                    purchase page.
                                </Typography>
                            ) : (
                                <PurchaseCoursePage
                                    preview
                                    course={course}
                                    isFreeTier={isFreeTier}
                                />
                            )}
                        </TabPanel>
                    </TabContext>
                </Stack>
            </Stack>
        </Container>
    );
};

export default PurchaseCoursePreview;
