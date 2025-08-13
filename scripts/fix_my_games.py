import boto3

env = 'dev'
db = boto3.resource('dynamodb')
directories_table = db.Table(f'{env}-directories')
games_table = db.Table(f'{env}-games')


def process_directories(directories):
    updated = 0
    with directories_table.batch_writer() as batch:
        for directory in directories:
            if directory['id'] != 'mygames': continue
            if len(directory['items']) == 0: continue

            items = list(directory['items'].values())
            for i in range(0, len(items), 100):
                item_batch = items[i:i+100]
                batch_keys = {
                    games_table.name: {
                        'Keys': [
                            {
                                'cohort': game['metadata']['cohort'], 
                                'id': game['metadata']['id']
                            } for game in item_batch if game['type'] != 'DIRECTORY'
                        ]
                    }
                }
                if len(batch_keys[games_table.name]['Keys']) == 0: continue


                updated += 1
                response = db.batch_get_item(RequestItems=batch_keys)
                data = response.get("Responses").get(games_table.name)

                for game in data:
                    id = f'{game["cohort"]}/{game["id"]}'
                    if id in directory['items']:
                        dir_item = directory['items'][id]
                        dir_item['metadata']['white'] = game['headers'].get('White', dir_item['metadata']['white'])
                        dir_item['metadata']['black'] = game['headers'].get('Black', dir_item['metadata']['black'])

            batch.put_item(Item=directory)
            updated += 1

    return updated


def main():
    try:
        updated = 0
        res = directories_table.scan(
            FilterExpression='#id = :mygames',
            ExpressionAttributeNames={'#id': 'id'},
            ExpressionAttributeValues={':mygames': 'mygames'},
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
                FilterExpression='#id = :mygames',
                ExpressionAttributeNames={'#id': 'id'},
                ExpressionAttributeValues={':mygames': 'mygames'},
            )
            items = res.get('Items', [])
            lastKey = res.get('LastEvaluatedKey', None)
            updated += process_directories(items)

    except Exception as e:
        print(e)
    
    print(f'Updated: {updated}')


if __name__ == '__main__':
    main()
