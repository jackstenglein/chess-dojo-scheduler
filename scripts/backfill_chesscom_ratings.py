import boto3
import time
import requests
import datetime

db = boto3.resource('dynamodb')
table = db.Table('prod-users')

def update_users(users):
    updated = 0
    with table.batch_writer() as batch:
        for user in users:
            chesscomUsername = user.get('chesscomUsername', '')
            if chesscomUsername is None or len(chesscomUsername) == 0: continue

            ratingHistories = user.get('ratingHistories', {})
            createdAt = user.get('createdAt', '2022-05-01')
            if createdAt is None:
                createdAt = '2022-05-01'
            
            res = requests.get(f'https://www.chess.com/callback/live/stats/{chesscomUsername}/chart?type=rapid')
            if res.status_code != 200: continue

            entries = res.json()
            result = []
            for entry in entries:
                date = datetime.datetime.utcfromtimestamp(entry["timestamp"] / 1000)
                if date.isoweekday() == 1 and date.isoformat() >= createdAt:
                    result.append({
                        'date': date.isoformat(),
                        'rating': entry["rating"],
                    })

            if len(result) > 0:
                ratingHistories['CHESSCOM'] = result
                user['ratingHistories'] = ratingHistories
                batch.put_item(Item=user)
                updated += 1
                time.sleep(2)

    return updated

def main():
    try:
        updated = 0

        res = table.scan()
        lastKey = res.get('LastEvaluatedKey', None)
        items = res.get('Items', [])
        updated += update_users(items)

        while lastKey != None:
            time.sleep(5)
            print(lastKey)
            res = table.scan(ExclusiveStartKey=lastKey)
            lastKey = res.get('LastEvaluatedKey', None)
            items = res.get('Items', [])
            updated += update_users(items)

    except Exception as e:
        print(e)

    print("Updated: ", updated)


if __name__ == '__main__':
    main()
