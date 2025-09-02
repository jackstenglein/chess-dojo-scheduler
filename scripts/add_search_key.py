import boto3
import time
import traceback

db = boto3.resource('dynamodb')
table = db.Table('prod-users')

def update_users(users):
    updated = 0
    with table.batch_writer() as batch:
        for user in users:
            displayName = user.get('displayName', '')
            if displayName is None: 
                displayName = ''

            discordName = user.get('discordUsername', '')
            if discordName is None:
                discordName = ''

            ratings = user.get('ratings', {})
            if ratings is None:
                ratings = {}

            searchKey = f'display:{displayName}_discord:{discordName}'
            
            for rs, rating in ratings.items():
                username = rating.get('username', '')
                if username is None:
                    username = ''
                hideUsername = rating.get('hideUsername', False)

                if username != '' and not hideUsername:
                    searchKey += f'_{rs}:{username}'
            
            searchKey = searchKey.lower()
            user['searchKey'] = searchKey
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
        print(traceback.format_exc())
        print(e)

    print("Updated: ", updated)


if __name__ == '__main__':
    main()
