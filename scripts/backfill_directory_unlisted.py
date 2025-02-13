import boto3

db = boto3.resource('dynamodb')
directories_table = db.Table('dev-directories')
games_table = db.Table('dev-games')


def process_directories(directories):
    updated = 0
    with directories_table.batch_writer() as batch:
        for directory in directories:
            needs_update = False
            for item in directory['items'].values():
                if item['type'] == 'DIRECTORY': continue

                cohort = item['metadata']['cohort']
                id = item['metadata']['id']
                game = games_table.get_item(Key={'cohort': cohort, 'id': id}).get('Item', None)
                if not game: continue

                needs_update = True
                item['metadata']['unlisted'] = game.get('unlisted', False)
            
            if needs_update:
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
