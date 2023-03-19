import csv
import matplotlib.pyplot as plt


def get_data(filepath: str):
    data = [None for i in range(0, 108)]

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


def convert_data_to_linechart(data):
    games_played = []
    average_rating_gain = []
    for i in range(len(data)):
        games_data = data[i]
        if games_data == None:
            continue
        games_played.append(i)
        average_rating_gain.append(games_data['total_rating_change']/games_data['number_of_users'])
    
    return games_played, average_rating_gain
            
            


def main():
    data = get_data('members.csv')
    x_axis, y_axis = convert_data_to_linechart(data)

    plt.plot(x_axis, y_axis)
    plt.title('Classical Games Played vs Average Rating Gain')
    plt.xlabel('Number of Classical Games Played')
    plt.ylabel('Average Rating Gain')
    plt.show()

if __name__ == '__main__':
    main()
