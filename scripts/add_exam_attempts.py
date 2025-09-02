import boto3

db = boto3.resource('dynamodb')
table = db.Table('dev-exams')


def process_exams(exams, batch):
    updated = 0
    for exam in exams:
        if exam.get('examType', None) is None:
            continue

        exam['attempts'] = [
            {
                'answers': exam['answers'],
                'cohort': exam['cohort'],
                'rating': exam['rating'],
                'timeUsedSeconds': exam['timeUsedSeconds'],
                'createdAt': exam['createdAt'],
            }
        ]

        batch.put_item(Item=exam)
        updated += 1
    return updated


def main():
    try:
        lastKey = None
        updated = 0

        res = table.scan()
        lastKey = res.get('LastEvaluatedKey', None)
        items = res.get('Items', [])
        with table.batch_writer() as batch:
            updated += process_exams(items, batch)

            while lastKey != None:
                print(lastKey)
                res = table.scan(ExclusiveStartKey=lastKey)

                lastKey = res.get('LastEvaluatedKey', None)
                items = res.get('Items', [])
                updated += process_exams(items, batch)

    except Exception as e:
        print(e)

    print("Updated: ", updated)


if __name__ == '__main__':
    main()
