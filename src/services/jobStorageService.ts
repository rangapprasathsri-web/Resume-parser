import {
  collection,
  doc,
  writeBatch,
  getDoc,
  getDocs,
  deleteDoc,
  query,
  where,
} from 'firebase/firestore';
import { db } from './firebase';
import { JobScreeningSession, FinalCandidateAnalysis } from '../types';

const LOCAL_STORAGE_KEY = 'evidencefirst_jobs_cache';
const DELETED_JOBS_KEY = 'evidencefirst_deleted_jobs';

function getDeletedJobIds(): Set<string> {
  try {
    const raw = localStorage.getItem(DELETED_JOBS_KEY);
    return raw ? new Set(JSON.parse(raw)) : new Set();
  } catch (e) {
    return new Set();
  }
}

function markJobAsDeleted(jobId: string) {
  try {
    const deleted = getDeletedJobIds();
    deleted.add(jobId);
    localStorage.setItem(DELETED_JOBS_KEY, JSON.stringify(Array.from(deleted)));
  } catch (e) {
    console.warn('Failed to save deleted job id', e);
  }
}

function getLocalJobs(): JobScreeningSession[] {
  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_KEY);
    const deleted = getDeletedJobIds();
    const list: JobScreeningSession[] = raw ? JSON.parse(raw) : [];
    return list.filter((j) => !deleted.has(j.jobId));
  } catch (e) {
    return [];
  }
}

function saveLocalJobs(jobs: JobScreeningSession[]) {
  try {
    const deleted = getDeletedJobIds();
    const filtered = jobs.filter((j) => !deleted.has(j.jobId));
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(filtered));
  } catch (e) {
    console.warn('Failed to save to localStorage', e);
  }
}

/**
 * Save / Update a Job Screening Session using atomic batched writes
 * Persists immediately to local memory cache and executes single-roundtrip Firestore batch commit
 */
export async function persistJobSession(session: JobScreeningSession, userId?: string): Promise<void> {
  const startMs = Date.now();
  const sessionWithUser: JobScreeningSession = {
    ...session,
    userId: userId || session.userId,
    updatedAt: new Date().toISOString(),
  };

  // 1. Instant local storage cache update
  const local = getLocalJobs().filter((j) => j.jobId !== session.jobId);
  local.unshift(sessionWithUser);
  saveLocalJobs(local);

  // 2. High-performance atomic Firestore batch write (1 network call instead of N+1 sequential writes)
  try {
    const batch = writeBatch(db);
    const jobRef = doc(db, 'jobs', session.jobId);

    batch.set(
      jobRef,
      {
        jobId: sessionWithUser.jobId,
        title: sessionWithUser.title,
        description: sessionWithUser.description,
        userId: sessionWithUser.userId || null,
        candidateCount: sessionWithUser.candidateCount,
        averageScore: sessionWithUser.averageScore,
        topScore: sessionWithUser.topScore,
        status: sessionWithUser.status,
        parsedJd: sessionWithUser.parsedJd,
        failedCandidates: sessionWithUser.failedCandidates || null,
        createdAt: sessionWithUser.createdAt,
        updatedAt: sessionWithUser.updatedAt,
      },
      { merge: true }
    );

    // Add candidate documents to the batch
    for (const candidate of sessionWithUser.candidates) {
      const candRef = doc(db, 'jobs', sessionWithUser.jobId, 'candidates', candidate.candidateId);
      batch.set(candRef, candidate, { merge: true });
    }

    await batch.commit();
    const duration = Date.now() - startMs;
    console.log(`[Storage] Firestore atomic batch commit finished in ${duration}ms for ${sessionWithUser.candidates.length} candidates.`);
  } catch (err) {
    console.warn('Firestore batch write notice (persisted in local cache):', err);
  }
}

/**
 * Fetch all Job Screening Sessions for the authenticated user
 */
export async function fetchUserJobSessions(userId?: string): Promise<JobScreeningSession[]> {
  const local = getLocalJobs();

  if (!userId) {
    return local;
  }

  try {
    const jobsRef = collection(db, 'jobs');
    const q = query(jobsRef, where('userId', '==', userId));
    const querySnapshot = await getDocs(q);

    if (!querySnapshot.empty) {
      const firestoreJobs: JobScreeningSession[] = [];
      for (const docSnap of querySnapshot.docs) {
        const data = docSnap.data() as JobScreeningSession;
        // Fetch candidates for each job
        const candsRef = collection(db, 'jobs', docSnap.id, 'candidates');
        const candsSnap = await getDocs(candsRef);
        const candidates: FinalCandidateAnalysis[] = [];
        candsSnap.forEach((cDoc) => {
          candidates.push(cDoc.data() as FinalCandidateAnalysis);
        });

        firestoreJobs.push({
          ...data,
          candidates,
        });
      }

      // Merge with local cache
      const deleted = getDeletedJobIds();
      const firestoreJobsFiltered = firestoreJobs.filter((j) => !deleted.has(j.jobId));
      const merged = [...firestoreJobsFiltered];
      for (const loc of local) {
        if (!merged.some((m) => m.jobId === loc.jobId) && !deleted.has(loc.jobId)) {
          merged.push(loc);
        }
      }
      return merged;
    }
  } catch (err) {
    console.warn('Firestore query error (falling back to local cache):', err);
  }

  const deleted = getDeletedJobIds();
  return local.filter((j) => !deleted.has(j.jobId) && (!j.userId || j.userId === userId));
}

