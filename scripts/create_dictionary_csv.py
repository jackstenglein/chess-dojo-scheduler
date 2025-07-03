import csv
from google.cloud import translate_v3
import itertools
import math


GCP_PROJECT_ID = 'chess-dojo-scheduler'
TARGET_LANGUAGES = ['es']
MAX_FIELDS_PER_REQUEST = 100
client = translate_v3.TranslationServiceClient()


def get_source_dictionary():
    sources = []
    with open('requirements.csv', newline='', encoding='utf8') as infile:
        reader = csv.DictReader(infile)

        for row in reader:
            if row['Requirement Name'] is None or row['Requirement Name'] == '': continue

            id = row['ID']
            name = row['Requirement Name']
            description = row['Description']

            if name:
                sources.append({
                    'id': f'{id}_name',
                    'en-US': name,
                })
            if description:
                sources.append({
                    'id': f'{id}_desc',
                    'en-US': description,
                })
    return sources


def translate_language(language, sources):
    i = 0
    while i < len(sources):
        request = translate_v3.TranslateTextRequest(
            parent=f"projects/{GCP_PROJECT_ID}",
            source_language_code="en-US",
            target_language_code=language,
            contents=[item['en-US'] for item in sources[i:i+MAX_FIELDS_PER_REQUEST]],
        )
        result = client.translate_text(request)

        for j, translation in enumerate(result.translations):
            sources[i+j][language] = translation.translated_text

        i += MAX_FIELDS_PER_REQUEST


def write_output_dictionary(filepath, dictionary):
    with open(filepath, 'w') as outfile:
        fieldnames = ['id', 'en-US']
        fieldnames.extend(TARGET_LANGUAGES)
        writer = csv.DictWriter(outfile, fieldnames=fieldnames)
        writer.writerows(dictionary)


def main():
    sources = get_source_dictionary()
    for language in TARGET_LANGUAGES:
        translate_language(language, sources)
    write_output_dictionary('dictionary.csv', sources)


if __name__ == '__main__':
    main()
