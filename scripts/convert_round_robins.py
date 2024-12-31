import requests
import boto3
from dynamodb_json import json_util as json
import re

db = boto3.resource('dynamodb')
table = db.Table('prod-users')

pairing_re = re.compile("^(.*) \*\*\(White\)\*\* \*\*vs\*\* (.*) \*\*\(Black\)\*\*")

cohorts = [
    '0-300',
    '300-400',
    '400-500',
    '500-600',
    '600-700',
    '700-800',
    '800-900',
    '900-1000',
    '1000-1100',
    '1100-1200',
    '1200-1300',
    '1300-1400',
    '1400-1500',
    '1500-1600',
    '1600-1700',
    '1700-1800',
    '1800-1900',
    '1900-2000',
    '2000-2100',
    '2100-2200',
    '2200-2300',
    '2300-2400',
]


def write_user_data(discord_names):
    for filename in ['users-full-1.json', 'users-full-2.json', 'users-full-3.json', 'users-full-4.json']:
        with open(filename, 'r') as input:
            with open('users.json', 'a') as output:
                for line in input:
                    user = json.loads(line)['Item']
                    discord = user.get('discordUsername', '')
                    if discord is None or not discord: continue
                    
                    for rhs in discord_names:
                        if discord.lower() in rhs.lower() or rhs.lower() in discord.lower():
                            output.write(json.dumps(user))
                            output.write('\n')
                            break


def read_user_data():
    users = []
    with open('users.json', 'r') as file:
        for line in file:
            user = json.loads(line)
            users.append(user)
    return users

user_data = read_user_data()


def get_tournaments(cohort):
    resp = requests.get(f'https://c39fywown3.execute-api.us-east-1.amazonaws.com/Prod/tournamentid?cohort-start={cohort.split("-")[0]}')
    return resp.json().get('tournaments', [])


def convert_tournament(cohort, tournament):
    print(f'Converting tournament in cohort {cohort}')
    print(f'Original Tournament: \n{json.dumps(tournament)}\n')

    new_tournament = {
        'type': f'ROUND_ROBIN_{cohort}',
        'startsAt': tournament['startdate'],
        'cohort': cohort,
        'name': f'Winter 2024 {tournament["id"][-5:]}',
        'startDate': tournament['startdate'],
        'endDate': tournament['enddate'],
        'players': {},
        'playerOrder': [],
        'pairings': [],
    }

    discord_to_user = {}
    for discord in tournament['players']:
        user = find_user(discord)
        if user is not None:
            discord_to_user[discord] = user

            new_tournament['players'][user['username']] = {
                'username': user['username'],
                'displayName': user['displayName'],
                'lichessUsername': user['ratings'].get('LICHESS', {}).get('username', 'MISSING_DATA'),
                'chesscomUsername': user['ratings'].get('CHESSCOM', {}).get('username', 'MISSING_DATA'),
                'discordUsername': discord,
                'status': 'ACTIVE',
            }
            new_tournament['playerOrder'].append(user['username'])
        else:
            new_tournament['players'][discord] = {
                'username': 'MISSING_DATA',
                'displayName': 'MISSING_DATA',
                'lichessUsername': 'MISSING_DATA',
                'chesscomUsername':  'MISSING_DATA',
                'discordUsername': discord,
                'status': 'ACTIVE',
            }
            new_tournament['playerOrder'].append(discord)

    
    for round in tournament['pairingdata']:
        new_round = []
        for pair in round:
            match = pairing_re.search(pair)
            white = match.group(1)
            black = match.group(2)

            new_round.append({
                'white': discord_to_user.get(white, {}).get('username', white),
                'black': discord_to_user.get(black, {}).get('username', black),
            })
        new_tournament['pairings'].append(new_round)

    with open('round-robin-converted.json', 'a') as out:
        out.write(json.dumps(new_tournament))
        out.write('\n\n')

    print(f'Converted tournament:\n{json.dumps(new_tournament)}\n')


def find_user(discord):
    results = []
    for user in user_data:
        if discord.lower() in user['discordUsername'].lower() or user['discordUsername'].lower() in discord.lower():
            results.append(user)

    if len(results) == 1:
        return results[0]

    if len(results) == 0:
        print('No results found for discord username: ', discord)
    else:
        print('Multiple options for discord username: ', discord)

    return None


def main():
    discord_names = []
    for cohort in cohorts:
        tournaments = get_tournaments(cohort)
        for tournament in tournaments:
            convert_tournament(cohort, tournament)
            # discord_names.extend(tournament['players'])

    # write_user_data(discord_names)


if __name__ == '__main__':
    main()
