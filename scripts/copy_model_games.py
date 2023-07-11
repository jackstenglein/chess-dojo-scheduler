import boto3

db = boto3.resource('dynamodb')
dev = db.Table('dev-games')
prod = db.Table('prod-games')


def main():
    try:
        lastKey = None
        copied = 0
        failed = 0

        res = dev.query(
            IndexName='OwnerIndex', 
            KeyConditionExpression='#owner = :owner',
            ExpressionAttributeNames={
                '#owner': 'owner',
            },
            ExpressionAttributeValues={
                ':owner': 'model_games',
            },
        )
        gameInfos = res.get('Items', [])
        lastKey = res.get('LastEvaluatedKey', None)

        with prod.batch_writer() as batch:
            for gi in gameInfos:
                res = dev.get_item(Key={
                    'cohort': gi['cohort'],
                    'id': gi['id'],
                })
                game = res.get('Item', None)
                if game is not None:
                    batch.put_item(Item=game)
                    copied += 1
                else:
                    failed += 1

            while lastKey != None:
                print(lastKey)
                res = dev.query(
                    IndexName='OwnerIndex', 
                    KeyConditionExpression='#owner = :owner',
                    ExpressionAttributeNames={
                        '#owner': 'owner',
                    },
                    ExpressionAttributeValues={
                        ':owner': 'model_games',
                    },
                    ExclusiveStartKey=lastKey,
                )
                gameInfos = res.get('Items', [])
                lastKey = res.get('LastEvaluatedKey', None)

                for gi in gameInfos:
                    res = dev.get_item(Key={
                        'cohort': gi['cohort'],
                        'id': gi['id'],
                    })
                    game = res.get('Item', None)
                    if game is not None:
                        batch.put_item(Item=game)
                        copied += 1
                    else:
                        failed += 1

    except Exception as e:
        print(e)
    
    print('Copied: ', copied)
    print('Failed: ', failed)

if __name__ == '__main__':
    main()
