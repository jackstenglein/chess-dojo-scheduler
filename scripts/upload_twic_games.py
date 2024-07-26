import boto3
import json
from boto3.dynamodb.types import TypeDeserializer

db = boto3.resource('dynamodb')
table = db.Table('dev-games')
td = TypeDeserializer()

def main():
    success = 0

    with table.batch_writer() as batch:
        for i in range(1538, 1550):
            if i == 1548:
                continue

            print(f'Uploading file {i}')
            with open(f'twic_games_{i}.json', 'r') as file:
                for line in file:
                    game = line.strip()
                    game = json.loads(game)
                    game = td.deserialize({'M': game['Item']})                
                    batch.put_item(Item=game)
                    success += 1

    print('Successful Uploads: ', success)

if __name__ == '__main__':
    main()
