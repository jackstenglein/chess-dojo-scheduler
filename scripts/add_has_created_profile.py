import boto3
import time

db = boto3.resource('dynamodb')
table = db.Table('prod-users')


def main():
    try:
        lastKey = None
        updated = 0

        res = table.scan()
        lastKey = res.get('LastEvaluatedKey', None)
        items = res.get('Items', [])
        with table.batch_writer() as batch:
            for item in items:
                cohort = item.get('dojoCohort', 'NO_COHORT')
                rating_system = item.get('ratingSystem', None)
                if cohort != 'NO_COHORT' and rating_system is not None:
                    item['hasCreatedProfile'] = True
                    batch.put_item(Item=item)
                    updated += 1
                    time.sleep(3)

            while lastKey != None:
                print(lastKey)
                res = table.scan(ExclusiveStartKey=lastKey)

                lastKey = res.get('LastEvaluatedKey', None)
                items = res.get('Items', [])
                for item in items:
                    cohort = item.get('dojoCohort', 'NO_COHORT')
                    rating_system = item.get('ratingSystem', None)
                    if cohort != 'NO_COHORT' and rating_system is not None:
                        item['hasCreatedProfile'] = True
                        batch.put_item(Item=item)
                        updated += 1
                        time.sleep(3)

    except Exception as e:
        print(e)

    print("Updated: ", updated)


if __name__ == '__main__':
    main()
