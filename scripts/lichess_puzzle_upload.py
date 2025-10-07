import csv
from pymongo.mongo_client import MongoClient
from pymongo.server_api import ServerApi

THEMES = ['mateIn1', 'mateIn2', 'mateIn3', 'mate', 'advancedPawn', 'advantage', 'anastasiaMate', 'arabianMate', 'attackingF2F7', 'attraction', 'backRankMate', 'bishopEndgame', 'bodenMate', 'castling', 'capturingDefender', 'crushing', 'doubleBishopMate', 'dovetailMate', 'enPassant', 'equality', 'kingsideAttack', 'clearance', 'defensiveMove', 'deflection', 'discoveredAttack', 'doubleCheck', 'endgame', 'exposedKing', 'fork', 'hangingPiece', 'hookMate', 'interference', 'intermezzo', 'killBoxMate', 'vukovicMate', 'knightEndgame', 'long', 'master', 'masterVsMaster', 'middlegame', 'oneMove', 'opening', 'pawnEndgame', 'pin', 'promotion', 'queenEndgame', 'queenRookEndgame', 'queensideAttack', 'quietMove', 'rookEndgame', 'sacrifice', 'short', 'skewer', 'smotheredMate', 'superGM', 'trappedPiece', 'underPromotion', 'veryLong', 'xRayAttack', 'zugzwang', 'mix', 'playerGames']
COHORTS = ['0-300', '300-400', '400-500', '500-600', '600-700', '700-800', '800-900', '900-1000', '1000-1100', '1100-1200', '1200-1300', '1300-1400', '1400-1500', '1500-1600', '1600-1700', '1800-1900', '1900-2000', '2000-2100', '2100-2200', '2200-2300', '2300-2400', '2400+']

CSV_FILE = '/Users/jackstenglein/Downloads/lichess_db_puzzle.csv'
MAX_RATING_DEVIATION = 100
LIMITED_THEMES = [
    'attackingF2F7',
    'backRankMate',
    'smotheredMate'
]
MAX_LIMITED_THEMES = 200

uri = "mongodb+srv://puzzle_writer:<password>@dev-chess-dojo.pqjx4ee.mongodb.net/?retryWrites=true&w=majority&appName=dev-chess-dojo"
client = MongoClient(uri, server_api=ServerApi('1'))


def get_cohort(lichess_rating) -> str:
    if lichess_rating < 1250:
        return '0-300'
    if lichess_rating < 1310:
        return '300-400'
    if lichess_rating < 1370:
        return '400-500'
    if lichess_rating < 1435:
        return '500-600'
    if lichess_rating < 1500:
        return '600-700'
    if lichess_rating < 1550:
        return '700-800'
    if lichess_rating < 1600:
        return '800-900'
    if lichess_rating < 1665:
        return '900-1000'
    if lichess_rating < 1730:
        return '1000-1100'
    if lichess_rating < 1795:
        return '1100-1200'
    if lichess_rating < 1850:
        return '1200-1300'
    if lichess_rating < 1910:
        return '1300-1400'
    if lichess_rating < 1970:
        return '1400-1500'
    if lichess_rating < 2030:
        return '1500-1600'
    if lichess_rating < 2090:
        return '1600-1700'
    if lichess_rating < 2150:
        return '1700-1800'
    if lichess_rating < 2225:
        return '1800-1900'
    if lichess_rating < 2310:
        return '1900-2000'
    if lichess_rating < 2370:
        return '2000-2100'
    if lichess_rating < 2410:
        return '2100-2200'
    if lichess_rating < 2440:
        return '2200-2300'
    if lichess_rating < 2470:
        return '2300-2400'
    return '2400+'
    

def insert_row_if_necessary(row, collection, themes_per_cohort) -> bool:
    if 'mateIn1' not in row['Themes'] and 'mateIn2' not in row['Themes'] and 'mateIn3' not in row['Themes']:
        return False
    
    if int(row['RatingDeviation']) > MAX_RATING_DEVIATION:
        return False
    
    cohort = get_cohort(int(row['Rating']))
    cohort_theme_count = themes_per_cohort.get(cohort, {})
    for theme in LIMITED_THEMES:
        if theme in row['Themes'] and cohort_theme_count.get(theme, 0) >= MAX_LIMITED_THEMES:
            return False
        
    for theme in row['Themes'].split(' '):
        cohort_theme_count[theme] = cohort_theme_count.get(theme, 0) + 1
    themes_per_cohort[cohort] = cohort_theme_count

    try:
        collection.insert_one({
            '_id': row['PuzzleId'],
            'fen': row['FEN'],
            'moves': row['Moves'].split(' '),
            'rating': int(row['Rating']),
            'ratingDeviation': 2*int(row['RatingDeviation']),
            'themes': row['Themes'].split(' '),
            'openingTags': row['OpeningTags'].split(' '),
            'lichessId': row['PuzzleId'],
            'lichessGameUrl': row['GameUrl'],
        })
        return True
    except Exception as e:
        print(e)
        return False


def main():
    database = client["puzzles"]
    collection = database["puzzles"]
    themes_per_cohort = {}

    count = 0
    with open(CSV_FILE, 'r') as f:
        reader = csv.DictReader(f)
        for row in reader:
            if insert_row_if_necessary(row, collection, themes_per_cohort):
                count += 1

    print(f'Inserted {count} puzzles')

    with open('lichess_puzzle_cohort_stats.csv', 'w') as f:
        writer = csv.DictWriter(f, fieldnames=['cohort'] + THEMES)
        writer.writeheader()
        for cohort in COHORTS:
            cohort_themes = themes_per_cohort.get(cohort, {})
            cohort_themes['cohort'] = cohort
            writer.writerow(cohort_themes)



if __name__ == '__main__':
    try:
        client.admin.command('ping')
        print("Pinged your deployment. You successfully connected to MongoDB!")
        main()
        client.close()
    except Exception as e:
        print(e)
