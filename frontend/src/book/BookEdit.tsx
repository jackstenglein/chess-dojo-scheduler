import { Book } from "@bendk/chess-tree"
import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import EndgameEditor from './editor/EndgameEditor'
import OpeningEditor from './editor/OpeningEditor'
import { getBook } from "../api/bookApi"
import LoadingPage from '../loading/LoadingPage';

const BookEdit = () => {
    const { bookId } = useParams();
    const [book, setBook] = useState<Book>();

    useEffect(() => {
        if(bookId === undefined) {
            throw Error("No book parameter")
        }
        getBook('test-user', bookId)
            .then(book => {
                if (book !== undefined) {
                    setBook(book)
                }
            })
            .catch(reason => {
                throw Error(`Error loading book ${reason}`)
            })
    }, [bookId])

    if (book === undefined) {
        return <LoadingPage />
    } else if (book.type === "opening") {
        return <OpeningEditor book={book} />
    } else {
        return <EndgameEditor book={book} />
    }
};

export default BookEdit;

