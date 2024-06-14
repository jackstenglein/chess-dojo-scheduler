import re
import csv

white_elo_re = re.compile('\[WhiteElo \"(.*)\"\]')
black_elo_re = re.compile('\[BlackElo \"(.*)\"\]')
date_re = re.compile('\[Date \"(.*)\..*\..*\"\]')
time_control_re = re.compile('\[TimeControl \"(.*)\"\]')
event_re = re.compile('\[Event \"(.*)\"]')
site_re = re.compile('\[Site \"(.*)\"]')


def main():
    twic_info = load_twic_info('twic_output_full_4.csv')

    # chessbase_stats, chessbase_years, chessbase_tcs = get_pgn_stats('/Users/jackstenglein/Downloads/megadb_2023.pgn', twic_info)
    caissabase_stats, caissabase_years, caissabase_tcs = get_pgn_stats('/Users/jackstenglein/Documents/caissabase-2024-04-27.pgn', twic_info)

    years = caissabase_years #chessbase_years.union(caissabase_years)
    years = list(years)
    years.sort(reverse=True)
    years.insert(0, 'total')

    with open('db_stats.csv', 'w') as f:
        writer = csv.writer(f)
        writer.writerow([
            'Period', 
            'Caissabase Total Games', 
            'Caissabase Two Players 2200+',
            'Caissabase One Player 2200+',
            'Caissabase Two Players U2200',
            'Caissabase One Player Unknown',
            'Caissabase Two Players Unknown',
            'Chessbase Total Games', 
            'Chessbase Two Players 2200+',
            'Chessbase One Player 2200+',
            'Chessbase Two Players U2200',
            'Chessbase One Player Unknown',
            'Chessbase Two Players Unknown',
        ])

        for year in years:
            writer.writerow([
                year,
                caissabase_stats.get(f'{year}', 0),
                caissabase_stats.get(f'{year}_two_players_2200+', 0),
                caissabase_stats.get(f'{year}_one_player_2200+', 0),
                caissabase_stats.get(f'{year}_two_players_U2200', 0),
                caissabase_stats.get(f'{year}_one_player_unknown_rating', 0),
                caissabase_stats.get(f'{year}_two_players_unknown_rating', 0),
                # chessbase_stats.get(f'{year}', 0),
                # chessbase_stats.get(f'{year}_two_players_2200+', 0),
                # chessbase_stats.get(f'{year}_one_player_2200+', 0),
                # chessbase_stats.get(f'{year}_two_players_U2200', 0),
                # chessbase_stats.get(f'{year}_one_player_unknown_rating', 0),
                # chessbase_stats.get(f'{year}_two_players_unknown_rating', 0),
            ])

    tcs = caissabase_tcs # chessbase_tcs.union(caissabase_tcs)
    tcs = list(tcs)
    tcs.sort(reverse=True)
    tcs.insert(0, 'total')

    with open('time_control_stats.csv', 'w') as f:
        writer = csv.writer(f)
        writer.writerow([
            'Time Control', 
            'Caissabase Total Games', 
            'Caissabase Two Players 2200+',
            'Caissabase One Player 2200+',
            'Caissabase Two Players U2200',
            'Caissabase One Player Unknown',
            'Caissabase Two Players Unknown',
            'Chessbase Total Games', 
            'Chessbase Two Players 2200+',
            'Chessbase One Player 2200+',
            'Chessbase Two Players U2200',
            'Chessbase One Player Unknown',
            'Chessbase Two Players Unknown',
        ])

        for tc in tcs:
            writer.writerow([
                tc,
                caissabase_stats.get(f'{tc}', 0),
                caissabase_stats.get(f'{tc}_two_players_2200+', 0),
                caissabase_stats.get(f'{tc}_one_player_2200+', 0),
                caissabase_stats.get(f'{tc}_two_players_U2200', 0),
                caissabase_stats.get(f'{tc}_one_player_unknown_rating', 0),
                caissabase_stats.get(f'{tc}_two_players_unknown_rating', 0),
                # chessbase_stats.get(f'{tc}', 0),
                # chessbase_stats.get(f'{tc}_two_players_2200+', 0),
                # chessbase_stats.get(f'{tc}_one_player_2200+', 0),
                # chessbase_stats.get(f'{tc}_two_players_U2200', 0),
                # chessbase_stats.get(f'{tc}_one_player_unknown_rating', 0),
                # chessbase_stats.get(f'{tc}_two_players_unknown_rating', 0),
            ])


def twic_matches(pgn_event, pgn_site, twic_event, twic_site, match_found):
    if match_found:
        return True
    if pgn_site == twic_site:
        return True
    if pgn_event in twic_event or twic_event in pgn_event:
        return True
    if twic_site.split(' ')[-1] in pgn_site:
        return True
    return False


def load_twic_info(filename):
    twic_info = {}
    with open(filename, 'r') as f:
        reader = csv.reader(f)
        for row in reader:
            archive_num, pgn_event, pgn_site, twic_event, twic_site, time_controls, match_found = row

            if time_controls == "Unknown":
                continue

            if not twic_matches(pgn_event, pgn_site, twic_event, twic_site, match_found):
                continue

            substituted_event = pgn_event.replace("st", ".").replace("nd", ".").replace("rd", ".").replace("th", ".")
            
            twic_info[f'{pgn_event}_{pgn_site}'] = {
                'event': pgn_event,
                'time_controls': time_controls
            }
            twic_info[f'{substituted_event}_{pgn_site}'] = {
                'event': pgn_event,
                'time_controls': time_controls
            }
    return twic_info


