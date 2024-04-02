import { BookSummary, Training } from '@bendk/chess-tree'
import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { listBooks, getTraining } from '../../api/bookApi'
import LoadingPage from '../../loading/LoadingPage'
import Train from './Train'

const TrainingPage = () => {
    const { trainingId }  = useParams()
    const [training, setTraining] = useState<Training|undefined>(undefined)
    const [books, setBooks] = useState<BookSummary[]|undefined>(undefined)

    useEffect(() => {
        if (trainingId) {
            listBooks('test-user').then(setBooks)
            getTraining('test-user', trainingId).then(setTraining)
        } else {
            throw Error("no training id")
        }
    }, [trainingId])

    if (training !== undefined && books !== undefined) {
        return <Train training={training} books={books} />
    } else {
        return <LoadingPage />
    }
}

export default TrainingPage
