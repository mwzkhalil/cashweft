import { canActivateModel } from './decide';

export const OPENJEV = {
  repository: 'AlexWortega/openjev',
  revision: 'a20448012c213128955ca0c693e7c943865cab77',
  checkpoint: 'qwen3.5-0.8b-nli-v2s-long',
  sourceBytes: 1_706_036_760,
  sourceSha256: 'cf6d62a341c0c804f9a926eec71aefc9859adb28978736e757b49bce35d9b8f8',
} as const;

export function activatePack(complete: boolean, bytes: number, digest: string, expectedBytes: number, expectedDigest: string): boolean {
  if (expectedBytes <= 0 || expectedBytes >= OPENJEV.sourceBytes || expectedBytes > 900_000_000) return false;
  return canActivateModel(complete, bytes, digest, expectedBytes, expectedDigest);
}
