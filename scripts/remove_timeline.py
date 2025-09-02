import boto3
import time

db = boto3.resource('dynamodb')
users_table = db.Table('prod-users')

def process_users(batch, users):
    updated = 0

    for user in users:
        user['timeline'] = None
        batch.put_item(Item=user)
        updated += 1
        time.sleep(5)

    return updated


def main():
    try:
        lastKey = None
        updated = 0

        res = users_table.scan()
        lastKey = res.get('LastEvaluatedKey', None)
        items = res.get('Items', [])
        with users_table.batch_writer() as batch:
            updated += process_users(batch, items)

            while lastKey != None:
                print(lastKey)
                res = users_table.scan(ExclusiveStartKey=lastKey)

                lastKey = res.get('LastEvaluatedKey', None)
                items = res.get('Items', [])
                updated += process_users(batch, items)

    except Exception as e:
        print(e)

    print("Updated: ", updated)


if __name__ == '__main__':
    main()
