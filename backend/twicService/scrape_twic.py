


import csv
import chess.pgn
import uuid
import datetime
import io
import boto3
import traceback
import re
import requests
from bs4 import BeautifulSoup
from io import BytesIO
from zipfile import ZipFile
from urllib.request import urlopen, Request


time_control_re = re.compile('\[TimeControl \"(.*)\"\]')
event_re = re.compile('\[Event \"(.*)\"]')
site_re = re.compile('\[Site \"(.*)\"]')
twic_header_re = re.compile(r'^\d+\) ')


db = boto3.resource('dynamodb')
table = db.Table('dev-games')


def handler(event, context):
    print('Event: ', event)

    archive_num = 1538
    try:

        twic_info = fetch_twic_info(archive_num)
        if len(twic_info) == 0:
            handle_error(archive_num, 'Empty twic_info')
        print(f'INFO {archive_num}: Got TWIC Info: ', twic_info)
    
        total_pgns = 0
        for info in twic_info:
            total_pgns += info['count']
        print(f'INFO {archive_num}: Expecting {total_pgns} total PGNs')

        pgns = fetch_twic_pgns(archive_num)
        print(f'INFO {archive_num}: Got {len(pgns)} PGNs')
        if len(pgns) < total_pgns:
            handle_error(archive_num, f'Expected {total_pgns} PGNs but got {len(pgns)}')
    except Exception as e:
        handle_error(archive_num, e)


def handle_error(archive_num, msg):
    """
    Logs the given error and exits.
    """
    print(f'ERROR {archive_num}: {msg}')
    print(traceback.format_exc())
    exit()


def fetch_twic_pgns(archive_num):
    """
    Returns a list of the PGNs in the given TWIC archive.
    @param archive_num The TWIC archive number to fetch.
    """
    resp = urlopen(Request(f'https://theweekinchess.com/zips/twic{archive_num}g.zip', data=None, headers={'User-Agent': 'curl/8.4.0'}))
    zip = ZipFile(BytesIO(resp.read()))
    f = zip.open(f'twic{archive_num}.pgn')
    pgns = []

    while pgn := read_zip_pgn(f, archive_num):
        pgns.append(pgn)
    return pgns


def read_zip_pgn(file, archive_num):
    """
    Reads a PGN from the given zip file data.
    @param file The zip file data.
    @param archive_num The TWIC archive number the file is from.
    """
    pgn = read_zip_line(file, archive_num).lstrip()
    if len(pgn) == 0:
        return ''
    
    if not pgn.startswith('[Event'):
        raise Exception(f'PGN first line does not start with Event header: `{pgn}`')
    
    foundMoves = False
    while line := read_zip_line(file, archive_num):
        if foundMoves and (line == '\n' or line == '\r\n'):
            break
        elif line == '\n' or line == '\r\n':
            foundMoves = True

        pgn += line
    
    return pgn


def read_zip_line(file, archive_num):
    """
    Reads a line from the given zip file data.
    @param file The zip file data.
    @param archive_num The TWIC archive number the file is from.
    """
    line = file.readline()
    try:
        return line.decode('windows-1251')
    except UnicodeDecodeError:
        print(f'WARNING {archive_num}: failed to decode with windows-1251. Attempting utf-8.')
        return line.decode('utf-8')


def fetch_twic_info(archive_num):
    """
    Fetches the TWIC HTML page for the given archive number, and extracts the info from each event.
    The event infos are returned as a list in the order of the TWIC page. Only events with games are included.
    @param archive_num The TWIC archive number to fetch
    """
    res = requests.get(f'https://theweekinchess.com/html/twic{archive_num}.html', headers={'User-Agent': 'curl/8.4.0'})
    if res.status_code != 200:
        print(f'ERROR {archive_num}: TWIC status code != 200: ', repr(res))
        return []
    
    soup = BeautifulSoup(res.text, 'html.parser')
    results = get_twic_game_counts(soup, archive_num)

    if results is None or len(results) == 0:
        print(f'ERROR {archive_num}: Got 0 events from game counts')
        return []
    
    events = soup.find_all('h2')
    for event in events:
        add_twic_sections(event, results)

    return results


def get_twic_game_counts(soup, archive_num):
    """
    Returns a list of TWIC events. Each event contains the event name, the count of PGNs
    and an empty list of sections in the event.
    @param soup The BeautifulSoup of the TWIC HTML page.
    @param archive_num The TWIC archive number.
    """
    results_table = soup.find('table', class_='results-table')
    if results_table is None:
        return None

    rows = results_table.find_all('tr')
    if len(rows) == 0:
        return None
    
    if rows[0].get_text().strip() != 'Games Section':
        return None
    
    result = []
    for row in rows[1:]:
        if len(row.contents) == 2:
            event = row.contents[0].get_text()
            count = row.contents[1].get_text().strip()
            count = count.split(' ')[0]
            count = re.sub('[^0-9]','', count)
            try:
                count = int(count)
            except Exception as e:
                contents = row.contents[1].get_text()
                print(f'ERROR {archive_num}: failed to parse int from `{contents}`: ', e)
                return None
            
            result.append({
                'event': event,
                'count': count,
                'sections': []
            })

    return result


def add_twic_sections(event, game_counts):
    """
    Adds the TWIC section data to the given event in the game_counts list.
    @param event The BeautifulSoup object of the TWIC event name.
    @param game_counts The list of TWIC events and their game counts.
    """
    event_name = event.get_text().strip()
    event_name = twic_header_re.sub('', event_name)

    matched_event = next((e for e in game_counts if e['event'] == event_name), None)

    if matched_event == None:
        return None
    
    curr = event.next_sibling
    while curr is not None:
        if curr.name == 'h2':
            break
        
        if curr.name == 'ul' and curr.has_attr('class') and curr['class'][0] == 'tourn_details':
            matched_event['sections'].append(get_twic_section(curr))

        curr = curr.next_sibling
    
    return matched_event
    

