import boto3
import os
from dynamodb_json import json_util as json


db = boto3.resource('dynamodb')
table = db.Table('prod-explorer')


# def process_items(items):
#     deleted = 0
#     with table.batch_writer() as batch:
#         for item in items:
#             if item['id'].startswith('GAME#masters'):
#                 batch.delete_item(Key={
#                     'normalizedFen': item['normalizedFen'],
#                     'id': item['id'],
#                 })
#                 deleted += 1
#     return deleted


def main():
    try:
        found = 0
        processed = 0

        with table.batch_writer() as batch:
            with open('output.json', 'r') as f:
                for line in f:
                    processed += 1
                    item = json.loads(line.strip())['Item']

                    new_item = {
                        'follower': item['id'].split('#')[1],
                        'normalizedFen': item['normalizedFen'],
                        'id': item['id'],
                        'followMetadata': {
                            'dojo': {
                                'enabled': True,
                                'minCohort': item.get('minCohort', ''),
                                'maxCohort': item.get('maxCohort', ''),
                                'disableVariations': item.get('disableVariations', False),
                            },
                            'masters': {
                                'enabled': False,
                            },
                        }
                    }
                    # print(new_item)
                    batch.put_item(Item=new_item)

        # with open('output.json', 'w') as out:
        #     for filename in os.listdir('explorer-positions'):
        #         print(f'Processing file {filename}')
        #         print('Processed: ', processed)
        #         print('Found: ', found)

        #         file = os.path.join('explorer-positions', filename)
        #         with open(file, 'r') as f:
        #             for line in f:
        #                 processed += 1
        #                 item = json.loads(line.strip())['Item']
        #                 if item['id'].startswith('FOLLOWER#'):
        #                     out.write(line)
        #                     out.write('\n')

    except Exception as e:
        print(e)

    print("Finished. Total Processed:", processed, ", Found: ", found)


if __name__ == '__main__':
    main()
