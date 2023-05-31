import boto3
import time

db = boto3.resource('dynamodb')
table = db.Table('prod-users')

deprecated_reqs = [
    '8df4f37e-1ea6-4ad6-af1b-a41b2a50af8b',
    '3e0f5105-eee1-42b0-8a4d-5df83d334314',
    '3a8cbf0c-1a6f-49a4-83f5-4cf985306f55',
    '3d488806-6f92-406d-a0e2-4e74ccafbf65',
]

req_map = {
    '8df4f37e-1ea6-4ad6-af1b-a41b2a50af8b': {
        "1000-1100": 'be1611a0-fe0b-47d4-ae9a-f14a5ad763d1',
        "1100-1200": '9a4cbce7-dcce-4d14-b657-55256c0bff1a',
        "1200-1300": '8d8131ea-6ba3-4685-8f18-8f4ab1a42243',
        "1300-1400": '2bd2e6e6-ac0f-4ab1-9e1e-b698b04536f9',
        "1400-1500": '202acb4a-0031-4947-ab89-67150bf33c0c',
        "1500-1600": '2f43c969-7b6c-4f57-b116-27a0058d8095',
        "1600-1700": 'e984c523-392a-4667-8db2-f86fa4c77aa6',
        "1700-1800": 'b9ea6e13-c1b2-48ca-94ed-a838e81c0145',
        "1800-1900": '5c34e73a-3745-48c6-a796-02f4763076d6',
        "1900-2000": '94eaaea6-750d-4383-8139-6ef1261f2733',
        "2000-2100": '208b028a-c951-428c-ba38-8d3ade63b908',
        "2100-2200": 'e2f644e2-eaee-4297-8264-c8f2edbfb9e8',
        "2200-2300": 'cc45a791-e3e9-40e0-84be-4d1b4e310a06',
        "2300-2400": 'd4a6d99e-d270-4c08-a878-01acb41bca10',
        "2400+": 'efc338c5-0af2-411a-8937-2e0394d25468',
    },
    
    '3e0f5105-eee1-42b0-8a4d-5df83d334314': {
        "1400-1500": 'c53c6f02-390c-495a-9b42-b64a6140ce48',
        "1500-1600": '91b77dd2-6e61-467a-93f2-7b81b71a59ee',
        "1600-1700": '03961fde-3c81-4095-829d-836e35017f5a',
        "1700-1800": '0e0fc112-7c48-4f81-afbc-6c50b4d15ab5',
        "1800-1900": 'ed64b5f1-375a-414a-a32a-dc6c335a57d6',
        "1900-2000": 'b488d718-9420-409e-9b84-2304fba84083',
        "2000-2100": '48f3fe16-2970-4e94-a6b4-1723842b221e',
        "2100-2200": '14a1f2e5-979c-4fe7-9a63-616a3ba4a3e3',
        "2200-2300": 'ccf6853e-6026-4bbd-a3a0-ffa6cbb1175d',
        "2300-2400": '0679d646-a66c-4423-848f-e50b38f56844',
        "2400+": 'ffd74b25-bb1a-41e9-99de-aa481fb76f9a',
    },

    '3a8cbf0c-1a6f-49a4-83f5-4cf985306f55': {
        "1800-1900": '58faa3ba-c41c-4650-91e1-803b7950205f',
        "1900-2000": '76d7c2da-6c14-44a6-9e9b-c0cf55a4c794',
        "2000-2100": '127f34d4-bc17-4776-acf8-dcd55821c42e',
        "2100-2200": '2c905dc0-834e-4566-8349-50401d285518',
        "2200-2300": '5ad61e06-044b-453c-9393-c7d9e37c45ef',
        "2300-2400": '06bc39d3-120c-464f-a14d-3c3cafb08488',
        "2400+": 'de7e0ea7-fdcb-4e3f-a393-927f6e3c7db5',
    },

    '3d488806-6f92-406d-a0e2-4e74ccafbf65': {
        "2200-2300": '01a471dd-567e-4926-980b-db1ebca34dc8',
        "2300-2400": '429978fa-b4e6-436f-bcba-6ddb150a3a5e',
        "2400+": '6e5546fd-37be-49bb-bd02-5df8f7eb4b6e',
    },
}


def update_users(users):
    updated = 0
    with table.batch_writer() as batch:
        for user in users:
            if user.get('numberOfGraduations', 0) > 0:
                continue
            cohort = user['dojoCohort']

            progress = user.get('progress', None)
            if progress is None or len(progress) == 0: continue

            should_update = False
            for req_id in deprecated_reqs:
                req_progress = progress.get(req_id, None)
                if req_progress is None: continue

                new_req_id = req_map[req_id].get(cohort, '')
                if new_req_id == '':
                    continue
                
                should_update = True
                new_progress = {
                    'requirementId': new_req_id,
                    'counts': req_progress['counts'],
                    'minutesSpent': req_progress['minutesSpent'],
                    'updatedAt': req_progress['updatedAt'],
                }
                progress[new_req_id] = new_progress
            
            if should_update:
                user['progress'] = progress
                batch.put_item(Item=user)
                updated += 1
                time.sleep(2)

    return updated


def main(): 
    try:
        lastKey = {'username': 'google_104406360194364423918'}
        updated = 0

        res = table.scan(ExclusiveStartKey=lastKey)
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
