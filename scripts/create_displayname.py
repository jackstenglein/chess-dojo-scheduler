import time
import boto3

db = boto3.resource('dynamodb')

def update_users():
    usersTable = db.Table('dev-users')

    try:
        lastKey = None
        updated = 0

        res = usersTable.scan()
        lastKey = res.get('LastEvaluatedKey', None)
        items = res.get('Items', [])
        with usersTable.batch_writer() as batch:
            for item in items:
                if item['dojoCohort'] == None:
                    continue
                item['displayName'] = item['discordUsername']
                batch.put_item(Item=item)
                updated += 1
            
            while lastKey != None:
                print(lastKey)
                res = usersTable.scan(ExclusiveStartKey=lastKey)

                lastKey = res.get('LastEvaluatedKey', None)
                items = res.get('Items', [])
                for item in items:
                    if item['dojoCohort'] == None:
                        continue
                    item['displayName'] = item['discordUsername']
                    batch.put_item(Item=item)
                    updated += 1
    except Exception as e:
        print(e)

    print("Updated users: ", updated)

def update_games():
    gamesTable = db.Table('prod-games')

    try:
        lastKey = {'id': '2022.07.08_154e5353-7e9a-4b37-b1e1-d246fc7c5566', 'cohort': '1600-1700'}
        updated = 0

        res = gamesTable.scan(ExclusiveStartKey=lastKey)
        lastKey = res.get('LastEvaluatedKey', None)
        items = res.get('Items', [])
        with gamesTable.batch_writer() as batch:
            for item in items:
                if item.get('comments', None) != None:
                    for comment in item['comments']:
                        comment['ownerDisplayName'] = comment['ownerDiscord']

                if item.get('ownerDiscord', None) == None or item['ownerDiscord'] == '':
                    if item.get('comments', None) != None and len(item.get('comments', [])) > 0:
                        batch.put_item(Item=item)
                        updated += 1
                        time.sleep(2)
                    continue

                item['ownerDisplayName'] = item['ownerDiscord']
                batch.put_item(Item=item)
                updated += 1
                time.sleep(2)
            
            while lastKey != None:
                print(lastKey)
                res = gamesTable.scan(ExclusiveStartKey=lastKey)

                lastKey = res.get('LastEvaluatedKey', None)
                items = res.get('Items', [])
                for item in items:
                    if item.get('comments', None) != None:
                        for comment in item['comments']:
                            comment['ownerDisplayName'] = comment['ownerDiscord']

                    if item.get('ownerDiscord', None) == None or item['ownerDiscord'] == '':
                        if item.get('comments', None) != None and len(item.get('comments', [])) > 0:
                            batch.put_item(Item=item)
                            updated += 1
                            time.sleep(2)
                        continue

                    item['ownerDisplayName'] = item['ownerDiscord']
                    batch.put_item(Item=item)
                    updated += 1
                    time.sleep(2)

    except Exception as e:
        print(e)

    print("Updated games: ", updated)

def update_availabilities():
    availabilitiesTable = db.Table('prod-availabilities')

    try:
        lastKey = None
        updated = 0

        res = availabilitiesTable.scan()
        lastKey = res.get('LastEvaluatedKey', None)
        items = res.get('Items', [])
        with availabilitiesTable.batch_writer() as batch:
            for item in items:
                if item['id'] == 'STATISTICS':
                    continue
                if item.get('participants', None) != None:
                    for participant in item['participants']:
                        participant['displayName'] = participant['discord']

                item['ownerDisplayName'] = item['ownerDiscord']
                batch.put_item(Item=item)
                updated += 1
            
            while lastKey != None:
                print(lastKey)
                res = availabilitiesTable.scan(ExclusiveStartKey=lastKey)

                lastKey = res.get('LastEvaluatedKey', None)
                items = res.get('Items', [])
                for item in items:
                    if item['id'] == 'STATISTICS':
                        continue
                    if item.get('participants', None) != None:
                        for participant in item['participants']:
                            participant['displayName'] = participant['discord']

                    item['ownerDisplayName'] = item['ownerDiscord']
                    batch.put_item(Item=item)
                    updated += 1

    except Exception as e:
        print(e)

    print("Updated Availabilities: ", updated)



if __name__ == '__main__':
    update_availabilities()
