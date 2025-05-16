import csv

def main():
    current_ids = set()
    with open('requirements.csv', 'r') as file:
        reader = csv.DictReader(file)
        for row in reader:
            if row['ID'] is None or row['ID'] == '':
                continue
            current_ids.add(row['ID'])

    with open('results.csv', 'r') as file:
        reader = csv.DictReader(file)

        with open('deleted_reqs.csv', 'w') as outfile:
            writer = csv.DictWriter(outfile, reader.fieldnames)
        
            for row in reader:
                if row['id'] not in current_ids:
                    writer.writerow(row)


if __name__ == '__main__':
    main()
                