/**
 * Fetch a single Job Workspace by ID
 */
export async function fetchJobSessionById(jobId: string): Promise<JobScreeningSession | null> {
  const deleted = getDeletedJobIds();
  if (deleted.has(jobId)) return null;

  const local = getLocalJobs().find((j) => j.jobId === jobId);
  if (local) return local;

  try {
    const jobRef = doc(db, 'jobs', jobId);
    const docSnap = await getDoc(jobRef);
    if (docSnap.exists()) {
      const data = docSnap.data() as JobScreeningSession;
      const candsRef = collection(db, 'jobs', jobId, 'candidates');
      const candsSnap = await getDocs(candsRef);
      const candidates: FinalCandidateAnalysis[] = [];
      candsSnap.forEach((cDoc) => {
        candidates.push(cDoc.data() as FinalCandidateAnalysis);
      });

      return {
        ...data,
        candidates,
      };
    }
  } catch (err) {
    console.warn('Firestore fetch error for jobId', jobId, err);
  }

  return null;
}

/**
 * Delete a Job Screening Session
 */
export async function removeJobSession(jobId: string): Promise<void> {
  // 1. Mark as permanently deleted to prevent resurrection from cached queries
  markJobAsDeleted(jobId);

  // 2. Instant local storage update
  const local = getLocalJobs().filter((j) => j.jobId !== jobId);
  saveLocalJobs(local);

  // 3. Server in-memory cleanup (if express server is running)
  try {
    fetch(`/api/jobs/${jobId}`, { method: 'DELETE' }).catch(() => {});
  } catch (_) {}

  // 4. Firestore cleanup (job doc + candidate subcollection docs)
  try {
    const jobRef = doc(db, 'jobs', jobId);
    const candsRef = collection(db, 'jobs', jobId, 'candidates');
    try {
      const candsSnap = await getDocs(candsRef);
      const batch = writeBatch(db);
      candsSnap.forEach((cDoc) => {
        batch.delete(cDoc.ref);
      });
      batch.delete(jobRef);
      await batch.commit();
    } catch (batchErr) {
      await deleteDoc(jobRef);
    }
  } catch (err) {
    console.warn('Firestore delete notice:', err);
    try {
      const jobRef = doc(db, 'jobs', jobId);
      await deleteDoc(jobRef);
    } catch (_) {}
  }
}

/**
 * Remove a single candidate from a session and re-persist with updated ranking
 */
export async function deleteCandidateFromSession(
  session: JobScreeningSession,
  candidateId: string,
  userId?: string
): Promise<JobScreeningSession> {
  return deleteCandidatesFromSession(session, [candidateId], userId);
}

/**
 * Remove multiple candidates from a session and re-persist with updated ranking
 */
export async function deleteCandidatesFromSession(
  session: JobScreeningSession,
  candidateIdsToDelete: string[],
  userId?: string
): Promise<JobScreeningSession> {
  const toDeleteSet = new Set(candidateIdsToDelete);
  const remainingCandidates = (session.candidates || [])
    .filter((c) => !toDeleteSet.has(c.candidateId))
    .sort((a, b) => b.comprehensiveScore - a.comprehensiveScore)
    .map((c, idx) => ({ ...c, rank: idx + 1 }));

  const scores = remainingCandidates.map((c) => c.comprehensiveScore);
  const avg = scores.length > 0 ? Math.round((scores.reduce((a, b) => a + b, 0) / scores.length) * 10) / 10 : 0;
  const top = scores.length > 0 ? Math.max(...scores) : 0;

  const updatedSession: JobScreeningSession = {
    ...session,
    candidateCount: remainingCandidates.length,
    averageScore: avg,
    topScore: top,
    candidates: remainingCandidates,
    updatedAt: new Date().toISOString(),
  };

  // Delete from Firestore candidate subcollection
  try {
    for (const candId of candidateIdsToDelete) {
      const candRef = doc(db, 'jobs', session.jobId, 'candidates', candId);
      deleteDoc(candRef).catch(() => {});
    }
  } catch (_) {}

  // Persist updated session
  await persistJobSession(updatedSession, userId || session.userId);
  return updatedSession;
}
