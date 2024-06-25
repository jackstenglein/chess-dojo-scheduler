import csv
from caissabase_stats import load_twic_info, get_time_control, read_pgn, get_event
import chess.pgn
import uuid
import datetime
import io
import boto3
import traceback


db = boto3.resource('dynamodb')
table = db.Table('dev-games')



def main():
    skip = 102
    max_count = 1
    upload_pgns(max_count, skip, '/Users/jackstenglein/Documents/caissabase-2024-04-27.pgn')


def upload_pgns(max_count, skip, filename):
    twic_info = load_twic_info('twic_output_full_4.csv')
    time_control_info = load_time_control_info('time_controls.csv')

    skipped = 0
    count = 0
    failed = 0

    with table.batch_writer() as batch:
        with open(filename, 'r', encoding='utf-8-sig') as file:
            while pgn := read_pgn(file):
                if skipped < skip:
                    skipped += 1
                    continue

                if count % 20000 == 0:
                    print('Success: ', count)
                    print('Skipped: ', skipped)
                    print('Failed: ', failed)
                    print('Total: ', count+failed+skipped, end='\n\n\n')

                try:
                    game = chess.pgn.read_game(io.StringIO(pgn))
                    if game is None:
                        failed += 1
                        write_failure(pgn)
                        continue

                    game = convert_game(game, pgn, twic_info, time_control_info)
                    batch.put_item(Item=game)

                    count += 1
                    if max_count > 0 and count >= max_count:
                        break

                except Exception as e:
                    print(e)
                    print(traceback.format_exc())
                    failed += 1
                    write_failure(pgn)
                    break
    
    print('Success: ', count)
    print('Skipped: ', skipped)
    print('Failed: ', failed)
    print('Total: ', count+failed+skipped)


def write_failure(pgn):
    with open('failed.pgn', 'a') as failed_file:
        failed_file.write('\n\n' + pgn)


def load_time_control_info(filename):
    result = {}
    with open(filename, 'r') as csvfile:
        reader = csv.DictReader(csvfile)
        for row in reader:
            result[row['twic']] = row
    return result


def convert_game(game, pgn, twic_info, time_control_info):
    time_headers = get_time_control_headers(pgn, twic_info, time_control_info)
    time_class = time_headers['time_class']
    game.headers['TimeClass'] = time_class
    if time_headers['pgn']:
        game.headers['TimeControl'] = time_headers['pgn']
    if time_headers['white_clock']:
        game.headers['WhiteClock'] = time_headers['white_clock']
    if time_headers['black_clock']:
        game.headers['BlackClock'] = time_headers['black_clock']

    ply_count = len(list(game.mainline_moves()))
    game.headers['PlyCount'] = f'{ply_count}'

    headers = dict(game.headers)

    white = headers['White'].lower()
    black = headers['Black'].lower()
    date = headers['Date']
    if not date:
        date = '????.??.??'

    createdAt = datetime.datetime.utcnow().isoformat()

    result = {
        'cohort': 'masters',
        'id':  date + '_' + str(uuid.uuid4()),
        'white': white.lower(),
        'black': black.lower(),
        'date': date,
        'createdAt': createdAt,
        'updatedAt': createdAt,
        'publishedAt': createdAt,
        'owner': 'masters',
        'ownerDisplayName': 'Masters DB',
        'headers': headers,
        'pgn': str(game),
        'positionComments': {},
        'timeClass': time_headers['time_class']
    }
    return result


def get_time_control_headers(pgn, twic_info, time_control_info):
    time_control = get_time_control(pgn, twic_info)
    time_controls = time_control.split(',')
    possible_time_classes = set()
    for tc in time_controls:
        tc = tc.strip()
        if tc in time_control_info:
            possible_time_classes.add(time_control_info[tc]['time_class'])
    
    if len(possible_time_classes) == 0:
        return get_unknown_time_control_headers(pgn)

    if len(possible_time_classes) == 1:
        tc = time_controls[0].strip()
        return time_control_info[tc]
    
    preferred_time_class = 'Blitz'
    if 'Standard' in possible_time_classes:
        preferred_time_class = 'Standard'
    elif 'Rapid' in possible_time_classes:
        preferred_time_class = 'Rapid'
    
    for tc in time_controls:
        tc = tc.strip()
        if tc in time_control_info and time_control_info[tc]['time_class'] == preferred_time_class:
            return time_control_info[tc]

    raise Exception(f'Reached end of get_time_control_headers for PGN: {pgn}')


def get_unknown_time_control_headers(pgn):
    event = get_event(pgn).lower()

    if 'titled tue' in event:
        return {
            'pgn': '180+1',
            'time_class': 'Blitz',
            'white_clock': '',
            'black_clock': '',
        }

    time_class = 'Unknown'

    if 'classical' in event:
        time_class = 'Standard'
    elif 'rapid' in event or 'quick' in event:
        time_class = 'Rapid'
    elif 'blitz' in event or 'bullet' in event or 'armageddon' in event:
        time_class = 'Blitz'

    return {
        'pgn': '',
        'time_class': time_class,
        'white_clock': '',
        'black_clock': ''
    }


if __name__ == '__main__':
    main()