def get_pgn_stats(filename, twic_info):
    game_stats = {
        'total': 0,
        'total_two_players_2200+': 0,
        'total_one_player_2200+': 0,
        'total_two_players_U2200': 0,
        'total_one_player_unknown_rating': 0,
        'total_two_players_unknown_rating': 0,
    }
    years = set()
    tcs = set()

    with open(filename, 'r', encoding='utf-8-sig') as file:
        while pgn := read_pgn(file):
            game_stats['total'] += 1

            year = get_year(pgn)
            game_stats[year] = game_stats.get(year, 0) + 1
            years.add(year)

            tc = get_time_control(pgn, twic_info)
            game_stats[tc] = game_stats.get(tc, 0) + 1
            tcs.add(tc)

            if tc == '?':
                game_stats[f'?_{year}'] = game_stats.get(f'?_{year}', 0) + 1
                tcs.add(f'?_{year}')

            white_elo, black_elo = get_elos(pgn)
            if white_elo < 0 and black_elo < 0:
                game_stats['total_two_players_unknown_rating'] += 1
                game_stats[f'{year}_two_players_unknown_rating'] = game_stats.get(f'{year}_two_players_unknown_rating', 0) + 1
                game_stats[f'{tc}_two_players_unknown_rating'] = game_stats.get(f'{tc}_two_players_unknown_rating', 0) + 1
            elif white_elo < 0 or black_elo < 0:
                game_stats['total_one_player_unknown_rating'] += 1
                game_stats[f'{year}_one_player_unknown_rating'] = game_stats.get(f'{year}_one_player_unknown_rating', 0) + 1
                game_stats[f'{tc}_one_player_unknown_rating'] = game_stats.get(f'{tc}_one_player_unknown_rating', 0) + 1

            if white_elo >= 2200 and black_elo >= 2200:
                game_stats['total_two_players_2200+'] += 1
                game_stats[f'{year}_two_players_2200+'] = game_stats.get(f'{year}_two_players_2200+', 0) + 1
                game_stats[f'{tc}_two_players_2200+'] = game_stats.get(f'{tc}_two_players_2200+', 0) + 1
            elif white_elo >= 2200 or black_elo >= 2200:
                game_stats['total_one_player_2200+'] += 1
                game_stats[f'{year}_one_player_2200+'] = game_stats.get(f'{year}_one_player_2200+', 0) + 1
                game_stats[f'{tc}_one_player_2200+'] = game_stats.get(f'{tc}_one_player_2200+', 0) + 1
            elif white_elo >= 0 and black_elo >= 0:
                game_stats['total_two_players_U2200'] += 1
                game_stats[f'{year}_two_players_U2200'] = game_stats.get(f'{year}_two_players_U2200', 0) + 1
                game_stats[f'{tc}_two_players_U2200'] = game_stats.get(f'{tc}_two_players_U2200', 0) + 1
    
    return (game_stats, years, tcs)


def read_pgn(file):
    pgn = file.readline().lstrip()
    if len(pgn) == 0:
        return ''
    
    if not pgn.startswith('[Event'):
        raise Exception(f'PGN first line does not start with Event header: `{pgn}`')
    
    foundMoves = False
    while line := file.readline():
        if foundMoves and (line == '\n' or line == '\r\n'):
            break
        elif line == '\n' or line == '\r\n':
            foundMoves = True

        pgn += line
    
    return pgn


def get_elos(pgn):
    white_elo = white_elo_re.search(pgn)
    if white_elo is None:
        white_elo = -1
    else:
        white_elo = re.sub("[^0-9]", "", white_elo.group(1))
        if len(white_elo) == 0:
            white_elo = -1
        else:
            white_elo = int(white_elo)

    black_elo = black_elo_re.search(pgn)
    if black_elo is None:
        black_elo = -1
    else:
        black_elo = re.sub("[^0-9]", "", black_elo.group(1))
        if len(black_elo) == 0:
            black_elo = -1
        else:
            black_elo = int(black_elo)
    
    return [white_elo, black_elo]


def get_year(pgn):
    date = date_re.search(pgn)
    if date is None:
        return '????'
    return date.group(1)


def get_event(pgn):
    event = event_re.search(pgn)
    if event is None:
        return '?'
    return event.group(1)


def get_site(pgn):
    site = site_re.search(pgn)
    if site is None:
        return '?'
    return site.group(1)


def get_time_control(pgn, twic_info):
    time_control = time_control_re.search(pgn)
    if time_control is not None:
        return time_control.group(1)

    event = get_event(pgn)
    twic_event = event + '_' + get_site(pgn)
    event_lower = event.lower()

    if twic_event in twic_info:
        return twic_info[twic_event]['time_controls']

    if 'classical' in event_lower:
        return 'classical'
    if 'rapid' in event_lower:
        return 'rapid'
    if 'quick' in event_lower:
        return 'quick'
    if 'blitz' in event_lower:
        return 'blitz'
    if 'bullet' in event_lower:
        return 'bullet'
    if 'titled tue' in event_lower:
        return 'titled tue'
    if 'armageddon' in event_lower:
        return 'armageddon'
    
    return '?'


if __name__ == '__main__':
    main()
