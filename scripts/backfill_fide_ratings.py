import boto3
import time
import requests
import datetime
from dateutil import parser
from bs4 import BeautifulSoup

db = boto3.resource('dynamodb')
table = db.Table('prod-users')

TABLE_INDEX = 4
RATING_CELL_INDEX = 1


def convertDate(date: str):
    return date \
        .replace('Jan', '01-01') \
        .replace('Feb', '02-01') \
        .replace('Mar', '03-01') \
        .replace('Apr', '04-01') \
        .replace('May', '05-01') \
        .replace('Jun', '06-01') \
        .replace('Jul', '07-01') \
        .replace('Aug', '08-01') \
        .replace('Sep', '09-01') \
        .replace('Oct', '10-01') \
        .replace('Nov', '11-01') \
        .replace('Dec', '12-01')

def fetchRatings(fideId: str):
    res = requests.get(f'https://ratings.fide.com/profile/{fideId}/chart')
    if res.status_code != 200:
        return []
    
    soup = BeautifulSoup(res.text, 'html.parser')
    tables = soup.find_all('tbody')
    if len(tables) <= TABLE_INDEX:
        return []
    
    result = []
    rows = tables[TABLE_INDEX].find_all('tr')
    for row in rows:
        try:
            cells = row.find_all('td')
            if len(cells) <= RATING_CELL_INDEX:
                continue

            rating = cells[RATING_CELL_INDEX].get_text()
            if rating == None or len(rating) == 0:
                continue

            rating = rating.strip()
            if len(rating) == 0:
                continue

            date = cells[0].get_text().strip()
            result.append({
                'date': convertDate(date),
                'rating': int(rating),
            })
        except Exception:
            pass

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
            fideId = user.get('fideId', '')
            if fideId is None or len(fideId) == 0: continue

            ratingHistories = user.get('ratingHistories', {})
            createdAt = user.get('createdAt', '2022-05-01')
            if createdAt is None:
                createdAt = '2022-05-01'

            dates = list(daterange(parser.parse(createdAt).date(), datetime.date(2023, 8, 29)))
            if len(dates) == 0: continue

            ratings = fetchRatings(fideId)
            if len(ratings) == 0: continue
    
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
                ratingHistories['FIDE'] = result
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
