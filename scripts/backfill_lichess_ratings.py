import boto3
import time
import requests
import datetime
from dateutil import parser

db = boto3.resource('dynamodb')
table = db.Table('prod-users')

def daterange(start_date, end_date) -> datetime.datetime:
    for n in range(int((end_date - start_date).days)):
        date = start_date + datetime.timedelta(n)
        if date.isoweekday() == 1:
            yield date


def lessThan(date, point):
    if date.year != point[0]:
        return date.year < point[0]

    # Month starts at 0 in Lichess data, but 1 in Python
    if date.month != point[1] + 1:
        return date.month < point[1] + 1
    
    return date.day < point[2]


def update_users(users):
    updated = 0
    with table.batch_writer() as batch:
        for user in users:
            lichessUsername = user.get('lichessUsername', '')
            if lichessUsername is None or len(lichessUsername) == 0: continue

            ratingHistories = user.get('ratingHistories', {})
            createdAt = user.get('createdAt', '2022-05-01')
            if createdAt is None:
                createdAt = '2022-05-01'

            dates = list(daterange(parser.parse(createdAt).date(), datetime.date(2023, 8, 29)))
            if len(dates) == 0: continue
            
            res = requests.get(f'https://lichess.org/api/user/{lichessUsername}/rating-history')
            if res.status_code != 200: continue

            entries = res.json()
            entries = [entry for entry in entries if entry['name'] == "Classical"]
            if len(entries) == 0: continue
            
            classical = entries[0]["points"]
            if len(classical) == 0: continue

            result = []
            pointIndex = 0
            dateIndex = 0

            while pointIndex < len(classical):
                point = classical[pointIndex]
                if lessThan(dates[0], point):
                    break
                pointIndex += 1

            if pointIndex > 0:
                pointIndex -= 1

            while dateIndex < len(dates) and pointIndex < len(classical):
                date = dates[dateIndex]
                point = classical[pointIndex]

                if lessThan(date, point):
                    dateIndex += 1
                    continue

                result.append({
                    'date': date.isoformat(),
                    'rating': point[3],
                })
                pointIndex += 1
                dateIndex += 1


            if len(result) > 0:
                ratingHistories['LICHESS'] = result
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
