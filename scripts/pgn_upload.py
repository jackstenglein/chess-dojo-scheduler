import chess.pgn
import codecs
import boto3
import uuid

db = boto3.resource('dynamodb')
table = db.Table('dev-games')

def chesscomRatingToCohort(rating: int) -> str:
    if rating < 650:
        return '0-400'
    if rating < 850:
        return '400-600'
    if rating < 950:
        return '600-700'
    if rating < 1050:
        return '700-800'
    if rating < 1150:
        return '800-900'
    if rating < 1250:
        return '900-1000'
    if rating < 1350:
        return '1000-1100'
    if rating < 1450:
        return '1100-1200'
    if rating < 1550:
        return '1200-1300'
    if rating < 1650:
        return '1300-1400'
    if rating < 1750:
        return '1400-1500'
    if rating < 1850:
        return '1500-1600'
    if rating < 1950:
        return '1600-1700'
    if rating < 2050:
        return '1700-1800'
    if rating < 2150:
        return '1800-1900'
    if rating < 2250:
        return '1900-2000'
    if rating < 2350:
        return '2000-2100'
    if rating < 2425:
        return '2100-2200'
    if rating < 2525:
        return '2200-2300'
    if rating < 2600:
        return '2300-2400'
    return '2400+'

def lichessRatingToCohort(rating: int) -> str:
    if rating < 1100:
        return '0-400'
    if rating < 1225:
        return '400-600'
    if rating < 1290:
        return '600-700'
    if rating < 1350:
        return '700-800'
    if rating < 1415:
        return '800-900'
    if rating < 1475:
        return '900-1000'
    if rating < 1575:
        return '1000-1100'
    if rating < 1675:
        return '1100-1200'
    if rating < 1750:
        return '1200-1300'
    if rating < 1825:
        return '1300-1400'
    if rating < 1900:
        return '1400-1500'
    if rating < 2000:
        return '1500-1600'
    if rating < 2075:
        return '1600-1700'
    if rating < 2150:
        return '1700-1800'
    if rating < 2225:
        return '1800-1900'
    if rating < 2300:
        return '1900-2000'
    if rating < 2375:
        return '2000-2100'
    if rating < 2450:
        return '2100-2200'
    if rating < 2525:
        return '2200-2300'
    if rating < 2600:
        return '2300-2400'
    return '2400+'


def handle_game(game) -> bool:
    if game is None:
        return False

    headers = game.headers
    white = headers['White']
    black = headers['Black']
    date = headers['Date']
    site = headers['Site'].lower()

    white_elo_str = headers.get('WhiteElo', '0')
    black_elo_str = headers.get('BlackElo', '0')
    white_elo = int(white_elo_str)
    black_elo = int(black_elo_str)

    if white_elo == 0 and black_elo == 0:
        return False

    if 'chess.com' in site:
        cohort = chesscomRatingToCohort(max(white_elo, black_elo))
    elif 'lichess' in site:
        cohort = lichessRatingToCohort(max(white_elo, black_elo))
    else:
        return False
    
    table.put_item(
        Item={
            'cohort': cohort,
            'id': date + '#' + str(uuid.uuid4()),
            'white': white,
            'black': black,
            'date': date,
            'owner': 'admin',
            'pgn': str(game),
        }
    )

    return True

    


def main():
    pgn = codecs.open('ChessDojoTrainingProgramDatabase.pgn', encoding='utf-8', errors='ignore')

    valid_games = 0
    invalid_games = 0

    game = True
    while game is not None and valid_games < 50:
        try:
            game = chess.pgn.read_game(pgn)
            if game is not None:
                if handle_game(game):
                    valid_games += 1
                else:
                    invalid_games += 1
        except Exception as e:
            invalid_games += 1
            print(e)

    print('Valid Games: ', valid_games)
    print('Invalid Games: ', invalid_games)

if __name__ == '__main__':
    main()
