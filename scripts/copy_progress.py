import boto3
import datetime

db = boto3.resource('dynamodb')
table = db.Table('dev-users')

deprecated_reqs = [
    '9ea9d959-d760-46c7-9b42-d4963211fa32',
    '3273809b-5c49-451d-8b85-341536126dbc',
    '1111ec21-72e0-4452-8f2a-1931b97c3988',
    '4f196ecf-9f3d-415a-9fee-e1e062117d75',
]

new_req = 'eb4401de-672f-4d27-8f5a-a9e0dddf9ab6'


def update_users(users):
    updated = 0
    with table.batch_writer() as batch:
        for user in users:

            progress = user.get('progress', None)
            if progress is None or len(progress) == 0: continue

            should_update = False
            for deprecated_id in deprecated_reqs:
                deprecated_progress = progress.get(deprecated_id, None)
                if deprecated_progress is None: continue

                del progress[deprecated_id]

                # new_progress = progress.get(new_req, {
                #     'requirementId': new_req,
                #     'counts': {},
                #     'minutesSpent': {},
                #     'updatedAt': datetime.datetime.now().isoformat(),
                # })

                # new_count = max(new_progress['counts'].get('ALL_COHORTS', 0), deprecated_progress['counts'].get('ALL_COHORTS', 0))
                # new_progress['counts']['ALL_COHORTS'] = new_count
                # new_progress['minutesSpent'] = {**new_progress['minutesSpent'], **deprecated_progress['minutesSpent']}
                # progress[new_req] = new_progress

                should_update = True
            
            if should_update:
                user['progress'] = progress
                batch.put_item(Item=user)
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
