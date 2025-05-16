import boto3
from dynamodb_json import json_util

db = boto3.resource('dynamodb')
table = db.Table('prod-users')


# NON_DOJO_TASKS = [
#     { 'id': '677ef22c-98dc-42a5-a44b-14bb8ca47fb3', 'name': 'Blitz', 'description': 'Shame!' },
#     {'id': 'dbf9592c-87d8-4d8a-b8be-c7a83bcf55f0', 'name': 'Rapid', 'description': 'Time spent playing rapid' },
#     {'id': '79e2dad0-ffeb-400c-8b2e-d4a7638d9c8d', 'name': 'Books', 'description': 'Time spent on any non-dojo books' },
#     {'id': '856d6e96-a413-4ac2-8265-a780e63db57e', 'name': 'Tactics', 'description': 'Time spent on any non-dojo tactics training'},
#     {'id': 'c320e2de-422b-4efa-8c18-86f941bf3cc4', 'name': 'Openings', 'description': "Time spent on any opening study that is not dojo-approved (IE: not in your cohort's program)"},
#     {'id': 'd2229430-5523-4af5-8e0e-ee967ce81844', 'name': 'Chess Media', 'description': 'Time spent on chess-related media: YouTube, Twitch, podcasts, etc'}
# ]

firstBookOfMorphy = {
 "status": "ACTIVE",
 "id": "c0462786-61ee-4947-b055-53f606b50be1",
 "category": "Middlegames + Strategy",
 "counts": {
  "900-1000": 69
 },
 "dailyName": "Read First Book of Morphy - {{time}}",
 "description": "First Book of Morphy. del Rosario <a href=\"https://amzn.to/3mpoG8X\" target=\"_blank\" rel=\"noreferrer\">https://amzn.to/3mpoG8X</a>",
 "expirationDays": -1,
 "freeDescription": "",
 "isFree": True,
 "name": "Read First Book of Morphy",
 "numberOfCohorts": 1,
 "progressBarSuffix": "Games",
 "scoreboardDisplay": "PROGRESS_BAR",
 "shortName": "",
 "sortPriority": "03.02.02",
 "startCount": 0,
 "totalScore": 0,
 "unitScore": 0.1449275362,
 "unitScoreOverride": {},
 "updatedAt": "2025-05-15T00:23:53.757321Z",
 "videoUrls": [
 ]
}

karpovEndgame = {
 "status": "ACTIVE",
 "id": "fed80aba-4152-4468-94d7-f84709b07cf5",
 "category": "Endgame",
 "counts": {
  "2100-2200": 350,
  "2200-2300": 350
 },
 "dailyName": "Read Endgame Virtuoso (Karpov) - {{time}}",
 "description": "Endgame Virtuoso. Karpov <a href=\"https://amzn.to/44mSXr8\" target=\"_blank\" rel=\"noreferrer\">https://amzn.to/44mSXr8</a>",
 "expirationDays": -1,
 "freeDescription": "",
 "name": "Read Endgame Virtuoso (Karpov)",
 "numberOfCohorts": 1,
 "progressBarSuffix": " Pages",
 "scoreboardDisplay": "PROGRESS_BAR",
 "shortName": "",
 "sortPriority": "04.02.12",
 "startCount": 0,
 "totalScore": 0,
 "unitScore": 0.02857142857,
 "unitScoreOverride": {},
 "updatedAt": "2025-05-02T23:17:07.971500Z",
 "videoUrls": [
 ]
}

tasks = [firstBookOfMorphy]

# COUNTS = {
#     '0-300': 1,
#     '300-400': 1,
#     '400-500': 1,
#     '500-600': 1,
#     '600-700': 1,
#     '700-800': 1,
#     '800-900': 1,
#     '900-1000': 1,
#     '1000-1100': 1,
#     '1100-1200': 1,
#     '1200-1300': 1,
#     '1300-1400': 1,
#     '1400-1500': 1,
#     '1500-1600': 1,
#     '1600-1700': 1,
#     '1700-1800': 1,
#     '1800-1900': 1,
#     '1900-2000': 1,
#     '2000-2100': 1,
#     '2100-2200': 1,
#     '2200-2300': 1,
#     '2300-2400': 1,
#     '2400+': 1,
# }


def update_users(users):
    updated = 0

    with table.batch_writer() as batch:
        for user in users:
            is_updated = False
            for task in tasks:
                if task['id'] not in user.get('progress', {}): continue

                custom_tasks = user.get('customTasks', [])
                if custom_tasks is None:
                    custom_tasks = []

                custom_tasks.append({
                    'id': task['id'],
                    'owner': user['username'],
                    'name': task['name'],
                    'description': task['description'],
                    'counts': task['counts'],
                    'scoreboardDisplay': task['scoreboardDisplay'],
                    'category': task['category'],
                    'numberOfCohorts': task['numberOfCohorts'],
                    'progressBarSuffix': task['progressBarSuffix'],
                    'updatedAt': '2025-05-16T19:34:51Z',
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
