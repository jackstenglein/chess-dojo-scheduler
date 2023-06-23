import boto3

db = boto3.resource('dynamodb')
table = db.Table('prod-timeline')

old_username = 'google_108384308384746620623'
new_username = 'dd954cdf-6270-4b18-950e-91a67da23422'

def process_items(batch, items):
    updated = 0
    for item in items:
        item['owner'] = new_username
        batch.put_item(Item=item)
        updated += 1
    return updated

def main():
    try:
        lastKey = None
        updated = 0

        res = table.query(KeyConditionExpression=boto3.dynamodb.conditions.Key('owner').eq(old_username))
        lastKey = res.get('LastEvaluatedKey', None)
        items = res.get('Items', [])
        with table.batch_writer() as batch:
            updated += process_items(batch, items)

            while lastKey != None:
                print(lastKey)
                res = table.query(KeyConditionExpression=boto3.dynamodb.conditions.Key('owner').eq(old_username))
                lastKey = res.get('LastEvaluatedKey', None)
                items = res.get('Items', [])
                updated += process_items(batch, items)
    except Exception as e:
        print(e)

    print("Updated: ", updated)


if __name__ == '__main__':
    main()

