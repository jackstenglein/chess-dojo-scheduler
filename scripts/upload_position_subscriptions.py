from dynamodb_json import json_util as json 
import boto3


db = boto3.resource('dynamodb')
table = db.Table('prod-explorer')


def main():
    updated = 0
    with table.batch_writer() as batch:
        with open('subscriptions.json', 'r') as file:
            while line := file.readline():
                item = json.loads(line)
                batch.put_item(Item=item)
                updated += 1
    print('Updated: ', updated)


if __name__ == '__main__':
    main()
