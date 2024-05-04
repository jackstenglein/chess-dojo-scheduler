import chess.pgn
import codecs
import argparse
import uuid
from dynamodb_json import json_util as json 

VALID_TYPES = ["TACTICS_EXAM", "POLGAR_EXAM"]
VALID_COHORTS = [
    '0-500',
    '500-1000',
    '1000-1500',
    '1500+',
    '1500-2000',
    '2000+'
]

parser = argparse.ArgumentParser(description='Create exam object in dev DynamoDB from Lichess study')
parser.add_argument('-f', '--file', type=str, help='The Lichess study PGN file', required=True)
parser.add_argument('-n', '--name', type=str, help='The name of the exam', required=True)
parser.add_argument('-t', '--type', type=str, help='The type of the exam', required=True, choices=VALID_TYPES)
parser.add_argument('-c', '--cohorts', type=str, help='The cohort range of the exam', required=True)
parser.add_argument('-l', '--limit', type=int, help='The time limit in minutes of the exam', required=True)


def main():
    args = parser.parse_args()
    pgnfile = codecs.open(args.file, encoding='utf-8', errors='ignore')

    if args.limit <= 0:
        raise Exception('limit must be greater than 0')

    exam = {
        'type': args.type,
        'id': str(uuid.uuid4()),
        'answers': {},
        'cohortRange': args.cohorts,
        'name': args.name,
        'pgns': [],
        'timeLimitSeconds': 60*args.limit,
    }

    pgn = True
    while pgn is not None:
        try:
            pgn = chess.pgn.read_game(pgnfile)
            if pgn is not None:
                exam['pgns'].append({'S': str(pgn)})
            else:
                print('Got invalid PGN: ', pgn)
        except Exception as e:
            print(e)

    pgnfile.close()


    with open('out.json', 'w') as outfile:
        outfile.write(json.dumps(exam))


if __name__ == '__main__':
    main()
