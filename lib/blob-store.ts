import "server-only";
import { del, get, list, put } from "@vercel/blob";

/**
 * Vercel Blob backend for `store.ts`.
 *
 * Every blob is private, so the data is only reachable through the SDK using
 * BLOB_READ_WRITE_TOKEN — there is no public URL for a resume or an
 * application list. Reads bypass the CDN cache because a stale read followed by
 * a read-modify-write would silently drop the previous mutation.
 */

const PREFIX = "work-dashboard/";

export const blobEnabled = () => Boolean(process.env.BLOB_READ_WRITE_TOKEN);

const key = (relPath: string) => `${PREFIX}${relPath}`;

export async function blobRead(relPath: string): Promise<string | null> {
  const result = await get(key(relPath), { access: "private", useCache: false });
  if (!result?.stream) return null;
  return new Response(result.stream).text();
}

export async function blobWrite(
  relPath: string,
  body: string,
  contentType: string,
): Promise<void> {
  await put(key(relPath), body, {
    access: "private",
    addRandomSuffix: false,
    allowOverwrite: true,
    contentType,
    cacheControlMaxAge: 0,
  });
}

export async function blobListNames(relDir: string): Promise<string[]> {
  const prefix = key(relDir.endsWith("/") ? relDir : `${relDir}/`);
  const { blobs } = await list({ prefix, limit: 1000 });
  return blobs.map((b) => b.pathname.slice(prefix.length)).filter(Boolean);
}

export async function blobReadBinary(relPath: string): Promise<Buffer | null> {
  const result = await get(key(relPath), { access: "private", useCache: false });
  if (!result?.stream) return null;
  return Buffer.from(await new Response(result.stream).arrayBuffer());
}

export async function blobWriteBinary(
  relPath: string,
  body: Buffer,
  contentType: string,
): Promise<void> {
  await put(key(relPath), body, {
    access: "private",
    addRandomSuffix: false,
    allowOverwrite: true,
    contentType,
    cacheControlMaxAge: 0,
  });
}

export async function blobDelete(relPath: string): Promise<void> {
  await del(key(relPath));
}
