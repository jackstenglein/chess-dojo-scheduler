const textEncoder = {
  encode: (str: string) => new Uint8Array(Buffer.from(str, 'utf-8')),
};

const textDecoder = {
  decode: (bytes: ArrayBuffer) => Buffer.from(bytes).toString('utf-8'),
};

function bufToHex(buffer: ArrayBuffer): string {
  return Array.from(new Uint8Array(buffer))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
}

function hexToBuf(hex: string): Uint8Array {
  const bytes = new Uint8Array(hex.length / 2);
  for (let i = 0; i < hex.length; i += 2) {
    bytes[i / 2] = parseInt(hex.substr(i, 2), 16);
  }
  return bytes;
}

async function getKey(secret: string): Promise<any> {
  const keyMaterial = await crypto.subtle.importKey(
    'raw',
    textEncoder.encode(secret.padEnd(32, '0')).slice(0, 32),
    {name: 'AES-CBC'},
    false,
    ['encrypt', 'decrypt'],
  );
  return keyMaterial;
}

export async function encryptObject(obj: Record<string, any>, secret: string) {
  const json = JSON.stringify(obj);
  const iv = crypto.getRandomValues(new Uint8Array(16));
  const key = await getKey(secret);

  const encryptedBuffer = await crypto.subtle.encrypt(
    {name: 'AES-CBC', iv},
    key,
    textEncoder.encode(json),
  );

  return {
    iv: bufToHex(iv.buffer),
    encryptedData: bufToHex(encryptedBuffer),
  };
}

/** Decrypt an object */
export async function decryptObject(
  encrypted: {iv: string; encryptedData: string},
  secret: string,
) {
  const iv = hexToBuf(encrypted.iv);
  const key = await getKey(secret);

  const decryptedBuffer = await crypto.subtle.decrypt(
    {name: 'AES-CBC', iv},
    key,
    hexToBuf(encrypted.encryptedData),
  );

  const decryptedJson = textDecoder.decode(decryptedBuffer);
  return JSON.parse(decryptedJson);
}
