import boto3

db = boto3.resource('dynamodb')
table = db.Table('dev-games')


def main():
    lastKey = None
    updated = 0

    res = table.scan()
    lastKey = res.get('LastEvaluatedKey', None)
    items = res.get('Items', [])
    for item in items:
        item['white'] = item['white'].lower()
        item['black'] = item['black'].lower()
        table.put_item(Item=item)
        updated += 1

    while lastKey != None:
        print(lastKey)
        res = table.scan(ExclusiveStartKey=lastKey)

        lastKey = res.get('LastEvaluatedKey', None)
        items = res.get('Items', [])
        for item in items:
            item['white'] = item['white'].lower()
            item['black'] = item['black'].lower()
            table.put_item(Item=item)
            updated += 1


    print("Updated: ", updated)

if __name__ == '__main__':
    main()
