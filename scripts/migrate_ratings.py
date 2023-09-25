import boto3
import time

db = boto3.resource('dynamodb')
table = db.Table('prod-users')

def update_users(users):
    updated = 0
    with table.batch_writer() as batch:
        for user in users:
            ratings = user.get('ratings', {})
            if ratings is None:
                ratings = {}

            ratingHistories = user.get('ratingHistories', {})
            if ratingHistories is None:
                ratingHistories = {}

            if len(ratings) == 0 or len(ratingHistories) == 0:
                user['ratings'] = ratings
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
