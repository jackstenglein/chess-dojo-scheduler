import boto3
import time
import requests
import datetime
from dateutil import parser
from bs4 import BeautifulSoup
import traceback

db = boto3.resource('dynamodb')
table = db.Table('prod-users')

HISTORY_TABLE_INDEX = 6
RATING_CELL_INDEX = 2


def fetchRatings(uscfId: str):
    res = requests.get(f'https://www.uschess.org/msa/MbrDtlTnmtHst.php?{uscfId}')
    if res.status_code != 200:
        return []
    soup = BeautifulSoup(res.text, 'html.parser')
    tables = soup.find_all('table')
    if len(tables) <= HISTORY_TABLE_INDEX:
        return []
    
    result = []
    rows = tables[HISTORY_TABLE_INDEX].find_all('tr')[1:]
    for row in rows:
        cells = row.find_all('td')
        if len(cells) <= RATING_CELL_INDEX:
            continue

        rating = cells[RATING_CELL_INDEX].find('b')
        if rating is None or rating.string is None:
            continue

        rating = rating.string
        if ' ' in rating:
            rating = rating[: rating.index(' ')]

        date = cells[0].contents[0]

        result.append({
            'date': date,
            'rating': int(rating),
        })
    result.reverse()
    return result


def daterange(start_date, end_date) -> datetime.datetime:
    for n in range(int((end_date - start_date).days)):
        date = start_date + datetime.timedelta(n)
        if date.isoweekday() == 1:
            yield date


def update_users(users):
    updated = 0
    with table.batch_writer() as batch:
        for user in users:
            uscfId = user.get('uscfId', '')
            if uscfId is None or len(uscfId) == 0: continue

            ratingHistories = user.get('ratingHistories', {})
            createdAt = user.get('createdAt', '2022-05-01')
            if createdAt is None:
                createdAt = '2022-05-01'

            dates = list(daterange(parser.parse(createdAt).date(), datetime.date(2023, 8, 29)))
            if dates is None or len(dates) == 0: continue

            ratings = fetchRatings(uscfId)
            if ratings is None or len(ratings) == 0: continue
    
            result = []
            pointIndex = 0
            dateIndex = 0

            while pointIndex < len(ratings):
                point = ratings[pointIndex]
                if dates[0].isoformat() < point['date']:
                    break
                pointIndex += 1

            if pointIndex > 0:
                pointIndex -= 1

            while dateIndex < len(dates) and pointIndex < len(ratings):
                date = dates[dateIndex]
                point = ratings[pointIndex]

                if date.isoformat() < point['date']:
                    dateIndex += 1
                    continue

                result.append({
                    'date': date.isoformat(),
                    'rating': point['rating'],
                })
                pointIndex += 1
                dateIndex += 1


            if len(result) > 0:
                ratingHistories['USCF'] = result
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
        print(traceback.format_exc())
        print(e)

    print("Updated: ", updated)


if __name__ == '__main__':
    main()
