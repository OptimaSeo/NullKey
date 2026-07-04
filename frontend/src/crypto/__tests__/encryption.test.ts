import { encryptMessage, decryptMessage, decryptFile } from '../encryption';
import { generateKeyPair } from '../keygen';
import { deriveSharedSecret } from '../encryption';

describe('encryptMessage / decryptMessage', () => {
  let aliceKeys: { privateKey: Uint8Array; publicKey: Uint8Array };
  let bobKeys: { privateKey: Uint8Array; publicKey: Uint8Array };
  let sharedAlice: Uint8Array;
  let sharedBob: Uint8Array;

  beforeAll(() => {
    aliceKeys = generateKeyPair();
    bobKeys = generateKeyPair();
    sharedAlice = deriveSharedSecret(aliceKeys.privateKey, bobKeys.publicKey);
    sharedBob = deriveSharedSecret(bobKeys.privateKey, aliceKeys.publicKey);
  });

  it('encrypts and decrypts a text message', async () => {
    const original = 'Hello, secret world!';
    const { ciphertext, nonce } = await encryptMessage(original, sharedAlice);

    const decrypted = await decryptMessage(ciphertext, nonce, sharedBob);
    expect(decrypted).toBe(original);
  });

  it('produces different ciphertext for same message (different nonces)', async () => {
    const original = 'Same message';
    const r1 = await encryptMessage(original, sharedAlice);
    const r2 = await encryptMessage(original, sharedAlice);

    expect(r1.ciphertext).not.toEqual(r2.ciphertext);
    expect(r1.nonce).not.toEqual(r2.nonce);
  });

  it('encrypts and decrypts binary data via decryptFile', async () => {
    const original = new Uint8Array([0x00, 0x01, 0x02, 0xff, 0xfe]);
    const { ciphertext, nonce } = await encryptMessage(original, sharedAlice);

    const decrypted = await decryptFile(ciphertext, nonce, sharedBob);
    expect(decrypted).toEqual(original);
  });

  it('fails to decrypt with wrong shared secret', async () => {
    const original = 'Wrong key test';
    const { ciphertext, nonce } = await encryptMessage(original, sharedAlice);

    const wrongSecret = deriveSharedSecret(aliceKeys.privateKey, aliceKeys.publicKey);
    await expect(decryptMessage(ciphertext, nonce, wrongSecret)).rejects.toThrow();
  });

  it('handles empty string', async () => {
    const { ciphertext, nonce } = await encryptMessage('', sharedAlice);
    const decrypted = await decryptMessage(ciphertext, nonce, sharedBob);
    expect(decrypted).toBe('');
  });
});
