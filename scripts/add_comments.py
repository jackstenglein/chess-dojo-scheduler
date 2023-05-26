import boto3
import time

db = boto3.resource('dynamodb')
table = db.Table('prod-games')


def main():
    try:
        lastKey = None
        updated = 0

        res = table.scan()
        lastKey = res.get('LastEvaluatedKey', None)
        items = res.get('Items', [])
        with table.batch_writer() as batch:
            for item in items:
                if item.get('comments', None) == None:
                    item['comments'] = []
                    batch.put_item(Item=item)
                    updated += 1
                    time.sleep(1)

            while lastKey != None:
                print(lastKey)
                res = table.scan(ExclusiveStartKey=lastKey)

                lastKey = res.get('LastEvaluatedKey', None)
                items = res.get('Items', [])
                for item in items:
                    if item.get('comments', None) == None:
                        item['comments'] = []
                        batch.put_item(Item=item)
                        updated += 1
                        time.sleep(1)

    except Exception as e:
        print(e)

    print("Updated: ", updated)


if __name__ == '__main__':
    main()
