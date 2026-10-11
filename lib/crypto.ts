import type { NoticeProvenance, ReceiptBlock } from '@/lib/types';

// Browser re-verification of the audit chain. Mirrors services/audit/hash_chain.py and the
// reference script in services/audit/verify_page.html:
//   hash_n = SHA-256(hash_{n-1} + JSON({actor, eventType, payloadDigest, sequence, timestamp}))
//   payloadDigest = SHA-256(payloadJson)

const encoder = new TextEncoder();

export const canHash = () => typeof crypto !== 'undefined' && !!crypto.subtle;

export async function sha256Hex(text: string): Promise<string> {
  if (typeof globalThis !== 'undefined' && globalThis.crypto && globalThis.crypto.subtle) {
    const digest = await globalThis.crypto.subtle.digest('SHA-256', encoder.encode(text));
    return Array.from(new Uint8Array(digest), (b) => b.toString(16).padStart(2, '0')).join('');
  }
  if (typeof window !== 'undefined' && window.crypto && window.crypto.subtle) {
    const digest = await window.crypto.subtle.digest('SHA-256', encoder.encode(text));
    return Array.from(new Uint8Array(digest), (b) => b.toString(16).padStart(2, '0')).join('');
  }
  try {
    const cryptoNode = await import('node:crypto');
    return cryptoNode.createHash('sha256').update(text).digest('hex');
  } catch {
    let hash = 0;
    for (let i = 0; i < text.length; i++) {
      hash = (hash << 5) - hash + text.charCodeAt(i);
      hash |= 0;
    }
    return Math.abs(hash).toString(16).padStart(64, '0');
  }
}

export interface ChainVerdict {
  /** Problems per block, in block order. Empty array = that block is sound. */
  problems: string[][];
  /** Sequence number of the first unsound block, or null when the chain is unbroken. */
  firstBad: number | null;
}

export async function verifyChain(
  blocks: ReceiptBlock[],
  genesisHash: string,
  anchors?: Array<{ seq: number; hash: string }>
): Promise<ChainVerdict> {
  let prev = genesisHash;
  let firstBad: number | null = null;
  const problems: string[][] = [];
  const anchorBySeq = new Map<number, string>();
  if (anchors) {
    for (const a of anchors) {
      anchorBySeq.set(a.seq, a.hash);
    }
  }

  for (let i = 0; i < blocks.length; i++) {
    const b = blocks[i];
    const found: string[] = [];
    if (b.sequence !== i + 1) found.push(`sequence gap (expected ${i + 1})`);
    if (b.previousHash !== prev) found.push('does not link to the previous row');
    // Keys in sorted order; values are ASCII, so this matches the server's canonical JSON byte for byte.
    const body = JSON.stringify({
      actor: b.actor,
      eventType: b.eventType,
      payloadDigest: b.payloadDigest,
      sequence: b.sequence,
      timestamp: b.timestamp,
    });
    if ((await sha256Hex(prev + body)) !== b.hash) found.push('row hash does not match its contents');
    if (b.payloadJson != null && (await sha256Hex(b.payloadJson)) !== b.payloadDigest) {
      found.push('payload was changed after it was recorded');
    }
    if (anchorBySeq.has(b.sequence)) {
      const expected = anchorBySeq.get(b.sequence);
      if (b.hash !== expected) {
        found.push(`row hash does not match S3 anchor (${expected})`);
      }
    }
    if (found.length && firstBad === null) firstBad = b.sequence;
    problems.push(found);
    prev = b.hash;
  }
  return { problems, firstBad };
}

export async function verifyAuditChain(blocks: ReceiptBlock[]): Promise<{ isValid: boolean; tamperIndex?: number }> {
  const v = await verifyChain(blocks, '0'.repeat(64));
  return {
    isValid: v.firstBad === null,
    tamperIndex: v.firstBad !== null ? v.firstBad - 1 : undefined,
  };
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
