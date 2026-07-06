# Technical Debt

## T1 — Centralize encoding utilities

**Status:** Open
**Priority:** Low
**Depends on:** Refactor of `frontend/app/page.tsx` into smaller modules

**Problem:**
Encoding functions are scattered across three files with three different implementations:
- `toHex`/`fromHex` in `frontend/src/socket/client.ts`
- `bufToB64`/`b64ToBuf` inline in `frontend/app/page.tsx`
- `bufToHex`/`hexToBuf` private in `frontend/src/storage/index.ts`
- Inline `toString(16).padStart(2, '0')` / `window.btoa()` patterns

**Solution:**
Create `frontend/src/utils/encoding.ts` with:
- `toHex(bytes: Uint8Array): string`
- `fromHex(hex: string): Uint8Array`
- `toBase64(bytes: Uint8Array): string`
- `fromBase64(b64: string): Uint8Array`

Then migrate all callers to use the shared module.

**Note:** Do NOT change the encoding format per data type (hex vs base64) — the current split is intentional and appropriate:
- hex for fingerprints, room IDs, nonces (human-readable, debugging)
- base64 for public keys (standard), file ciphertexts (space efficiency)

**When to do:**
After `page.tsx` is refactored into smaller modules, to avoid merge conflicts and duplicated work.
