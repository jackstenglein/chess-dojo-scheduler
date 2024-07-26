import boto3

db = boto3.resource('dynamodb')
table = db.Table('dev-games')


def main():
    try:
        lastKey = None
        updated = 0

        res = table.scan()
        lastKey = res.get('LastEvaluatedKey', None)
        items = res.get('Items', [])
        with table.batch_writer() as batch:
            for item in items:
                if item['owner'] == 'admin':
                    batch.delete_item(Key={
                        'cohort': item['cohort'],
                        'id': item['id']
                    })
                    updated += 1

            while lastKey != None:
                print(lastKey)
                res = table.scan(ExclusiveStartKey=lastKey)

                lastKey = res.get('LastEvaluatedKey', None)
                items = res.get('Items', [])
                for item in items:
                    if item['owner'] == 'admin':
                        batch.delete_item(Key={
                            'cohort': item['cohort'],
                            'id': item['id']
                        })
                        updated += 1
    except Exception as e:
        print(e)

    print("Updated: ", updated)

if __name__ == '__main__':
    main()
