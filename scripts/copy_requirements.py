import boto3

db = boto3.resource('dynamodb')
dev = db.Table('dev-requirements')
prod = db.Table('prod-requirements')

def matches(item):
    return 'Algorithm' in item.get('name', '')

def main():
    try:
        lastKey = None
        copied = 0

        res = dev.scan()
        lastKey = res.get('LastEvaluatedKey', None)
        items = res.get('Items', [])
        with prod.batch_writer() as batch:
            for item in items:
                if matches(item):
                    batch.put_item(Item=item)
                    copied += 1
            
            while lastKey != None:
                print(lastKey)
                res = dev.scan(ExclusiveStartKey=lastKey)

                lastKey = res.get('LastEvaluatedKey', None)
                items = res.get('Items', [])
                for item in items:
                    if matches(item):
                        batch.put_item(Item=item)
                        copied += 1

    except Exception as e:
        print(e)

    print("Copied: ", copied)


if __name__ == '__main__':
    main()
