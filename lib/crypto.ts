import type { NoticeProvenance, ReceiptBlock } from '@/lib/types';

// Browser re-verification of the audit chain. Mirrors services/audit/hash_chain.py and the
// reference script in services/audit/verify_page.html:
//   hash_n = SHA-256(hash_{n-1} + JSON({actor, eventType, payloadDigest, sequence, timestamp}))
//   payloadDigest = SHA-256(payloadJson)

const encoder = new TextEncoder();

export const canHash = () => typeof crypto !== 'undefined' && !!crypto.subtle;

export async function sha256Hex(text: string): Promise<string> {
  const digest = await crypto.subtle.digest('SHA-256', encoder.encode(text));
  return Array.from(new Uint8Array(digest), (b) => b.toString(16).padStart(2, '0')).join('');
}

export interface ChainVerdict {
  /** Problems per block, in block order. Empty array = that block is sound. */
  problems: string[][];
  /** Sequence number of the first unsound block, or null when the chain is unbroken. */
  firstBad: number | null;
}

export async function verifyChain(blocks: ReceiptBlock[], genesisHash: string): Promise<ChainVerdict> {
  let prev = genesisHash;
  let firstBad: number | null = null;
  const problems: string[][] = [];

  for (let i = 0; i < blocks.length; i++) {
    const b = blocks[i];
    const found: string[] = [];
    if (b.sequence !== i + 1) found.push(`sequence gap (expected ${i + 1})`);
    if (b.previousHash !== prev) found.push('does not link to the previous row');
    // Keys in sorted order; values are ASCII, so this matches the server's canonical JSON byte for byte.
    const body = JSON.stringify({
      actor: b.actor, eventType: b.eventType, payloadDigest: b.payloadDigest,
      sequence: b.sequence, timestamp: b.timestamp,
    });
    if ((await sha256Hex(prev + body)) !== b.hash) found.push('row hash does not match its contents');
    if (b.payloadJson != null && (await sha256Hex(b.payloadJson)) !== b.payloadDigest) {
      found.push('payload was changed after it was recorded');
    }
    if (found.length && firstBad === null) firstBad = b.sequence;
    problems.push(found);
    prev = b.hash;
  }
  return { problems, firstBad };
}

export function payloadOf<T = Record<string, unknown>>(block: ReceiptBlock): T | null {
  try {
    return block.payloadJson ? (JSON.parse(block.payloadJson) as T) : null;
  } catch {
    return null;
  }
}

export interface RecordedNotice {
  block: ReceiptBlock;
  notice: NoticeProvenance;
}

export function recordedNotices(blocks: ReceiptBlock[]): RecordedNotice[] {
  return blocks
    .filter((b) => b.eventType === 'NOTICES_DRAFTED')
    .flatMap((block) =>
      (payloadOf<{ notices?: NoticeProvenance[] }>(block)?.notices ?? []).map((notice) => ({ block, notice })),
    );
}

/** Copy-paste can change line endings, edge whitespace or Unicode form without changing the words. */
export async function matchNotice(raw: string, recorded: RecordedNotice[]): Promise<RecordedNotice | null> {
  const variants = new Set([
    raw,
    raw.trim(),
    raw.replace(/\r\n/g, '\n').trim(),
    raw.normalize('NFC').replace(/\r\n/g, '\n').trim(),
  ]);
  const hashes = new Set(await Promise.all([...variants].map(sha256Hex)));
  return recorded.find((r) => hashes.has(r.notice.text_sha256)) ?? null;
}
