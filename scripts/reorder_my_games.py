import boto3

env = 'dev'
db = boto3.resource('dynamodb')
directories_table = db.Table(f'{env}-directories')


def process_directories(directories):
    updated = 0
    with directories_table.batch_writer() as batch:
        for directory in directories:
            if directory['id'] != 'home' or 'mygames' not in directory['items'] or directory['itemIds'][0] == 'mygames': continue

            directory['itemIds'].remove('mygames')
            directory['itemIds'].insert(0, 'mygames')
            batch.put_item(Item=directory)
            updated += 1

    return updated


def main():
    try:
        updated = 0
        res = directories_table.scan(
            FilterExpression='#id = :home',
            ExpressionAttributeNames={'#id': 'id'},
            ExpressionAttributeValues={':home': 'home'},
        )
        items = res.get('Items', [])
        lastKey = res.get('LastEvaluatedKey', None)
        updated += process_directories(items)

        while lastKey != None:
            print('*** Starting new set of directories:')
            print(lastKey)
            print()
            res = directories_table.scan(
                ExclusiveStartKey=lastKey,
                FilterExpression='#id = :home',
                ExpressionAttributeNames={'#id': 'id'},
                ExpressionAttributeValues={':home': 'home'},
            )
            items = res.get('Items', [])
            lastKey = res.get('LastEvaluatedKey', None)
            updated += process_directories(items)
    except Exception as e:
        print(e)
    
    print("Updated: ", updated)


if __name__ == '__main__':
    main()
