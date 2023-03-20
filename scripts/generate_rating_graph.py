import csv
import matplotlib.pyplot as plt

def get_bin_name(bin_size: int, games_played: int):
    bin_start = games_played - (games_played % bin_size)
    bin_end = bin_start + bin_size
    return f


def get_data(filepath: str, max_games: int):
    data = [None for i in range(0, max_games)]

    with open(filepath) as csvfile:
        reader = csv.DictReader(csvfile)
        for row in reader:
            rating_change = row['Rating Gain']
            if rating_change == '':
                continue
            else:
                rating_change = float(rating_change)
                
            games_played = row['Classical Games Played']
            if games_played == '':
                games_played = 0
            else:
                games_played = int(games_played)

            games_data = data[games_played]
            if games_data == None:
                data[games_played] = {
                    'number_of_users': 1,
                    'total_rating_change': rating_change
                }
            else:
                games_data['number_of_users'] += 1
                games_data['total_rating_change'] += rating_change
    
    return data


def convert_data_to_linechart(data, bin_size: int, max_games: int):
    bin_names = []
    average_rating_gain = []

    i = 0
    while i < max_games:
        games_data = data[i : i+bin_size]
        total_rating_change = sum([d['total_rating_change'] for d in games_data if d is not None])
        number_of_users = sum([d['number_of_users'] for d in games_data if d is not None])
        if number_of_users == 0:
            i += bin_size
            continue

        bin_names.append(f'{i}-{i+bin_size}')
        average_rating_gain.append(float(total_rating_change)/number_of_users)
        i += bin_size
    
    return bin_names, average_rating_gain
            

def main():
    max_games = 110
    bin_size = 10
    data = get_data('members.csv', max_games)
    x_axis, y_axis = convert_data_to_linechart(data, bin_size, max_games)

    plt.plot(x_axis, y_axis)
    plt.title('Classical Games Played vs Average Rating Gain')
    plt.xlabel('Number of Classical Games Played')
    plt.ylabel('Average Rating Gain')
    plt.show()

if __name__ == '__main__':
    main()
