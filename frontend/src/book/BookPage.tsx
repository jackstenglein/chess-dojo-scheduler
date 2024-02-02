import { BookSummary, TrainingActivity, TrainingSummary } from '@bendk/chess-tree'
import { useEffect, useState } from 'react'
import {
    Container,
    Tab,
    Tabs,
} from '@mui/material'
import { listActivity, listTraining, listBooks } from '../api/bookApi'
import LoadingPage from '../loading/LoadingPage'
import BookOverview from './BookOverview'
import BookList from './BookList'
import ModelGamesList from './ModelGamesList'

const BookPage = () => {
    const [trainingList, setTrainingList] = useState<TrainingSummary[]|null>(null);
    const [activityList, setActivityList] = useState<TrainingActivity[]|null>(null);
    const [bookList, setBookList] = useState<BookSummary[]|null>(null);
    const [tab, setTab] = useState<string>("overview")

    useEffect(() => {
        listTraining('test-user').then(setTrainingList)
        listActivity('test-user').then(setActivityList)
        listBooks('test-user').then(setBookList)
    }, [])

    if (trainingList === null || activityList === null || bookList === null) {
        return <LoadingPage />
    }
    let content = null
    if (tab === "overview") {
        content = <BookOverview 
            trainingList={trainingList}
            activityList={activityList}
            bookList={bookList}
            setTrainingList={setTrainingList}
        />
    } else if (tab === "books") {
        content = <BookList
            bookList={bookList}
            setBookList={setBookList}
        />
    } else {
        content = <ModelGamesList
        />
    }

    return <Container maxWidth='lg' sx={{ py: 5 }}>
        <Tabs value={tab} sx={{ pb: 5}} onChange={(_evt, value) => setTab(value)}>
            <Tab value="overview" label="Overview" />
            <Tab value="books" label="Books" />
            <Tab value="games" label="Model games" />
        </Tabs>
        { content }
    </Container>
}

export default BookPage;

