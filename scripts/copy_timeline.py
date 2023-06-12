import boto3
import uuid

db = boto3.resource('dynamodb')
users_table = db.Table('prod-users')
timeline_table = db.Table('prod-timeline')

def process_users(batch, users):
    updated = 0

    for user in users:
        print(user)
        timeline = user.get('timeline', [])

        for entry in timeline:
            if entry.get('id', '') == '':
                entry['owner'] = user['username']
                entry['id'] = str(uuid.uuid4())
                batch.put_item(Item=entry)
                updated += 1

    return updated


def main():
    try:
        lastKey = None
        updated = 0

        res = users_table.scan()
        lastKey = res.get('LastEvaluatedKey', None)
        items = res.get('Items', [])
        with timeline_table.batch_writer() as batch:
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
