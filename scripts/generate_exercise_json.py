import requests
import json

def fetch_study(id: str):
    res = requests.get(f'https://lichess.org/api/study/{id}.pgn')
    return res.text.split('\n\n\n')


def main():
    entries = fetch_study('A8DoAE3O')

    pgns = []
    for entry in entries:
        if len(entry) > 1:
            pgns.append({
                "S": entry
            })
    
    with open('out.json', 'w') as outfile:
        json.dump(pgns, outfile)


if __name__ == '__main__':
    main()
