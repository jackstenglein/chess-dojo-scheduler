import boto3
from botocore.exceptions import ClientError
import datetime

env = 'dev'
db = boto3.resource('dynamodb')
directories_table = db.Table(f'{env}-directories')
users_table = db.Table(f'{env}-users')
games_table = db.Table(f'{env}-games')


# def process_directories(directories):
#     updated = 0
#     with directories_table.batch_writer() as batch:
#         for directory in directories:
#             if directory['id'] != 'home' or 'mygames' in directory['items']: continue

#             mygames = {
#                 'owner': directory['owner'],
#                 'id': 'mygames',
#                 'parent': 'home',
#                 'name': 'My Games',
#                 'description': 'Serious classical games I have played',
#                 'visibility': 'PUBLIC',
#                 'createdAt': directory['createdAt'],
#                 'updatedAt': directory['createdAt'],
#                 'items': {},
#                 'itemIds': [],
#             }
#             batch.put_item(Item=mygames)

#             directory['items']['mygames'] = {
#                 'type': 'DIRECTORY',
#                 'id': 'mygames',
#                 'metadata': {
#                     'createdAt': directory['createdAt'],
#                     'updatedAt': directory['createdAt'],
#                     'visibility': 'PUBLIC',
#                     'name': 'My Games',
#                     'description': 'Serious classical games I have played',
#                 }
#             }
#             directory['itemIds'].insert(0, 'mygames')
#             batch.put_item(Item=directory)
#             updated += 1

#     return updated


def fetch_games(user):
    games = []
    resp = games_table.query(
        IndexName='OwnerIdx',
        KeyConditionExpression='#owner = :owner',
        ExpressionAttributeNames={'#owner': 'owner'},
        ExpressionAttributeValues={':owner': user['username']},
    )
    games.extend(resp.get('Items', []))
    lastKey = resp.get('LastEvaluatedKey', None)

    while lastKey != None:
        print("fetch_games: ", lastKey)
        resp = games_table.query(
            IndexName='OwnerIdx',
            KeyConditionExpression='#owner = :owner',
            ExpressionAttributeNames={'#owner': 'owner'},
            ExpressionAttributeValues={':owner': user['username']},
        )
        games.extend(resp.get('Items', []))
        lastKey = resp.get('LastEvaluatedKey', None)
    
    return games


def process_user(user):
    print("Processing user: ", user["username"])
    games = fetch_games(user)
    print(f'Got {len(games)} games for user {user["username"]}')
    
    mygames = {
        'owner': user['username'],
        'id': 'mygames',
        'parent': 'home',
        'name': 'My Games',
        'description': 'Serious classical games I have played',
        'visibility': 'PUBLIC',
        'createdAt': datetime.datetime.now(datetime.timezone.utc).isoformat().replace('+00:00', 'Z'),
        'updatedAt': datetime.datetime.now(datetime.timezone.utc).isoformat().replace('+00:00', 'Z'),
        'items': {
            f'{game["cohort"]}/{game["id"]}': {
                "type": "OWNED_GAME",
                "id": f'{game["cohort"]}/{game["id"]}',
                "metadata": {
                    "cohort": game["cohort"],
                    "id": game["id"],
                    "owner": game["owner"],
                    "ownerDisplayName": game.get("ownerDisplayName", ""),
                    "createdAt": game.get("createdAt", ''),
                    "white": game.get("white", ''),
                    "black": game.get("black", ''),
                    "whiteElo": game.get("headers", {}).get("WhiteElo", None),
                    "blackElo": game.get("headers", {}).get("BlackElo", None),
                    "result": game.get("headers", {}).get("Result", None),
                    "unlisted": game.get("unlisted", False),
                },
            } for game in games
        },
        'itemIds': [f'{game["cohort"]}/{game["id"]}' for game in games],
    }
    try:
        directories_table.put_item(Item=mygames, ConditionExpression='attribute_not_exists(description)')
    except ClientError as e:
        if e.response['Error']['Code'] != 'ConditionalCheckFailedException':
            raise e
        print(f'{user["username"]} already has mygames')

    mygames_subitem = {
        'type': 'DIRECTORY',
        'id': 'mygames',
        'metadata': {
            'createdAt': mygames['createdAt'],
            'updatedAt': mygames['updatedAt'],
            'visibility': 'PUBLIC',
            'name': 'My Games',
            'description': 'Serious classical games I have played',
        }
    }
    try:
        default_home = {
            'owner': user['username'],
            'id': 'home',
            'parent': '00000000-0000-0000-0000-000000000000',
            'name': 'Home',
            'visibility': 'PUBLIC',
            'createdAt': datetime.datetime.now(datetime.timezone.utc).isoformat().replace('+00:00', 'Z'),
            'updatedAt': datetime.datetime.now(datetime.timezone.utc).isoformat().replace('+00:00', 'Z'),
            'items': {'mygames': mygames_subitem},
            'itemIds': ['mygames'],
        }
        directories_table.put_item(Item=default_home, ConditionExpression='attribute_not_exists(visibility)')
        print('Added default home directory to user')
    except ClientError as e:
        if e.response['Error']['Code'] != 'ConditionalCheckFailedException':
            raise e
        print('User already has home directory, updating.')
        directories_table.update_item(
            Key={'owner': user['username'], 'id': 'home'},
            UpdateExpression='SET #items.#mygames = :mygames, #itemIds = list_append(#itemIds, :id)',
            ExpressionAttributeNames={'#items':'items', '#itemIds': 'itemIds', '#mygames': 'mygames'},
            ExpressionAttributeValues={':mygames': mygames_subitem, ':id': ['mygames']},
        )
    
    print('Created mygames directory and added to home. Adding mygames to all games')
    for game in games:
        games_table.update_item(
            Key={'cohort': game['cohort'], 'id': game['id']},
            UpdateExpression='ADD #directories :mygames',
            ExpressionAttributeNames={'#directories': 'directories'},
            ExpressionAttributeValues={
                ':mygames': set([f'{user["username"]}/mygames'])
            }
        )
    print('Added mygames to all games. Finished processing user: ', user['username'])

def process_users(users):
    updated = 0
    for user in users:
        try:
            process_user(user)
            updated += 1
        except Exception as e:
            print(f'Failed to process user {user["username"]}: ', e)
        print()

    return updated



def main():
    try:
        updated = 0
        res = users_table.scan()
        items = res.get('Items', [])
        lastKey = res.get('LastEvaluatedKey', None)
        updated += process_users(items)

        while lastKey != None:
            print('*** Starting new set of users:')
            print(lastKey)
            print()
            res = users_table.scan(ExclusiveStartKey=lastKey)
            items = res.get('Items', [])
            lastKey = res.get('LastEvaluatedKey', None)
            updated += process_users(items)
    except Exception as e:
        print(e)
    
    print("Updated: ", updated)


if __name__ == '__main__':
    main()