def get_twic_section(tourn_details):
    """
    Converts the given tournament details object into a dictionary of the section data.
    @param tourn_details The BeautifulSoup object of the tournament details.
    """
    event = tourn_details.find('li', class_='Event')
    start = tourn_details.find('li', class_='StartDate')
    end = tourn_details.find('li', class_='EndDate')
    place = tourn_details.find('li', class_='Place')
    nat = tourn_details.find('li', class_='NAT')
    time_control = tourn_details.find('li', class_='TimeControl')

    site = ''
    if place is not None:
        site += place.get_text()
    if nat is not None:
        site += ' ' + nat.get_text()

    return {
        'event': '' if event is None else event.get_text(),
        'start': '' if start is None else start.get_text(),
        'end': '' if end is None else end.get_text(),
        'place': 'UNKNOWN' if place is None else place.get_text(),
        'nat': 'UNKNOWN' if nat is None else nat.get_text(),
        'site': 'UNKNOWN' if site == '' else site,
        'time_control': 'Unknown' if time_control is None else time_control.get_text().removeprefix('Time Control: ')
    }



# def upload_pgns(max_count, skip, filename):
#     twic_info = load_twic_info('twic_output_full_4.csv')
#     time_control_info = load_time_control_info('time_controls.csv')

#     skipped = 0
#     count = 0
#     failed = 0

#     with table.batch_writer() as batch:
#         with open(filename, 'r', encoding='utf-8-sig') as file:
#             while pgn := read_pgn(file):
#                 if skipped < skip:
#                     skipped += 1
#                     continue

#                 if count % 20000 == 0:
#                     print('Success: ', count)
#                     print('Skipped: ', skipped)
#                     print('Failed: ', failed)
#                     print('Total: ', count+failed+skipped, end='\n\n\n')

#                 try:
#                     game = chess.pgn.read_game(io.StringIO(pgn))
#                     if game is None:
#                         failed += 1
#                         record_failure(pgn)
#                         continue

#                     game = convert_game(game, pgn, twic_info, time_control_info)
#                     batch.put_item(Item=game)

#                     count += 1
#                     if max_count > 0 and count >= max_count:
#                         break

#                 except Exception as e:
#                     print(e)
#                     print(traceback.format_exc())
#                     failed += 1
#                     record_failure(pgn)
#                     break
    
#     print('Success: ', count)
#     print('Skipped: ', skipped)
#     print('Failed: ', failed)
#     print('Total: ', count+failed+skipped)


def record_failure(pgn):
    """
    record_failure writes the failed PGN to the logs.
    @param pgn The pgn to write.
    """
    print('Failed PGN: ', pgn)


def load_time_control_info(filename):
    """
    load_time_control_info reads the mapping file from TWIC time controls to PGN standard.
    The result is returned as a dictionary where the key is the TWIC time control and the
    value is the information on the time control.
    """
    result = {}
    with open(filename, 'r') as csvfile:
        reader = csv.DictReader(csvfile)
        for row in reader:
            result[row['twic']] = row
    return result


def convert_game(game, pgn, twic_info, time_control_info):
    """
    Converts the given chess.pgn game into a record for the DynamoDB games table.
    @param game The chess.pgn game instance.
    @param pgn The PGN string the chess.pgn game was created from.
    @param twic_info The twic data
    @param time_control_info A mapping from TWIC time controls to PGN time controls.
    """
    time_headers = get_time_control_info(pgn, twic_info, time_control_info)
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


def get_time_control_info(pgn, twic_info, time_control_info):
    """
    Returns the time control info for the given PGN.
    @param pgn The PGN string to get the time control info for.
    @param twic_info 
    @param time_control_info The mapping from TWIC time controls to PGN time controls.
    """
    time_control = get_time_control(pgn, twic_info)
    time_controls = time_control.split(',')
    possible_time_classes = set()
    for tc in time_controls:
        tc = tc.strip()
        if tc in time_control_info:
            possible_time_classes.add(time_control_info[tc]['time_class'])
    
    if len(possible_time_classes) == 0:
        return get_unknown_time_control_info(pgn)

    if len(possible_time_classes) == 1:
        tc = time_controls[0].strip()
        if tc in time_control_info:
            return time_control_info[tc]
        return get_unknown_time_control_info(pgn)
    
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


def get_time_control(pgn, twic_info):
    """
    Returns the time control of the given PGN using the given TWIC info.
    @param pgn The PGN string to get the time control for.
    @param twic_info The TWIC data mapping event names to time control data.
    """
    time_control = time_control_re.search(pgn)
    if time_control is not None:
        return time_control.group(1)

    event = get_event(pgn)
    twic_event = event + '_' + get_site(pgn)

    if twic_event in twic_info:
        return twic_info[twic_event]['time_controls']

    return '?'


def get_event(pgn):
    """
    Returns the value of the event header or ? if it doesnt not exist.
    @param pgn The PGN to get the event header for.
    """
    event = event_re.search(pgn)
    if event is None:
        return '?'
    return event.group(1)


def get_site(pgn):
    """
    Returns the value of the site header or ? if it does not exist.
    @param pgn The PGN to get the site header for.
    """
    site = site_re.search(pgn)
    if site is None:
        return '?'
    return site.group(1)


def get_unknown_time_control_info(pgn):
    """
    Returns the time control info for the given PGN, assuming the PGN
    has an otherwise unknown time control.
    @param pgn The PGN string to get the time control info for.
    """
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
