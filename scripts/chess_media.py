import boto3
import time

db = boto3.resource('dynamodb')
table = db.Table('prod-users')

deprecated_reqs = [
    '55064dbf-bb1a-4662-b763-fe0a34fe0a55', # YouTube
    '902f869c-1eb5-47f8-a272-641a24621164', # Twitch
    'ae1525e9-06e3-4a78-a2f1-e0008ae41e1b', # Podcasts
]

new_req_id = 'd2229430-5523-4af5-8e0e-ee967ce81844'

def mergeDictionary(dict_1, dict_2):
   dict_3 = {**dict_1, **dict_2}
   for key, value in dict_3.items():
       if key in dict_1 and key in dict_2:
               dict_3[key] = value + dict_1[key]
   return dict_3

def update_users(users):
    updated = 0
    with table.batch_writer() as batch:
        for user in users:
            progress = user.get('progress', None)
            if progress is None or len(progress) == 0: continue

            new_progress = None

            for req_id in deprecated_reqs:
                req_progress = progress.get(req_id, None)
                if req_progress is None: continue

                if new_progress is None:
                    new_progress = {
                        'requirementId': new_req_id,
                        'minutesSpent': req_progress['minutesSpent'],
                        'updatedAt': req_progress['updatedAt'],
                    }
                else:
                    new_progress['minutesSpent'] = mergeDictionary(new_progress['minutesSpent'], req_progress['minutesSpent'])
            
            if new_progress is not None:
                progress[new_req_id] = new_progress
                user['progress'] = progress
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
        print(e)

    print("Updated: ", updated)


if __name__ == '__main__':
    main()
