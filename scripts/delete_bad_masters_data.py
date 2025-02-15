import boto3
import os
from dynamodb_json import json_util as json


db = boto3.resource('dynamodb')
table = db.Table('prod-explorer')


def process_items(items):
    deleted = 0
    with table.batch_writer() as batch:
        for item in items:
            if item['id'].startswith('GAME#masters'):
                batch.delete_item(Key={
                    'normalizedFen': item['normalizedFen'],
                    'id': item['id'],
                })
                deleted += 1
    return deleted


def main():
    try:
        deleted = 0
        processed = 0

        for filename in os.listdir('explorer-positions'):
            print(f'Processing file {filename}')
            print('Processed: ', processed)
            print('Deleted: ', deleted)

            items = []
            file = os.path.join('explorer-positions', filename)
            with open(file, 'r') as f:
                for line in f:
                    processed += 1
                    item = json.loads(line.strip())['Item']
                    if item['id'].startswith('GAME#masters'):
                        items.append(item)

            print(f'Will delete {len(items)} items')
            deleted += process_items(items)
    except Exception as e:
        print(e)

    print("Finished. Total Processed:", processed, ", Deleted: ", deleted)


if __name__ == '__main__':
    main()
