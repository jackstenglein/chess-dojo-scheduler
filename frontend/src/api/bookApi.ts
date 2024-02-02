import { chunk, omit } from 'lodash';
import {
    Book,
    BookSummary,
    EndgamePosition,
    SplitNode,
    Training,
    TrainingActivity,
    TrainingSummary,
    booksForTraining,
    combineNodes,
    splitNode,
} from '@bendk/chess-tree'
import { DynamoDB } from '@aws-sdk/client-dynamodb';
import { marshall, unmarshall } from '@aws-sdk/util-dynamodb';

/**
 * Book API
 *
 * I put this all here because I didn't want to touch the backend code, but maybe some of it should
 * move to the backend.
 */

// Credentials are hard-coded in a separate file like so:
//
// export const credentials = {
//     accessKeyId: "XXXXXXXXXXXX",
//     secretAccessKey: "XXXXXXXXXXXXX",
// }
import { credentials } from './bookApiCredentials'

const dynamo = new DynamoDB({
    region: 'us-east-1',
    apiVersion: "2010-12-01",
    credentials,
});

export async function listBooks(userId: string): Promise<BookSummary[]> {
    const response = await dynamo.query({
        ExpressionAttributeNames: {
            "#name": "name",
            "#type": "type",
        },
        ExpressionAttributeValues: marshall({
            ":userId": userId,
        }),
        TableName: "book",
        KeyConditionExpression: "userId = :userId",
        ProjectionExpression: "#type,userId,id,#name,fen,lineCount,color,initialMoves",
    })
    if (response.Items === undefined) {
        return []
    } else {
        return response.Items.map(item => unmarshall(item) as BookSummary)
    }
}

export async function putBook(userId: string, book: Book) {
    const userBookId = `${userId}:${book.id}`

    // Split up the book into a single book record and a list of node records
    let nodeRecords: SplitNode[] = []
    let bookRecord: any = {
        ...book,
        userId,
    }
    if (book.type === "opening") {
        nodeRecords.push(...splitNode(book.position, book.rootNode, "<root>"))
        delete bookRecord["rootNode"]
    } else if (book.type === "endgame") {
        bookRecord.positions = bookRecord.positions.map((p: EndgamePosition) => {
            nodeRecords.push(...splitNode(p.position, p.rootNode, `<position-${p.id}>`))
            return omit(p, ["rootNode"])
        })
    }

    await deleteBookNodes(userId, book.id)

    await dynamo.putItem({
        TableName: "book",
        Item: marshall(bookRecord)
    });

    for (const nodeRecordChunk of chunk(nodeRecords, 25)) {
        await dynamo.batchWriteItem({
            RequestItems: {
                book_node: nodeRecordChunk.map(nodeRecord => ({
                    PutRequest: {
                        Item: marshall({
                            userBookId,
                            ...nodeRecord
                        })
                    }
                }))
            }
        });
    }
}

/**
 * Update an existing book
 *
 * This also makes sure to update the total line count for each training that needs to train the book.
 */
export async function updateBook(userId: string, book: Book, oldLineCount: number) {
    await putBook(userId, book)
    const books = await listBooks(userId)
    const lineCountDelta = book.lineCount - oldLineCount

    for(const training of await listTraining(userId)) {
        if(booksForTraining(books, training.selection).find(b => b.id === book.id) !== undefined &&
            training.startedBooks.indexOf(book.id) === -1) {

            await dynamo.updateItem({
                TableName: "book_training",
                Key: marshall({userId: userId, id: training.id}),
                UpdateExpression: "SET totalLines = totalLines + :lineCountDelta",
                ExpressionAttributeValues: marshall({
                    ":lineCountDelta": lineCountDelta,
                }),
            })
        }
    }
}

export async function getBook(userId: string, bookId: string): Promise<Book|undefined> {
    const response = await dynamo.getItem({
        TableName: "book",
        Key: marshall({userId: userId, id: bookId}),
    })

    if (response.Item === undefined) {
        return undefined
    }

    const bookRecord = unmarshall(response.Item) as Book

    const nodeResponse = await dynamo.query({
        ExpressionAttributeValues: marshall({
            ":userBookId": `${userId}:${bookId}`,
        }),
        TableName: "book_node",
        KeyConditionExpression: "userBookId = :userBookId",
    })
    if (nodeResponse.Items === undefined) {
        return undefined
    }
    const nodes = nodeResponse.Items.map(item => unmarshall(item) as SplitNode)
    if (bookRecord.type === "opening") {
        bookRecord.rootNode = combineNodes(nodes, "<root>")
    } else {
        for(const position of bookRecord.positions) {
            position.rootNode = combineNodes(nodes, `<position-${position.id}>`)
        }
    }
    return bookRecord
}

