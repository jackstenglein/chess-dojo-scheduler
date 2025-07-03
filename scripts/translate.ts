import Translate from '@google-cloud/translate';

const PROJECT_ID = 'chess-dojo-scheduler';

const translate = new Translate.v3.TranslationServiceClient({ projectId: PROJECT_ID });

async function quickStart() {
    const text = 'Hello, world';
    const lang = 'es';

    const [translation] = await translate.translateText({
        parent: `projects/${PROJECT_ID}`,
        sourceLanguageCode: 'en-US',
        targetLanguageCode: lang,
        mimeType: 'text/plain',
        contents: [text],
    });
    console.log(`Text: ${text}`);
    console.log(`Translation: ${JSON.stringify(translation, undefined, 2)}`);
}

quickStart();
