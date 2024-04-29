import { describe, expect, it } from 'vitest';

import {
    GameSubmissionType,
    isChesscomGameURL,
    isLichessChapterURL,
    isLichessGameURL,
    isLichessStudyURL,
} from './gameApi';

const testURLs: Record<string, string[]> = {
    [GameSubmissionType.ChesscomGame]: ['https://www.chess.com/game/live/107855985867'],
    [GameSubmissionType.LichessGame]: ['https://lichess.org/mN1qj7pP/black'],
    [GameSubmissionType.LichessStudy]: ['https://lichess.org/study/JIPuIPVG/'],
    [GameSubmissionType.LichessChapter]: ['https://lichess.org/study/y14Z6s3N/fqJZzUm8'],
};

const urlMatchers: Record<string, (url: string) => boolean> = {
    [GameSubmissionType.ChesscomGame]: isChesscomGameURL,
    [GameSubmissionType.LichessGame]: isLichessGameURL,
    [GameSubmissionType.LichessStudy]: isLichessStudyURL,
    [GameSubmissionType.LichessChapter]: isLichessChapterURL,
};

Object.entries(urlMatchers).forEach(([submissionType, match]) =>
    describe(`${submissionType} URL matcher`, () => {
        it('does not match URLs that other matchers match', () => {
            for (const [otherType, urls] of Object.entries(testURLs)) {
                if (otherType !== submissionType) {
                    for (const url of urls) {
                        expect(
                            match(url),
                            `${submissionType} url matcher should not match the ${otherType} url ${url}`,
                        ).toBeFalsy();
                    }
                }
            }
        });

        it('matches relevant URLs', async () => {
            testURLs[submissionType].forEach((url) => {
                expect(
                    match(url),
                    `${submissionType} url matcher should match ${url}`,
                ).toBeTruthy();
            });
        });
    }),
);
