import chess.pgn
import codecs
# import boto3
import uuid
import requests
import json
from boto3.dynamodb.types import TypeSerializer


def fetch_study(id: str):
    res = requests.get(f'https://lichess.org/api/study/{id}.pgn')
    return res.text

def handle_game(game) -> bool:
    if game is None:
        return False

    headers = dict(game.headers)
    white = headers['White'].lower()
    black = headers['Black'].lower()
    date = headers['Date']
    
    result = {
        'cohort': '<COHORT>',
        'id': date + '_' + str(uuid.uuid4()),
        'white': white.lower(),
        'black': black.lower(),
        'date': date,
        'owner': 'games_to_memorize',
        'headers': headers,
        'pgn': str(game),
        'comments': [],
        'orientation': 'white',
    }
    return result


def main():
    pgn = codecs.open('games_to_memorize.pgn', encoding='utf-8', errors='ignore')
    invalid_output = open('invalid_games.pgn', 'w')

    valid_games = 0
    invalid_games = 0

    json_games = []

    game = True
    while game is not None:
        try:
            game = chess.pgn.read_game(pgn)
            if game is not None:
                valid_games += 1
                json_game = handle_game(game)

                serializer = TypeSerializer()
                dyn_item = {key: serializer.serialize(value) for key, value in json_game.items()}
                json_games.append(dyn_item)
            else:
                invalid_games += 1
                print(game, file=invalid_output, end='\n\n')
        except Exception as e:
            invalid_games += 1
            print(e)

    invalid_output.close()
    pgn.close()

    with open('out.json', 'w') as outfile:
        json.dump(json_games, outfile, indent=4)

    print('Valid Games: ', valid_games)
    print('Invalid Games: ', invalid_games)


if __name__ == '__main__':
    main()
