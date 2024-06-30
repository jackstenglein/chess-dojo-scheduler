import boto3
from boto3.dynamodb.conditions import Key


db = boto3.resource('dynamodb')
table = db.Table('dev-explorer')


def handle_item(item, batch):
    if item['id'].startswith('GAME#'):
        batch.delete_item(Key={
            'normalizedFen': item['normalizedFen'],
            'id': item['id']
        })
        return True
    return False


def handle_position(position, table, batch):
    updated = 0
    try:
        lastKey = None
        res = table.query(
            KeyConditionExpression=Key('normalizedFen').eq(position['normalizedFen'])
        )
        lastKey = res.get('LastEvaluatedKey', None)
        items = res.get('Items', [])

        for item in items:
            if handle_item(item, batch):
                updated += 1
        
        while lastKey != None:
            print('Getting games: ', lastKey)
            res = table.query(
                KeyConditionExpression=Key('normalizedFen').eq(position['normalizedFen']),
                ExclusiveStartKey=lastKey
            )
            lastKey = res.get('LastEvaluatedKey', None)
            items = res.get('Items', [])

            for item in items:
                if handle_item(item, batch):
                    updated += 1

        batch.delete_item(Key={
            'normalizedFen': position['normalizedFen'],
            'id': 'POSITION',
        })
        updated += 1
    except Exception as e:
        print(e)
    
    return updated


def main():
    updated = 0
    try:
        lastKey = None

        res = table.query(
            IndexName='FollowerIndex',
            KeyConditionExpression=Key('id').eq('POSITION'),
        )
        lastKey = res.get('LastEvaluatedKey', None)
        items = res.get('Items', [])

        with table.batch_writer() as batch:
            for item in items:
                updated += handle_position(item, table, batch)

            while lastKey != None:
                print('Getting positions: ', lastKey)
                res = table.query(
                    IndexName='FollowerIndex',
                    KeyConditionExpression=Key('id').eq('POSITION'),
                    ExclusiveStartKey=lastKey,
                )
                lastKey = res.get('LastEvaluatedKey', None)
                items = res.get('Items', [])

                for item in items:
                    updated += handle_position(item, table, batch)
    except Exception as e:
        print(e)
    
    print('Removed Items: ', updated)


if __name__ == '__main__':
    main()
