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

function getLocalJobs(): JobScreeningSession[] {
  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch (e) {
    return [];
  }
}

function saveLocalJobs(jobs: JobScreeningSession[]) {
  try {
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(jobs));
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
      const merged = [...firestoreJobs];
      for (const loc of local) {
        if (!merged.some((m) => m.jobId === loc.jobId)) {
          merged.push(loc);
        }
      }
      return merged;
    }
  } catch (err) {
    console.warn('Firestore query error (falling back to local cache):', err);
  }

  return local.filter((j) => !j.userId || j.userId === userId);
}

/**
 * Fetch a single Job Workspace by ID
 */
export async function fetchJobSessionById(jobId: string): Promise<JobScreeningSession | null> {
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
  const local = getLocalJobs().filter((j) => j.jobId !== jobId);
  saveLocalJobs(local);

  try {
    const jobRef = doc(db, 'jobs', jobId);
    await deleteDoc(jobRef);
  } catch (err) {
    console.warn('Firestore delete error:', err);
  }
}
