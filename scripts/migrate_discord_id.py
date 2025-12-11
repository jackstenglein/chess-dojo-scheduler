import boto3

db = boto3.resource('dynamodb')
table = db.Table('dev-users')


def update_users(users):
    updated = 0
    for user in users:
        if user.get('discordId', 'EMPTY') is None:
            table.update_item(
                Key={'username': user['username']},
                UpdateExpression='REMOVE discordId'
            )
            updated += 1
    return updated


def main():
    try:
        updated = 0

        res = table.scan()
        lastKey = res.get('LastEvaluatedKey', None)
        items = res.get('Items', [])
        updated += update_users(items)

        while lastKey != None:
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
