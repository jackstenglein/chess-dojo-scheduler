import boto3
from boto3.dynamodb.conditions import Key
from boto3.dynamodb.types import TypeDeserializer
import traceback
import json

db = boto3.resource('dynamodb')
table = db.Table('dev-games')
td = TypeDeserializer()


def handle_items(items, known_ids, batch):
    deleted = 0
    for item in items:
        if item['id'] not in known_ids and item['headers'].get('TwicArchive', None) == '1549':
            batch.delete_item(Key={
                'cohort': 'masters',
                'id': item['id'],
            })
            deleted += 1
    return deleted



def main():
    try:
        known_ids = set()

        with open('twic_games_1549.json') as file:
            for line in file:
                game = line.strip()
                game = json.loads(game)
                game = td.deserialize({'M': game['Item']})
                known_ids.add(game['id'])

        lastKey = None
        deleted = 0

        res = table.query(
            KeyConditionExpression='cohort = :masters and id > :id',
            ExpressionAttributeValues={
                ':masters': 'masters',
                ':id': '2024.06.25',
            }
        )
        items = res.get('Items', [])
        lastKey = res.get('LastEvaluatedKey', None)

        with table.batch_writer() as batch:
            deleted += handle_items(items, known_ids, batch)

            while lastKey != None:
                res = table.query(
                    KeyConditionExpression='cohort = :masters and id > :id',
                    ExpressionAttributeValues={
                        ':masters': 'masters',
                        ':id': '2024.06.25',
                    },
                    ExclusiveStartKey=lastKey
                )
                items = res.get('Items', [])
                lastKey = res.get('LastEvaluatedKey', None)

                deleted += handle_items(items, known_ids, batch)

    except Exception as e:
        print(e)
        traceback.print_exc()

    print('Deleted: ', deleted)


if __name__ == '__main__':
    main()
