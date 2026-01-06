export const tournamentsClock = new Date('2023-09-13T05:00:00.000Z');

/**
 * Returns the most recent Sunday before the given date.
 * @param d The date to get the Sunday for.
 * @returns The most recent Sunday before the given date.
 */
function getSunday(d: Date): Date {
    const day = d.getUTCDay();
    const diff = d.getUTCDate() - day;
    return new Date(d.setUTCDate(diff));
}

/**
 * Returns a new date created by adding the given number of days to d.
 * @param d The date to add days to.
 * @param count The number of days to add.
 * @returns A new date with the number of days added to d.
 */
function addDays(d: Date, count: number): Date {
    const result = new Date(d);
    result.setUTCDate(d.getUTCDate() + count);
    return result;
}

const sunday = getSunday(new Date());

export const dateMapper: Record<string, string> = {
    '2023-09-10': sunday.toISOString().slice(0, 10),
    '2023-09-11': addDays(sunday, 1).toISOString().slice(0, 10),
    '2023-09-12': addDays(sunday, 2).toISOString().slice(0, 10),
    '2023-09-13': addDays(sunday, 3).toISOString().slice(0, 10),
    '2023-09-14': addDays(sunday, 4).toISOString().slice(0, 10),
    '2023-09-15': addDays(sunday, 5).toISOString().slice(0, 10),
    '2023-09-16': addDays(sunday, 6).toISOString().slice(0, 10),
};

export interface Event {
    startTime: string;
    endTime: string;
}

const textEncoder = new TextEncoder();
const textDecoder = new TextDecoder();

/** Convert hex string back to buffer */
function hexToBuf(hex: string) {
    const bytes = new Uint8Array(hex.length / 2);
    for (let i = 0; i < bytes.length; i++) {
        bytes[i] = parseInt(hex.substr(i * 2, 2), 16);
    }
    return bytes;
}

/** Derive AES-256 key from a passphrase */
async function getKey(secret: string): Promise<CryptoKey> {
    const cryptoObj = window.crypto;
    const keyMaterial = await cryptoObj.subtle.importKey(
        'raw',
        textEncoder.encode(secret.padEnd(32, '0')).slice(0, 32),
        { name: 'AES-CBC' },
        false,
        ['encrypt', 'decrypt'],
    );
    return keyMaterial;
}

/** Decrypt an object */
export async function decryptObject<T>(
    encrypted: { iv: string; encryptedData: string },
    secret: string,
): Promise<T> {
    const cryptoObj = window.crypto;
    const iv = hexToBuf(encrypted.iv);
    const key = await getKey(secret);
    const decryptedBuffer = await cryptoObj.subtle.decrypt(
        { name: 'AES-CBC', iv },
        key,
        hexToBuf(encrypted.encryptedData),
    );
    const decryptedJson = textDecoder.decode(decryptedBuffer);
    return JSON.parse(decryptedJson) as T;
}
