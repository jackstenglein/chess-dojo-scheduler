import sqlite3
import csv

THEMES = ['advancedPawn', 'advantage', 'anastasiaMate', 'arabianMate', 'attackingF2F7', 'attraction', 'backRankMate', 'bishopEndgame', 'bodenMate', 'castling', 'capturingDefender', 'crushing', 'doubleBishopMate', 'dovetailMate', 'equality', 'kingsideAttack', 'clearance', 'defensiveMove', 'deflection', 'discoveredAttack', 'doubleCheck', 'endgame', 'exposedKing', 'fork', 'hangingPiece', 'hookMate', 'interference', 'intermezzo', 'killBoxMate', 'vukovicMate', 'knightEndgame', 'long', 'master', 'masterVsMaster', 'middlegame', 'oneMove', 'opening', 'pawnEndgame', 'pin', 'promotion', 'queenEndgame', 'queenRookEndgame', 'queensideAttack', 'quietMove', 'rookEndgame', 'sacrifice', 'short', 'skewer', 'smotheredMate', 'superGM', 'trappedPiece', 'underPromotion', 'veryLong', 'xRayAttack', 'zugzwang', 'mix', 'playerGames']
MATE_IN_X_THEMES = ['mateIn1', 'mateIn2', 'mateIn3',] # 'mateIn4', 'mateIn5',
BIN_EDGES = [0, 1250, 1310, 1370, 1435, 1500, 1550, 1600, 1665, 1730, 1795, 1850, 1910, 1970, 2030, 2090, 2150, 2225, 2310, 2370, 2410, 2470, 3800]

PLAYS_INDEX = 6
POPULARITY_INDEX = 5
THEMES_INDEX = 7

conn = sqlite3.connect('/Users/jackstenglein/Documents/lichess_puzzles.db')


def stats_for_theme(theme):
    with open(f'{theme}.csv', 'a', newline='') as f:
        writer = csv.writer(f)
        # writer.writerow(['Lichess Rating Range', 'Total Puzzles', 'Average Num Plays', 'Average Popularity'] + THEMES)

        for i in range(21, len(BIN_EDGES) - 1):
            theme_counts = {}
            total_plays = 0
            total_popularity = 0
            
            # Define the rating range for the query
            lower_bound = BIN_EDGES[i]
            upper_bound = BIN_EDGES[i+1] - 1
            
            query = 'SELECT * FROM puzzles WHERE Themes LIKE ? AND Rating BETWEEN ? AND ?;'
            params = (f'%{theme}%', lower_bound, upper_bound)
            
            cursor = conn.cursor()
            cursor.execute(query, params) 
            rows = cursor.fetchall()
            cursor.close()
            count = len(rows)

            print(f'Got {count} rows for rating range {lower_bound}-{upper_bound}')

            for row in rows:
                total_plays += row[PLAYS_INDEX]
                total_popularity += row[POPULARITY_INDEX]
                themes = row[THEMES_INDEX].split(' ')
                for theme in themes:
                    theme_counts[theme] = theme_counts.get(theme, 0) + 1

            writer.writerow([
                f'{BIN_EDGES[i]}-{BIN_EDGES[i+1]-1}',
                count,
                total_plays / count if count > 0 else 0,
                total_popularity / count if count > 0 else 0,
            ] + [theme_counts.get(theme, 0) for theme in THEMES])
            break
        


if __name__ == '__main__':
    # cursor.execute("SELECT * FROM puzzles WHERE Themes LIKE '%mateIn1%' AND Rating BETWEEN 1250 AND 1309;")
    # print(len(cursor.fetchall()))
    for theme in MATE_IN_X_THEMES:
        stats_for_theme(theme)
    conn.close()
