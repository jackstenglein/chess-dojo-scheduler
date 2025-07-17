import boto3

db = boto3.resource('dynamodb')
directories_table = db.Table('dev-directories')


def process_directories(directories):
    updated = 0
    with directories_table.batch_writer() as batch:
        for directory in directories:
            if directory['id'] != 'home' or 'mygames' in directory['items']: continue

            mygames = {
                'owner': directory['owner'],
                'id': 'mygames',
                'parent': 'home',
                'name': 'My Games',
                'description': 'Serious classical games I have played',
                'visibility': 'PUBLIC',
                'createdAt': directory['createdAt'],
                'updatedAt': directory['createdAt'],
                'items': {},
                'itemIds': [],
            }
            batch.put_item(Item=mygames)

            directory['items']['mygames'] = {
                'type': 'DIRECTORY',
                'id': 'mygames',
                'metadata': {
                    'createdAt': directory['createdAt'],
                    'updatedAt': directory['createdAt'],
                    'visibility': 'PUBLIC',
                    'name': 'My Games',
                    'description': 'Serious classical games I have played',
                }
            }
            directory['itemIds'].insert(0, 'mygames')
            batch.put_item(Item=directory)
            updated += 1

    return updated


def main():
    try:
        updated = 0
        res = directories_table.scan()
        items = res.get('Items', [])
        lastKey = res.get('LastEvaluatedKey', None)
        updated += process_directories(items)

        while lastKey != None:
            print(lastKey)
            res = directories_table.scan(ExclusiveStartKey=lastKey)
            items = res.get('Items', [])
            lastKey = res.get('LastEvaluatedKey', None)
            updated += process_directories(items)
    except Exception as e:
        print(e)
    
    print("Updated: ", updated)


if __name__ == '__main__':
    main()
