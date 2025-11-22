import boto3
from boto3.dynamodb.conditions import Attr

db = boto3.resource('dynamodb')
table = db.Table('dev-users')

filter_expression = Attr('subscriptionOverride').eq(True)


def update_users(users):
    updated = 0
    with table.batch_writer() as batch:
        for user in users:
            if not user.get('subscriptionOverride', False):
                continue

            user['paymentInfo'] = {
                'customerId': 'OVERRIDE',
                'subscriptionId': 'OVERRIDE',
                'subscriptionStatus': 'SUBSCRIBED',
                'subscriptionTier': 'BASIC',
            }

            batch.put_item(Item=user)
            updated += 1

    return updated


def main():
    try:
        updated = 0

        res = table.scan(FilterExpression=filter_expression)
        lastKey = res.get('LastEvaluatedKey', None)
        items = res.get('Items', [])
        updated += update_users(items)

        while lastKey != None:
            print(lastKey)
            res = table.scan(FilterExpression=filter_expression, ExclusiveStartKey=lastKey)
            lastKey = res.get('LastEvaluatedKey', None)
            items = res.get('Items', [])
            updated += update_users(items)

    except Exception as e:
        print(e)

    print("Updated: ", updated)


if __name__ == '__main__':
    main()
