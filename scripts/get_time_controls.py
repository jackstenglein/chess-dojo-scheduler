import csv

def main():
    time_controls = set()
    with open('twic_output_full_3.csv', 'r') as f:
        reader = csv.reader(f)
        for line in reader:
            time_control = line[5]
            time_control = time_control.split(', ')
            time_controls.update(time_control)
    
    with open('twic_time_controls.csv', 'w') as f:
        writer = csv.writer(f)
        for tc in time_controls:
            writer.writerow([tc,])


if __name__ == '__main__':
    main()
