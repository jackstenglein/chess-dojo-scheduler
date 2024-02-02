import { BookSummary, TrainingActivity, TrainingSummary, restartTraining } from '@bendk/chess-tree'
import React, { Fragment, useCallback } from 'react'
import { Link as RouterLink } from 'react-router-dom'
import {
    Button,
    Stack,
    Typography
} from '@mui/material'
import BoltIcon from '@mui/icons-material/Bolt';
import Activity from './Activity';
import { deleteTraining, putTraining } from '../api/bookApi'
import TrainingCard from './training/TrainingCard'

interface BookOverviewProps {
    trainingList: TrainingSummary[],
    activityList: TrainingActivity[];
    bookList: BookSummary[];
    setTrainingList: (trainingList: TrainingSummary[]) => void;
}

const BookOverview: React.FC<BookOverviewProps> = ({trainingList, activityList, bookList, setTrainingList}) => {
    const boardSize = 250

    const onDeleteTraining = useCallback((trainingId: string) => {
        deleteTraining('test-user', trainingId).then(() => {
            setTrainingList(trainingList.filter(training => training.id !== trainingId))
        })
    }, [trainingList, setTrainingList])

    const onRestartTraining = useCallback((trainingId: string) => {
        if(trainingList !== null) {
            const training = trainingList.find(training => training.id === trainingId) 
            if(training !== undefined) {
                const restarted = restartTraining(training)
                putTraining('test-user', restarted)
                setTrainingList(trainingList.map(training => (training.id === trainingId) ? restarted : training))
            }
        }
    }, [trainingList, setTrainingList])

    return <Fragment>
        <Stack direction="row" spacing={5} justifyContent="flex-start">
            {
                trainingList ? trainingList.map(training => <TrainingCard
                    key={training.id}
                    width={boardSize}
                    training={training}
                    onRestart={onRestartTraining}
                    onDelete={onDeleteTraining}
                />) : null
            }
        </Stack>
        { activityList && activityList.length > 0 ?
            <Stack pt={10} spacing={1}>
                <Typography variant="h5">Activity</Typography>
                <Activity activity={activityList} />
            </Stack>
            : null
        }
        <Stack pt={10} direction="row" justifyContent="space-between">
            <Button variant="contained" sx={{ px: 20, py: 2 }} component={RouterLink} to="/book/training/new">Train New Line</Button>
            <Stack direction="row" spacing={2}>
                { bookList.length > 0 ?
                    <Button
                        variant="outlined"
                        sx={{ py: 2 }}
                        component={RouterLink}
                        to="/book/add-line"
                    ><BoltIcon sx={{ mb: 0.5 }} /> Add Line</Button> : 
                    null
                }
            </Stack>
        </Stack>
    </Fragment>
}

export default BookOverview;
