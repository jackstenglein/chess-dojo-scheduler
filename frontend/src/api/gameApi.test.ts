import { expect, it } from 'vitest';

import { GameSubmissionType, isLichessStudyURL } from './gameApi';

const testURLs: Record<string, string[]> = {
    [GameSubmissionType.ChesscomGame]: ['https://www.chess.com/game/live/107855985867'],
    [GameSubmissionType.LichessGame]: ['https://lichess.org/mN1qj7pP/black'],
    [GameSubmissionType.LichessStudy]: ['https://lichess.org/study/y14Z6s3N'],
    [GameSubmissionType.LichessChapter]: ['https://lichess.org/study/y14Z6s3N/fqJZzUm8'],
};

const expectExclusive = (
    submissionType: GameSubmissionType,
    match: (url: string) => boolean,
) => {
    for (const [otherType, urls] of Object.entries(testURLs)) {
        if (otherType !== submissionType) {
            for (const url of urls) {
                expect(
                    match(url),
                    `${submissionType} url matcher should not the ${otherType} url ${url}`,
                ).toBeFalsy();
            }
        }
    }
};

const expectMatches = (
    submissionType: GameSubmissionType,
    match: (url: string) => boolean,
) =>
    testURLs[submissionType].forEach((url) => {
        expect(
            match(url),
            `${submissionType} url matcher should match ${url}`,
        ).toBeTruthy();
    });

it('does not detect non-Lichess studies', async () =>
    expectExclusive(GameSubmissionType.LichessStudy, isLichessStudyURL));

it('detects Lichess studies', async () =>
    expectMatches(GameSubmissionType.LichessStudy, isLichessStudyURL));
