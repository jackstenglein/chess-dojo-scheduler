import boto3

db = boto3.resource('dynamodb')
table = db.Table('prod-timeline')
userTable = db.Table('prod-users')

def processItems(items, batch):
    updated = 0
    for item in items:
        try:
            ownerDisplayName = item.get('ownerDisplayName', None)
            if ownerDisplayName == None or ownerDisplayName == "":
                user = userTable.get_item(Key={'username': item['owner']})['Item']
                if 'displayName' not in user:
                    print(user)
                item['ownerDisplayName'] = user.get('displayName', '')
                batch.put_item(Item=item)
                updated += 1
        except Exception as e:
            print(item)
            print(e)

    return updated

def main():
    try:
        lastKey = {'id': '2023-09-11_783cda4c-2f87-4bfa-bceb-d8c2ad5ba321', 'owner': '0c8babd0-7451-4674-8249-787589ce9a9b'}
        updated = 0

        # res = table.scan()
        # lastKey = res.get('LastEvaluatedKey', None)
        # items = res.get('Items', [])
        with table.batch_writer() as batch:
            # updated += processItems(items, batch)

            while lastKey != None:
                print(lastKey)
                res = table.scan(ExclusiveStartKey=lastKey)

                lastKey = res.get('LastEvaluatedKey', None)
                items = res.get('Items', [])
                updated += processItems(items, batch)

    except Exception as e:
        print(e)

    print("Updated: ", updated)


if __name__ == '__main__':
    main()
