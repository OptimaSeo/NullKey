import 'fake-indexeddb/auto';
import { saveKeyPair, loadKeyPair, clearKeyPair } from '../index';

describe('IndexedDB key persistence', () => {
  const keyPair = {
    privateKey: new Uint8Array([1, 2, 3, 4]),
    publicKey: new Uint8Array([5, 6, 7, 8]),
  };

  afterEach(async () => {
    await clearKeyPair();
  });

  it('returns null when no key is stored', async () => {
    const loaded = await loadKeyPair();
    expect(loaded).toBeNull();
  });

  it('saves and loads a keypair', async () => {
    await saveKeyPair(keyPair);
    const loaded = await loadKeyPair();
    expect(loaded).not.toBeNull();
    expect(loaded!.privateKey).toEqual(keyPair.privateKey);
    expect(loaded!.publicKey).toEqual(keyPair.publicKey);
  });

  it('overwrites existing keypair on second save', async () => {
    await saveKeyPair(keyPair);

    const newPair = {
      privateKey: new Uint8Array([9, 9, 9]),
      publicKey: new Uint8Array([8, 8, 8]),
    };
    await saveKeyPair(newPair);

    const loaded = await loadKeyPair();
    expect(loaded!.privateKey).toEqual(newPair.privateKey);
    expect(loaded!.publicKey).toEqual(newPair.publicKey);
  });

  it('returns null after clearing', async () => {
    await saveKeyPair(keyPair);
    await clearKeyPair();
    const loaded = await loadKeyPair();
    expect(loaded).toBeNull();
  });
});