export async function deleteBook(userId: string, bookId: string) {
    await deleteBookNodes(userId, bookId)
    await dynamo.deleteItem({
        TableName: "book",
        Key: marshall({userId: userId, id: bookId}),
    })
}

async function deleteBookNodes(userId: string, bookId: string) {
    const userBookId = `${userId}:${bookId}`

    // Get the old nodes
    const queryResponse = await dynamo.query({
        ExpressionAttributeValues: marshall({
            ":userBookId": userBookId,
        }),
        TableName: "book_node",
        KeyConditionExpression: "userBookId = :userBookId",
        ProjectionExpression: "nodeId"
    })
    const oldNodeIds = (queryResponse.Items ?? []).map(item => unmarshall(item).nodeId)

    for (const nodeIdChunk of chunk(oldNodeIds, 25)) {
        await dynamo.batchWriteItem({
            RequestItems: {
                book_node: nodeIdChunk.map(nodeId => ({
                    DeleteRequest: {
                        Key: marshall({ userBookId, nodeId })
                    }
                }))
            }
        });
    }
}

export async function listTraining(userId: string): Promise<TrainingSummary[]> {
    const response = await dynamo.query({
        ExpressionAttributeNames: {
            "#name": "name",
            "#timestamp": "timestamp",
            "#position": "position",
        },
        ExpressionAttributeValues: marshall({
            ":userId": userId,
        }),
        TableName: "book_training",
        KeyConditionExpression: "userId = :userId",
        ProjectionExpression: "userId,id,#timestamp,#name,selection,#position,correctCount,incorrectCount,linesTrained,totalLines,startedBooks,shuffle",
    })
    if (response.Items === undefined) {
        return []
    } else {
        return response.Items.map(item => unmarshall(item) as TrainingSummary)
    }
}

export async function putTraining(userId: string, training: Training): Promise<void> {
    await dynamo.putItem({
        TableName: "book_training",
        Item: marshall({...training, userId})
    })
}

export async function getTraining(userId: string, trainingId: string): Promise<Training|undefined> {
    const response = await dynamo.getItem({
        TableName: "book_training",
        Key: marshall({userId, id: trainingId}),
    })

    if (response.Item === undefined) {
        return undefined
    } else {
        return unmarshall(response.Item) as Training
    }
}

export async function deleteTraining(userId: string, trainingId: string) {
    await dynamo.deleteItem({
        TableName: "book_training",
        Key: marshall({userId, id: trainingId}),
    })
}

export async function listActivity(userId: string, limit: number=5): Promise<TrainingActivity[]> {
    const response = await dynamo.query({
        ExpressionAttributeValues: marshall({
            ":userId": userId,
        }),
        ScanIndexForward: false,
        Limit: limit,
        TableName: "book_training_activity",
        KeyConditionExpression: "userId = :userId",
    });
    if (response.Items === undefined) {
        return []
    } else {
        return response.Items.map(item => unmarshall(item) as TrainingActivity)
    }
}

export async function putActivity(userId: string, activity: TrainingActivity): Promise<void> {
    await dynamo.putItem({
        TableName: "book_training_activity",
        Item: marshall({...activity, userId})
    })
    // TODO: should we prune older activity somehow?
}

/**
 * Updates the timestamp for an activity
 *
 * Note: Pass in an activity with the old timestamp, since timestamp is part of the primary key.
 */
export async function updateActivityTimestamp(userId: string, activity: TrainingActivity, newTimestamp: number): Promise<void> {
    await dynamo.updateItem({
        TableName: "book_training_activity",
        Key: marshall({
            userId: userId,
            timestamp: activity.timestamp,
        }),
        UpdateExpression: "set timestamp = :timestamp",
        ExpressionAttributeValues: marshall({
            ":timestamp": newTimestamp
        }),
    })
}
