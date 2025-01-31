import boto3
from dynamodb_json import json_util

db = boto3.resource('dynamodb')
table = db.Table('dev-users')


NON_DOJO_TASKS = [
    { 'id': '677ef22c-98dc-42a5-a44b-14bb8ca47fb3', 'name': 'Blitz', 'description': 'Shame!' },
    {'id': 'dbf9592c-87d8-4d8a-b8be-c7a83bcf55f0', 'name': 'Rapid', 'description': 'Time spent playing rapid' },
    {'id': '79e2dad0-ffeb-400c-8b2e-d4a7638d9c8d', 'name': 'Books', 'description': 'Time spent on any non-dojo books' },
    {'id': '856d6e96-a413-4ac2-8265-a780e63db57e', 'name': 'Tactics', 'description': 'Time spent on any non-dojo tactics training'},
    {'id': 'c320e2de-422b-4efa-8c18-86f941bf3cc4', 'name': 'Openings', 'description': "Time spent on any opening study that is not dojo-approved (IE: not in your cohort's program)"},
    {'id': 'd2229430-5523-4af5-8e0e-ee967ce81844', 'name': 'Chess Media', 'description': 'Time spent on chess-related media: YouTube, Twitch, podcasts, etc'}
]

COUNTS = {
    '0-300': 1,
    '300-400': 1,
    '400-500': 1,
    '500-600': 1,
    '600-700': 1,
    '700-800': 1,
    '800-900': 1,
    '900-1000': 1,
    '1000-1100': 1,
    '1100-1200': 1,
    '1200-1300': 1,
    '1300-1400': 1,
    '1400-1500': 1,
    '1500-1600': 1,
    '1600-1700': 1,
    '1700-1800': 1,
    '1800-1900': 1,
    '1900-2000': 1,
    '2000-2100': 1,
    '2100-2200': 1,
    '2200-2300': 1,
    '2300-2400': 1,
    '2400+': 1,
}


def update_users(users):
    updated = 0

    with table.batch_writer() as batch:
        for user in users:
            is_updated = False
            for task in NON_DOJO_TASKS:
                if task['id'] not in user.get('progress', {}): continue

                custom_tasks = user.get('customTasks', [])
                if custom_tasks is None:
                    custom_tasks = []

                custom_tasks.append({
                    'id': task['id'],
                    'owner': user['username'],
                    'name': task['name'],
                    'description': task['description'],
                    'counts': COUNTS,
                    'scoreboardDisplay': 'NON_DOJO',
                    'category': 'Non-Dojo',
                    'numberOfCohorts': -1,
                    'updatedAt': '2025-01-27T19:34:51Z',
                })
                user['customTasks'] = custom_tasks
                is_updated = True
            
            if is_updated:
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
