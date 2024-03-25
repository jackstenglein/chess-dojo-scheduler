import boto3

db = boto3.resource('dynamodb')
table = db.Table('dev-games')


def process_game(game):
    comments = game.get('comments', [])
    if comments is None:
        comments = []

    if len(comments) > 0:
        print(game)
        return True
    
    return False


def main():
    try:
        lastKey = None

        res = table.scan()
        lastKey = res.get('LastEvaluatedKey', None)
        items = res.get('Items', [])

        for item in items:
            quit = process_game(item)
            if quit:
                exit(0)

            while lastKey != None:
                print(lastKey)
                res = table.scan(ExclusiveStartKey=lastKey)

                lastKey = res.get('LastEvaluatedKey', None)
                items = res.get('Items', [])
                for item in items:
                    quit = process_game(item)
                    if quit:
                        exit(0)

    except Exception as e:
        print(e)


if __name__ == '__main__':
    main()
