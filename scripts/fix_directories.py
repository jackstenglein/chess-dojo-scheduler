import boto3
from boto3.dynamodb.conditions import Key

db = boto3.resource('dynamodb')
table = db.Table('dev-games')

cohorts = [
    '0-300',
    '300-400', 
    '400-500', '500-600', '600-700', '700-800', '800-900', '900-1000', '1000-1100', 
    '1100-1200', '1200-1300', '1300-1400', '1400-1500', '1500-1600', '1600-1700',
    '1700-1800',
    '1800-1900',
    '1900-2000',
    '2000-2100',
    '2100-2200',
    '2200-2300',
    '2300-2400',
    '2400+',
]


def process_game(game, batch):
    directories = game.get('directories', None)
    owner = game.get('owner', None)
    if directories is None or owner is None:
        return 0
    
    updated = False

    incorrect_directories = [directory for directory in directories if '/' not in directory]
    for directory in incorrect_directories:
        if '/' not in directory:
            directories.remove(directory)
            directories.add(f'{owner}/{directory}')
            updated = True
            game['directories'] = directories
    
    if updated:
        batch.put_item(Item=game)
        return 1
    
    return 0



def main():
    try:
        total_updated = 0

        with table.batch_writer() as batch:
            for cohort in cohorts:
                print(f'Starting cohort {cohort}')
                updated = 0

                res = table.query(
                    KeyConditionExpression=Key('cohort').eq(cohort) & Key('id').gte('2024-09-01')
                )

                lastKey = res.get('LastEvaluatedKey', None)
                items = res.get('Items', [])
                for item in items:
                    updated += process_game(item, batch)
                
                while lastKey != None:
                    print(lastKey)
                    res = table.query(
                        KeyConditionExpression=Key('cohort').eq(cohort) & Key('id').gte('2024-09-01'),
                        ExclusiveStartKey=lastKey,
                    )
                    lastKey = res.get('LastEvaluatedKey', None)
                    items = res.get('Items', [])
                    for item in items:
                        updated += process_game(item, batch)
                
                total_updated += updated
                print(f'Updated {updated} for cohort {cohort}')
                print(f'Updated {total_updated} total\n\n')
    except Exception as e:
        print(e)


if __name__ == '__main__':
    main()
