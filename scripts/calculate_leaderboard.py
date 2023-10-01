from dynamodb_json import json_util


def main():
    with open('yearlyLeaderboard.json') as f:
        yearlyLeaderboard = f.read()
        yearlyLeaderboard = json_util.loads(yearlyLeaderboard)

    with open('augLeaderboard.json') as f:
        augLeaderboard = f.read()
        augLeaderboard = json_util.loads(augLeaderboard)

    print('************ YEARLY LEADERBOARD ***************', yearlyLeaderboard, sep='\n')

    print('************ AUG LEADERBOARD ***************', augLeaderboard, sep='\n')

    sepLeaderboard = {
        'type': augLeaderboard['type'],
        'startsAt': '2023-09',
        'timeControl': augLeaderboard['timeControl'],
        'players': yearlyLeaderboard['players'],
    }

    for player in sepLeaderboard['players']:
        for augPlayer in augLeaderboard['players']:
            if augPlayer['username'] == player['username']:
                player['score'] -= augPlayer['score']
                break

    print('************ SEPT LEADERBOARD ***************', sepLeaderboard, sep='\n')

    sepLeaderboard = json_util.dumps(sepLeaderboard)
    with open('sepLeaderboard.json', 'w') as f:
        f.write(sepLeaderboard)

if __name__ == '__main__':
    main()

