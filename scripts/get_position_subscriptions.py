from dynamodb_json import json_util as json 


def main():
    with open('subscriptions.json', 'w') as out:
        for i in range(31):
            with open(f'/Users/jackstenglein/Downloads/explorer{i}.json', 'r') as file:
                while line := file.readline():
                    item = json.loads(line)['Item']
                    if item['id'].startswith('FOLLOWER#'):
                        out.write(json.dumps(item))


if __name__ == '__main__':
    main()
