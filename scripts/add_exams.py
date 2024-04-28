import boto3

db = boto3.resource('dynamodb')
table = db.Table('dev-users')


def process_users(users, batch):
    updated = 0
    for user in users:
        if user['username'] != 'STATISTICS':
            user['exams'] = {}
            batch.put_item(Item=user)
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
            updated += process_users(items, batch)

            while lastKey != None:
                print(lastKey)
                res = table.scan(ExclusiveStartKey=lastKey)

                lastKey = res.get('LastEvaluatedKey', None)
                items = res.get('Items', [])
                updated += process_users(items, batch)

    except Exception as e:
        print(e)

    print("Updated: ", updated)


if __name__ == '__main__':
    main()
