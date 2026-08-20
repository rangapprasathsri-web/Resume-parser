/**
 * High-performance In-Memory Caches for EvidenceFirst Engine
 * - JD Requirements Cache
 * - Extracted Candidate Profile Cache (Content-Hash keyed)
 * - Normalized Skill / Tech Alias Lookup Table
 */
import { ParsedJobDescription } from '../ats/jdParser';
import { CandidateProfile } from '../parser/fieldParser';
import crypto from 'crypto';

// 1. JD Cache
const jdCache = new Map<string, { parsed: ParsedJobDescription; timestamp: number }>();

// 2. Candidate Profile Cache (SHA-256 of text -> CandidateProfile)
const profileCache = new Map<string, { profile: CandidateProfile; timestamp: number }>();

// Cache TTL: 24 hours
const CACHE_TTL_MS = 24 * 60 * 60 * 1000;

/**
 * Deterministic SHA-256 Content Hash
 */
export function computeSha256(content: string | Buffer): string {
  return crypto.createHash('sha256').update(content).digest('hex');
}

/**
 * Fast string normalization for hashing & matching
 */
export function normalizeTextKey(text: string): string {
  return text.toLowerCase().replace(/\s+/g, ' ').trim();
}

/**
 * Get or Compute Cached JD
 */
export function getCachedJd(
  rawJdText: string,
  title?: string,
  parserFn?: (text: string, title?: string) => ParsedJobDescription
): ParsedJobDescription | null {
  const key = computeSha256(normalizeTextKey(rawJdText) + '::' + (title || ''));
  const cached = jdCache.get(key);
  
  if (cached && Date.now() - cached.timestamp < CACHE_TTL_MS) {
    return cached.parsed;
  }

  if (parserFn) {
    const parsed = parserFn(rawJdText, title);
    jdCache.set(key, { parsed, timestamp: Date.now() });
    return parsed;
  }

  return null;
}

export function setCachedJd(rawJdText: string, parsed: ParsedJobDescription, title?: string): void {
  const key = computeSha256(normalizeTextKey(rawJdText) + '::' + (title || ''));
  jdCache.set(key, { parsed, timestamp: Date.now() });
}

/**
 * Get or Compute Cached Candidate Profile
 */
export function getCachedCandidateProfile(
  rawResumeText: string
): CandidateProfile | null {
  const key = computeSha256(normalizeTextKey(rawResumeText));
  const cached = profileCache.get(key);

  if (cached && Date.now() - cached.timestamp < CACHE_TTL_MS) {
    return cached.profile;
  }

  return null;
}

export function setCachedCandidateProfile(
  rawResumeText: string,
  profile: CandidateProfile
): void {
  const key = computeSha256(normalizeTextKey(rawResumeText));
  profileCache.set(key, { profile, timestamp: Date.now() });
}

export function getCacheStats() {
  return {
    cachedJds: jdCache.size,
    cachedProfiles: profileCache.size,
  };
}

export function clearEngineCache(): void {
  jdCache.clear();
  profileCache.clear();
}
