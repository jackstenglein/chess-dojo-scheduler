import boto3
import traceback
import time
from dateutil import parser
import datetime


db = boto3.resource('dynamodb')
source = db.Table('prod-tournaments')
dest = db.Table('dev-events')


def get_time_control_type(limit, increment):
    if int(limit) == 900 and int(increment) == 5:
        return 'RAPID'
    if int(limit) == 300 and int(increment) == 3:
        return 'BLITZ'
    if int(limit) == 5400 and int(increment) == 30:
        return 'CLASSICAL'
    if int(limit) == 3600 and int(increment) == 30:
        return 'CLASSICAL'
    if int(limit) == 2700 and int(increment) == 30:
        return 'CLASSICAL'
    if int(limit) == 180 and int(increment) == 2:
        return 'BLITZ'
    
    raise Exception(f'Invalid time control: {int(limit)}+{int(increment)}')
        


def event_from_arena(arena):
    startTime = arena.get('startsAt').split('#')[0]
    startDate = parser.parse(startTime)
    endDate = startDate + datetime.timedelta(minutes=int(arena.get('lengthMinutes')))
    expirationDate = endDate + datetime.timedelta(weeks=6)

    event = {
        'id': arena.get('id'),
        'type': 'LIGA_TOURNAMENT',
        'owner': 'Sensei',
        'ownerDisplayName': 'Sensei',
        'title': arena.get('name'),
        'startTime': startTime,
        'endTime': endDate.isoformat(),
        'expirationTime': int(expirationDate.timestamp()),
        'status': 'SCHEDULED',
        'location': arena.get('url'),
        'description': arena.get('description', ''),
        'participants': [],
        'ligaTournament': {
            'type': 'ARENA',
            'id': arena.get('id'),
            'rated': arena.get('rated', False),
            'timeControlType': get_time_control_type(arena.get('limitSeconds'), arena.get('incrementSeconds')),
            'limitSeconds': arena.get('limitSeconds'),
            'incrementSeconds': arena.get('incrementSeconds'),
            'fen': arena.get('fen', ''),
        }
    }
    return event


def events_from_swiss(swiss):
    numRounds = swiss.get('numRounds', 0)
    result = []

    if 'Monthly' in swiss.get('name'):
        for i in range(int(numRounds)):
            startTime = swiss.get('startsAt').split('#')[0]
            startDate = parser.parse(startTime) + datetime.timedelta(weeks=i)
            endDate = startDate + datetime.timedelta(minutes=60)
            expirationDate = endDate + datetime.timedelta(weeks=6)

            result.append({
                'id': swiss.get('id') + f'-round-{i+1}',
                'type': 'LIGA_TOURNAMENT',
                'owner': 'Sensei',
                'ownerDisplayName': 'Sensei',
                'title': swiss.get('name'),
                'startTime': startDate.isoformat(),
                'endTime': endDate.isoformat(),
                'expirationTime': int(expirationDate.timestamp()),
                'status': 'SCHEDULED',
                'location': swiss.get('url'),
                'description': swiss.get('description', ''),
                'participants': [],
                'ligaTournament': {
                    'type': 'SWISS',
                    'id': swiss.get('id'),
                    'rated': swiss.get('rated', False),
                    'timeControlType':  get_time_control_type(swiss.get('limitSeconds'), swiss.get('incrementSeconds')),
                    'limitSeconds': swiss.get('limitSeconds'),
                    'incrementSeconds': swiss.get('incrementSeconds'),
                    'fen': swiss.get('fen', ''),
                    'numRounds': numRounds,
                    'currentRound': i + 1,
                }
            })
    else:
        startTime = swiss.get('startsAt').split('#')[0]
        startDate = parser.parse(startTime)
        endDate = startDate + datetime.timedelta(minutes=60)
        expirationDate = endDate + datetime.timedelta(weeks=6)

        result.append({
            'id': swiss.get('id'),
            'type': 'LIGA_TOURNAMENT',
            'owner': 'Sensei',
            'ownerDisplayName': 'Sensei',
            'title': swiss.get('name'),
            'startTime': startTime,
            'endTime': endDate.isoformat(),
            'expirationTime': int(expirationDate.timestamp()),
            'status': 'SCHEDULED',
            'location': swiss.get('url'),
            'description': swiss.get('description', ''),
            'participants': [],
            'ligaTournament': {
                'type': 'SWISS',
                'id': swiss.get('id'),
                'rated': swiss.get('rated', False),
                'timeControlType': get_time_control_type(swiss.get('limitSeconds'), swiss.get('incrementSeconds')),
                'limitSeconds': swiss.get('limitSeconds'),
                'incrementSeconds': swiss.get('incrementSeconds'),
                'fen': swiss.get('fen', ''),
                'numRounds': numRounds,
            }
        })
    return result


def copy_tournaments(tournaments):
    copied = 0
    with dest.batch_writer() as batch:
        for tournament in tournaments:
            tournamentType = tournament.get('type', '')
            events = []
            if tournamentType == 'ARENA':
                events.append(event_from_arena(tournament))
            elif tournamentType == 'SWISS':
                for event in events_from_swiss(tournament):
                    events.append(event)

            print('Events:', events)
            
            for event in events:
                batch.put_item(Item=event)
                copied += 1
                time.sleep(2)

    return copied


def main():
    try:
        copied = 0

        res = source.scan()
        lastKey = res.get('LastEvaluatedKey', None)
        items = res.get('Items', [])
        copied += copy_tournaments(items)

        while lastKey != None:
            time.sleep(5)
            print(lastKey)
            res = source.scan(ExclusiveStartKey=lastKey)
            lastKey = res.get('LastEvaluatedKey', None)
            items = res.get('Items', [])
            copied += copy_tournaments(items)

    except Exception as e:
        print(traceback.format_exc())
        print(e)

    print("Copied: ", copied)


if __name__ == '__main__':
    main()
