import boto3
import csv

db = boto3.resource('dynamodb')
table = db.Table('prod-users')


def process_user(user, writer):
    if not user.get('hasCreatedProfile', False):
        return
    if user.get('ratingSystem', None) == None:
        return
    if user.get('dojoCohort', 'NO_COHORT') == 'NO_COHORT':
        return

    writer.writerow([
        user['username'],
        user['dojoCohort'],
        user['ratingSystem'],
        user.get('ratings', {}).get('CHESSCOM', {}).get('currentRating', 0),
        user.get('ratings', {}).get('LICHESS', {}).get('currentRating', 0),
        user.get('ratings', {}).get('USCF', {}).get('currentRating', 0),
        user.get('ratings', {}).get('FIDE', {}).get('currentRating', 0),
        user.get('ratings', {}).get('ECF', {}).get('currentRating', 0),
        user.get('ratings', {}).get('CFC', {}).get('currentRating', 0),
        user.get('ratings', {}).get('DWZ', {}).get('currentRating', 0),
        user.get('ratings', {}).get('ACF', {}).get('currentRating', 0),
        user.get('ratings', {}).get('KNSB', {}).get('currentRating', 0),
        user.get('ratings', {}).get('CUSTOM', {}).get('currentRating', 0),
    ])

def main():
    try:
        with open('user-ratings.csv', 'w') as file:
            writer = csv.writer(file)
            writer.writerow([
                'username', 
                'cohort',
                'preferredRating',
                'chesscom', 
                'lichess', 
                'uscf', 
                'fide',
                'ecf',
                'cfc',
                'dwz',
                'acf',
                'knsb',
                'custom'
            ])

            res = table.scan()
            lastKey = res.get('LastEvaluatedKey', None)
            items = res.get('Items', [])

            for item in items:
                process_user(item, writer)
            
            while lastKey != None:
                print(lastKey)
                res = table.scan(ExclusiveStartKey=lastKey)
                lastKey = res.get('LastEvaluatedKey', None)
                items = res.get('Items', [])
                for item in items:
                    process_user(item, writer)
    except Exception as e:
        print(e)


if __name__ == '__main__':
    main()
