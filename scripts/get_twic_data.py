from bs4 import BeautifulSoup
import requests
from urllib.request import urlopen, Request
from zipfile import ZipFile
from io import BytesIO
import ssl 
from caissabase_stats import get_event, get_site, read_pgn
import re
import csv

ssl._create_default_https_context = ssl._create_unverified_context
twic_header_re = re.compile(r'^\d+\) ')

EVENT_COUNT_OVERRIDES = {
    1288: {
        '21st Torredembarra Open 2019': 63,
        '18th Bergamo Open 2019': 36,
    }
}

def read_twic_from_file(archive_num):
    pgns = []
    try: 
        with open(f'twic{archive_num}.pgn', 'r', encoding='utf-8-sig') as file:
            while pgn := read_pgn(file):
                pgns.append(pgn)
        return pgns
    except Exception as e:
        print(f'ERROR {archive_num}: last PGN: ', pgns[-1], '\n', e)


def fetch_twic_pgns(archive_num):
    resp = urlopen(Request(f'https://theweekinchess.com/zips/twic{archive_num}g.zip', data=None, headers={'User-Agent': 'curl/8.4.0'}))
    zip = ZipFile(BytesIO(resp.read()))
    f = zip.open(f'twic{archive_num}.pgn')
    pgns = []

    try:
        while pgn := read_zip_pgn(f, archive_num):
            pgns.append(pgn)
    except Exception as e:
        print(f'ERROR {archive_num}: exception while reading PGNs. Continuing with PGNs found up to this point.', e)
    
    return pgns


def read_zip_pgn(file, archive_num):
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
        add_twic_event_info(event, results)

    return results


def get_twic_game_counts(soup, archive_num):
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
            count = 0

            if archive_num in EVENT_COUNT_OVERRIDES and event in EVENT_COUNT_OVERRIDES[archive_num]:
                count = EVENT_COUNT_OVERRIDES[archive_num][event]
            else:
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


def add_twic_event_info(event, game_counts):
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


def matches_site(site, info):
    return any(site == section['site'] or section['place'] in site or section['nat'] in site for section in info['sections'])

def analyze_twic_archive(archive_num):
    print(f'\n\nINFO {archive_num}: processing archive.')

    pgns = read_twic_from_file(archive_num)
    if len(pgns) == 0:
        print(f'ERROR {archive_num}: empty PGNs.')
        return {}

    twic_info = fetch_twic_info(archive_num)
    if len(twic_info) == 0:
        print(f'ERROR {archive_num}: empty twic_info.')
        return {}
    
    print(f'INFO {archive_num}: Got TWIC Info: ', twic_info)
    print(f'INFO {archive_num}: Got %d PGNs' % (len(pgns)))

    pgnIdx = 0
    results = {}

    for i, info in enumerate(twic_info):
        event_total = info['count']
        event_processed = 0

        while event_processed < event_total:
            if pgnIdx >= len(pgns):
                print(f'ERROR {archive_num}: not enough PGN count {pgnIdx}. Current/remaining TWIC infos: ', twic_info[i:])
                return results
            
            pgn = pgns[pgnIdx]
            pgnIdx += 1
            event_processed += 1

            if len(info['sections']) == 0:
                print(f'INFO {archive_num}: event `%s` has no sections, so skipping PGN' % (info['event']))
                continue

            event = get_event(pgn)
            site = get_site(pgn)
            site_found = matches_site(site, info)

            if not site_found:
                print(f'WARNING {archive_num}: site `{site}` not found for PGN {pgnIdx} (could indicate mismatched event): {pgn}\n\t', info, end='\n\n')
                if i > 1 and event_processed == 1 and matches_site(site, twic_info[i - 1]):
                    print(f'INFO {archive_num}: site `{site}` matches prev info. Assuming TWIC count is wrong and skipping PGN {pgnIdx}.')
                    event_processed -= 1
                    continue
                if i + 1 < len(twic_info) and matches_site(site, twic_info[i + 1]):
                    print(f'INFO {archive_num}: site `{site}` matches next info for PGN {pgnIdx}. Assuming TWIC count is wrong and moving to next info.')
                    pgnIdx -= 1
                    break

            matched_section = None
            for section in info['sections']:
                if section['event'] == event:
                    matched_section = section

            result = results.get(f'{event}_{site}', { 
                'pgn_event': event, 
                'pgn_site': site,
                'twic_event': '', # matched_section['event'] if matched_section else info['event'],
                'twic_site': '', # info['sections'][0].get('site', ''),
                'twic_time_controls': set(),
                'match_found': False,
            })
            if result['match_found']:
                # This event/site combo has already found a perfect match, so no need to add more TCs
                continue

            if matched_section:
                result['twic_event'] = matched_section['event']
                result['twic_site'] = matched_section['site']
                result['twic_time_controls'] = [matched_section['time_control']]
                result['match_found'] = True
            elif not matched_section:
                result['twic_event'] = info['event']
                result['twic_site'] = info['sections'][0]['site']
                result['twic_time_controls'].update([section['time_control'] for section in info['sections'] if section['time_control']])

            results[f'{event}_{site}'] = result

    return results


broken_archives = [1420, 1439, 1483, 943]


def main():
    outfile = 'twic_output_broken.csv'
    with open(outfile, 'w') as f:
        writer = csv.writer(f)
        writer.writerow(['TWIC Archive Num', 'PGN Event', 'PGN Site', 'TWIC Event', 'TWIC Site', 'Possible Time Controls', 'Section Found'])
    
    for archive_num in broken_archives: # range(920, 1544):
        results = analyze_twic_archive(archive_num)
        print(f'INFO {archive_num}: Got %d events' % (len(results)))
        with open(outfile, 'a') as f:
            writer = csv.writer(f)
            for result in results.values():
                writer.writerow([
                    archive_num,
                    result['pgn_event'],
                    result['pgn_site'],
                    result['twic_event'],
                    result['twic_site'],
                    ', '.join(result['twic_time_controls']),
                    result['match_found']
                ])


if __name__ == '__main__':
    main()
