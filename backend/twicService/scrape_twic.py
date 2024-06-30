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
from dynamodb_json import json_util as json
import os
import ssl

ssl._create_default_https_context = ssl._create_unverified_context

time_control_re = re.compile('\[TimeControl \"(.*)\"\]')
event_re = re.compile('\[Event \"(.*)\"]')
site_re = re.compile('\[Site \"(.*)\"]')
twic_header_re = re.compile(r'^\d+\) ')

stage = os.environ['stage']

# db = boto3.resource('dynamodb')
# table = db.Table(f'{stage}-games')


def handler(event, context):
    print('Event: ', event)

    archive_num = 1549

    try:
        twic_info = fetch_twic_info(archive_num)
        if len(twic_info) == 0:
            handle_error(archive_num, 'Empty twic_info')

        print(f'INFO {archive_num}: Got TWIC Info: ', twic_info)
        validate_twic_info(archive_num, twic_info)

        pgns = fetch_twic_pgns(archive_num)
        print(f'INFO {archive_num}: Got {len(pgns)} PGNs')
        
        upload_pgns(archive_num, pgns, twic_info)
    except Exception as e:
        handle_error(archive_num, e)


def handle_error(archive_num, msg):
    """
    Logs the given error and exits.
    @param archive_num The TWIC archive number that generated the error.
    @param msg The error message to log.
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

    while True:
        pgn = read_zip_line(file, archive_num)
        if len(pgn) == 0:
            return ''
        pgn = pgn.lstrip()
        if len(pgn) > 0:
            break
    
    if not pgn.startswith('[Event'):
        raise Exception(f'PGN first line does not start with Event header: `{pgn}`')
    
    foundMoves = False
    while line := read_zip_line(file, archive_num):
        if foundMoves and is_pgn_end(line, pgn):
            break
        elif line == '\n' or line == '\r\n':
            foundMoves = True

        pgn += line
    
    return pgn


def is_pgn_end(line, pgn):
    """
    Returns true if the line is the end of the PGN.
    @param line The line to check.
    @param pgn The PGN being read.
    """
    if line == '\n' or line == '\r\n':
        return True
    
    line = line.strip()
    if line.endswith('1-0') or line.endswith('0-1') or line.endswith('1/2-1/2') or line.endswith('*'):
        pgn += line
        return True
    
    return False


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
    results = []

    events = soup.find_all('h2')
    for event in events:
        twic_event = get_twic_event(event)
        if twic_event is not None:
            results.append(twic_event)

    return results


def get_twic_event(soup):
    """
    Gets a TWIC event from the given soup. If the soup does not represent a TWIC event
    or the event has no sections, None is returned.
    @param soup The BeautifulSoup object of the TWIC event name.
    """
    event_name = soup.get_text().strip()
    event_name = twic_header_re.sub('', event_name)

    if event_name == "Forthcoming Events and Links":
        return None

    event = {
        'event': event_name,
        'sections': [],
    }

    curr = soup.next_sibling
    while curr is not None:
        if curr.name == 'h2':
            break
        
        if curr.name == 'ul' and curr.has_attr('class') and curr['class'][0] == 'tourn_details':
            event['sections'].append(get_twic_section(curr))

        curr = curr.next_sibling

    if len(event['sections']) == 0:
        return None
    
    return event
    

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


def validate_twic_info(archive_num, twic_info):
    """
    Performs sanity checks on the given TWIC info. An exception is raised if something is wrong with the info.
    @param archive_num The TWIC archive number from which the info was extracted.
    @param twic_info The TWIC information to validate.
    """
    no_sections_count = 0
    for info in twic_info:
        if len(info['sections']) == 0:
            no_sections_count += 1
    
    if no_sections_count >= 3:
        raise Exception(f'{archive_num}: TWIC info has {no_sections_count} events with no sections')


def upload_pgns(archive_num, pgns, twic_info):
    time_control_info = load_time_control_info('time_controls.csv')

    twic_index = 0
    success = 0
    failed = 0

    pgns_per_event = {}

    for i, pgn in enumerate(pgns):
        site_changed = i > 0 and get_site(pgns[i-1]) != get_site(pgn)
        time_headers, used_twic_index = get_time_headers(archive_num, pgn, site_changed, twic_index, twic_info, time_control_info)
       
        twic_index = used_twic_index
        pgns_per_event[twic_info[twic_index]['event']] = pgns_per_event.get(twic_info[twic_index]['event'], 0) + 1

        game = chess.pgn.read_game(io.StringIO(pgn))
        if game is None:
            record_failure(archive_num, pgn)
            failed += 1
            continue

        game = convert_game(game, time_headers, archive_num)
        with open(f'twic_games_{archive_num}.json', 'a') as f:
            f.write('{"Item":')
            f.write(json.dumps(game))
            f.write('}\n')

        success += 1            
    
    print(f'INFO {archive_num} Success: {success}')
    print(f'INFO {archive_num} Failed: {failed}')
    print(f'INFO {archive_num} Total: ', success+failed)
    print(f'INFO {archive_num} PGNs per event: ', pgns_per_event)


def matches_site(site, info):
    """
    Returns true if the given PGN site matches any of the sections in the given TWIC info.
    @param site The PGN site string to check.
    @param info The TWIC info to check.
    """
    return any(site == section['site'] or section['place'] in site or section['nat'] in site for section in info['sections'])


def record_failure(archive_num, pgn):
    """
    Writes the failed PGN to the logs.
    @param archive_num The TWIC archive number of the failed PGN.
    @param pgn The pgn to write.
    """
    print(f'ERROR {archive_num} Failed PGN: ', pgn)


def load_time_control_info(filename):
    """
    Reads the mapping file from TWIC time controls to PGN standard.
    The result is returned as a dictionary where the key is the TWIC time control and the
    value is the information on the time control.
    @param filename The CSV file containing the time control data.
    """
    result = {}
    with open(filename, 'r') as csvfile:
        reader = csv.DictReader(csvfile)
        for row in reader:
            result[row['twic']] = row
    return result


def convert_game(game, time_headers, archive_num):
    """
    Converts the given chess.pgn game into a record for the DynamoDB games table.
    @param game The chess.pgn game instance.
    @param time_headers The PGN time control information.
    @param archive_num The TWIC archive number this game comes from.
    """
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
    game.headers['TwicArchive'] = f'{archive_num}'

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


def get_time_headers(archive_num, pgn, site_changed, twic_index, twic_infos, time_control_info):
    """
    Returns the time control headers for the given PGN and the used TWIC index.
    @param archive_num The archive number the PGN is from.
    @param pgn The PGN string to get the time control info for.
    @param site_changed Whether the current PGN site changed from the previous one.
    @param twic_index The index of the current TWIC info.
    @param twic_infos The list of TWIC infos.
    @param time_control_info The mapping from TWIC time controls to PGN time controls.
    """
    used_twic_index = get_matching_twic_index(archive_num, pgn, site_changed, twic_index, twic_infos)
    twic_info = twic_infos[used_twic_index]
    
    event = get_event(pgn)
    matched_section = None
    for section in twic_info['sections']:
        if section['event'] == event:
            matched_section = section

    possible_time_controls = []
    if matched_section:
        possible_time_controls.append(matched_section['time_control'])
    else:
        possible_time_controls.extend([section['time_control'] for section in twic_info['sections'] if section['time_control']])

    possible_time_classes = set()
    for tc in possible_time_controls:
        tc = tc.strip()
        if tc in time_control_info:
            possible_time_classes.add(time_control_info[tc]['time_class'])
        elif tc and tc != "Unknown":
            print(f'ERROR {archive_num}: unknown TWIC time control: {tc}')
    
    if len(possible_time_classes) == 0:
        return get_unknown_time_control_headers(pgn), used_twic_index

    if len(possible_time_classes) == 1:
        tc = possible_time_controls[0].strip()
        if tc in time_control_info:
            return time_control_info[tc], used_twic_index
        return get_unknown_time_control_headers(pgn), used_twic_index
    
    preferred_time_class = 'Blitz'
    if 'Standard' in possible_time_classes:
        preferred_time_class = 'Standard'
    elif 'Rapid' in possible_time_classes:
        preferred_time_class = 'Rapid'
    
    for tc in possible_time_controls:
        tc = tc.strip()
        if tc in time_control_info and time_control_info[tc]['time_class'] == preferred_time_class:
            return time_control_info[tc], used_twic_index

    raise Exception(f'Reached end of get_time_control_headers for PGN: {pgn}')


def get_matching_twic_index(archive_num, pgn, site_changed, curr_index, twic_infos):
    """
    Returns the TWIC index that best matches the given PGN based on the event location. If no good match
    is found, curr_index is returned.
    @param archive_num The archive number of the TWIC info.
    @param pgn The PGN to get the TWIC info index of.
    @param site_changed Whether the current PGN site changed from the previous one.
    @param curr_index The current TWIC index to use as a fallback.
    @param twic_infos The TWIC info list.
    """
    site = get_site(pgn)

    if not site_changed and matches_site(site, twic_infos[curr_index]):
        return curr_index
    
    site_found, used_twic_index = matches_future_twic(archive_num, site, curr_index, twic_infos)
    if site_found:
        return used_twic_index
    
    if site_changed and matches_site(site, twic_infos[curr_index]):
        print(f'INFO {archive_num}: site `{site}` matches current TWIC info {curr_index}: `{twic_infos[curr_index]["event"]}`. Continuing to use that info.')
        return curr_index

    site_found, used_twic_index = matches_previous_twic(archive_num, site, curr_index, twic_infos)
    if site_found:
        return used_twic_index

    print(f'WARNING {archive_num}: site `{site}` not found for PGN (could indicate mismatched event): {pgn}\r\t', twic_infos[curr_index])


def matches_future_twic(archive_num, site, curr_index, twic_infos):
    """
    Returns true if the given site matches a future TWIC info, as well as the matched TWIC index. If no
    match is found, the current TWIC index is returned.
    @param archive_num The archive number of the TWIC info.
    @param site The site name to check.
    @param curr_index The current TWIC index to start searching from.
    @param twic_infos The TWIC information list.
    """
    i = curr_index + 1
    while i < len(twic_infos):
        if matches_site(site, twic_infos[i]):
            print(f'INFO {archive_num}: site `{site}` matches TWIC info {i+1}: `{twic_infos[i]["event"]}`. Jumping to that info.')
            return True, i
        i += 1
    return False, curr_index


def matches_previous_twic(archive_num, site, curr_index, twic_infos):
    """
    Returns true if the given site matches a previous TWIC info, as well as the matched TWIC index. If no
    match is found, the current TWIC index is returned.
    @param archive_num The archive number of the TWIC info.
    @param site The site name to check.
    @param curr_index The current TWIC index to start searching from.
    @param twic_infos The TWIC information list.
    """
    i = curr_index - 1
    while i >= 0:
        if matches_site(site, twic_infos[i]):
            print(f'INFO {archive_num}: site `{site}` matches TWIC info {i+1}: `{twic_infos[i]["event"]}`. Jumping to that info.')
            return True, i
        i -= 1
    return False, curr_index


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


def get_unknown_time_control_headers(pgn):
    """
    Returns the time control headers for the given PGN, assuming the PGN
    has an otherwise unknown time control.
    @param pgn The PGN string to get the time control headers for.
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


if __name__ == '__main__':
    handler(None, None)
