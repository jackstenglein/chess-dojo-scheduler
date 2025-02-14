import boto3

db = boto3.resource('dynamodb')
table = db.Table('prod-explorer')


def process_items(items):
    deleted = 0
    with table.batch_writer() as batch:
        for item in items:
            if item['id'].startswith('GAME#masters'):
                batch.delete_item(Key={
                    'normalizedFen': item['normalizedFen'],
                    'id': item['id'],
                })
                deleted += 1
    return deleted


def main():
    try:
        deleted = 0

        res = table.scan()
        items = res.get('Items', [])
        lastKey = res.get('LastEvaluatedKey', None)
        deleted += process_items(items)

        while lastKey != None:
            print('LastEvaluatedKey: ', lastKey)
            print('Deleted: ', deleted)
            res = table.scan(ExclusiveStartKey=lastKey)
            items = res.get('Items', [])
            lastKey = res.get('LastEvaluatedKey', None)
            deleted += process_items(items)

    except Exception as e:
        print(e)

    print("Finished. Total Deleted: ", deleted)


if __name__ == '__main__':
    main()
