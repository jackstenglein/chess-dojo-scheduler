import csv
import glicko2


MAX_SCORE = 9


def process_user(test, user, writer):
    (username, start_rating, _, score) = user
    score = int(score)
    start_rating = float(start_rating)

    if start_rating < 0:
        return

    player = glicko2.Player(start_rating)

    # Handle player wins
    for _ in range(0, score):
        rating, rd = test.rating, test.rd
        test.update_player([player.rating], [player.rd], [0])
        player.update_player([rating], [rd], [1])
    
    # Handle player losses
    for _ in range(0, MAX_SCORE-score):
        rating, rd = test.rating, test.rd
        test.update_player([player.rating], [player.rd], [1])
        player.update_player([rating], [rd], [0])        

    writer.writerow([
        username,
        score,
        test.rating,
        test.rd,
        test.vol,
        start_rating,
        player.rating,
        player.rd,
        player.vol,
    ])


def main():
    test = glicko2.Player(1750)

    with open('test_ratings.csv', 'w') as outfile:
        writer = csv.writer(outfile)
        writer.writerow([
            'Player',
            'Player Score',
            'Test End Rating',
            'Test End Rd',
            'Test End Volatility',
            'Player Start Rating',
            'Player End Rating',
            'Player End Rd',
            'Player End Volatility'
        ])
        writer.writerow(['Start', '-', test.rating, test.rd, test.vol, '-', '-', '-', '-'])

        with open('problem-7.csv', 'r') as infile:
            reader = csv.reader(infile)
            for row in reader:
                process_user(test, row, writer)


if __name__ == '__main__':
    main()
