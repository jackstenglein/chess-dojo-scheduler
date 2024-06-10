from bs4 import BeautifulSoup
import requests
from urllib.request import urlopen, Request
from zipfile import ZipFile
from io import BytesIO
import ssl 
from caissabase_stats import get_event, get_site
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
        if foundMoves and line == '\n':
            break
        elif line == '\n':
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
    game_counts = get_twic_game_counts(soup, archive_num)

    if game_counts is None or len(game_counts) == 0:
        print(f'ERROR {archive_num}: Got 0 game counts')
        return []
    
    results = []
    events = soup.find_all('h2')
    for event in events:
        event_info = get_twic_event_info(event, game_counts)
        if event_info is not None:
            results.append(event_info)

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
    
    result = {}
    for row in rows[1:]:
        if len(row.contents) == 2:
            event = row.contents[0].get_text()

            if archive_num in EVENT_COUNT_OVERRIDES and event in EVENT_COUNT_OVERRIDES[archive_num]:
                result[event] = EVENT_COUNT_OVERRIDES[archive_num][event]
            else:
                count = row.contents[1].get_text().strip()
                count = count.split(' ')[0]
                try:
                    count = int(count)
                    result[event] = count
                except Exception as e:
                    print(f'ERROR {archive_num}: failed to parse int: ', e)
                    return None

    return result


def get_twic_event_info(event, game_counts):
    event_name = event.get_text().strip()
    event_name = twic_header_re.sub('', event_name)
    count = game_counts.get(event_name, 0)
    if count == 0:
        return None
    
    result = {
        'event': event_name,
        'count': count,
        'sections': []
    }

    curr = event.next_sibling
    while curr is not None:
        if curr.name == 'h2':
            break
        
        if curr.name == 'ul' and curr.has_attr('class') and curr['class'][0] == 'tourn_details':
            result['sections'].append(get_twic_section(curr))

        curr = curr.next_sibling
    
    return result
    

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

    twic_info = fetch_twic_info(archive_num)
    if len(twic_info) == 0:
        print(f'ERROR {archive_num}: empty twic_info.')
        return {}

    pgns = fetch_twic_pgns(archive_num)
    if len(pgns) == 0:
        print(f'ERROR {archive_num}: empty PGNs.')
        return {}
    
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
                print(f'WARNING {archive_num}: site `{site}` not found for PGN (could indicate mismatched event): {pgn}\n\t', info, end='\n\n')
                if i + 1 < len(twic_info) and matches_site(site, twic_info[i + 1]):
                    print(f'INFO {archive_num}: site `{site}` matches next info. Assuming TWIC count is wrong and moving to next info.')
                    pgnIdx -= 1
                    break

            matched_section = None
            for section in info['sections']:
                if section['event'] == event:
                    matched_section = section

            result = results.get(f'{event}_{site}', { 
                'pgn_event': event, 
                'pgn_site': site,
                'twic_event': matched_section['event'] if matched_section else info['event'],
                'twic_site': info['sections'][0].get('site', ''),
                'twic_time_controls': set(),
            })

            if matched_section:
                result['twic_time_controls'].add(matched_section['time_control'])
            elif not matched_section:
                result['twic_time_controls'].update([section['time_control'] for section in info['sections'] if section['time_control']])

            results[f'{event}_{site}'] = result

    return results


def main():
    outfile = 'twic_output_new.csv'
    with open(outfile, 'w') as f:
        writer = csv.writer(f)
        writer.writerow(['TWIC Archive Num', 'PGN Event', 'PGN Site', 'TWIC Event', 'TWIC Site', 'Possible Time Controls'])

    for archive_num in range(920, 1543):
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
                    ', '.join(result['twic_time_controls'])
                ])


if __name__ == '__main__':
    main()
