import chess.pgn
import codecs
import argparse
import uuid
from dynamodb_json import json_util as json 

VALID_TYPES = ["TACTICS_EXAM", "POLGAR_EXAM", "ENDGAME_EXAM"]
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
parser.add_argument('--id', type=str, help='Whether to use an already existing id')
parser.add_argument('--takebacks', action=argparse.BooleanOptionalAction, help='Whether takebacks are enabled or not', required=True)
parser.add_argument('--keep-event', action=argparse.BooleanOptionalAction, help='Whether to preserve the event header or not')
parser.add_argument('--pgn-only', action=argparse.BooleanOptionalAction, help='If passed, only dump the pgns field')


def main():
    args = parser.parse_args()
    pgnfile = codecs.open(args.file, encoding='utf-8', errors='ignore')

    if args.limit <= 0:
        raise Exception('limit must be greater than 0')

    exam = {
        'type': args.type,
        'id': args.id if args.id else str(uuid.uuid4()),
        'answers': {},
        'cohortRange': args.cohorts,
        'name': args.name,
        'pgns': [],
        'timeLimitSeconds': 60*args.limit,
        'takebacksDisabled': not args.takebacks
    }

    pgn = True
    while pgn is not None:
        try:
            pgn = chess.pgn.read_game(pgnfile)
            if pgn is not None:
                for key in pgn.headers.keys():
                    if key == 'FEN' or key == 'SetUp' or (args.keep_event and key == 'Event'):
                        continue
                    pgn.headers.pop(key)

                exam['pgns'].append(str(pgn))
            else:
                print('Got invalid PGN: ', pgn)
        except Exception as e:
            print(e)

    pgnfile.close()


    with open('out.json', 'w') as outfile:
        outfile.write(json.dumps(exam['pgns']) if args.pgn_only else json.dumps(exam))


if __name__ == '__main__':
    main()
