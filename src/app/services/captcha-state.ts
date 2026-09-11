import { Injectable, computed, signal } from '@angular/core';
import { ChallengeAnswer } from '../models/challenge.model';
import { CaptchaSession, StageProgress, isSessionComplete } from '../models/session.model';
import { generateChallenge, isAnswerCorrect, pickStageTypes } from './challenge-generators';

const STORAGE_KEY = 'angul-it:session';

/** Number of CAPTCHA stages in a session. */
export const STAGE_COUNT = 4;

/**
 * Single source of truth for "where is the user in the CAPTCHA flow." Holds
 * the active CaptchaSession as a signal, persists every change to
 * localStorage, and is what both CaptchaComponent and the /result route
 * guard read from.
 */
@Injectable({ providedIn: 'root' })
export class CaptchaState {
  private readonly _session = signal<CaptchaSession>(this.loadOrCreateSession());

  /** Read-only view of the full session — components derive their UI from this. */
  readonly session = this._session.asReadonly();

  readonly currentStage = computed<StageProgress | undefined>(() => {
    const session = this._session();
    return session.stages[session.currentStageIndex];
  });

  readonly isComplete = computed(() => isSessionComplete(this._session()));

  /**
   * Checks `answer` against the current stage's challenge. On a correct
   * answer, marks the stage completed and — unless it was the last stage —
   * unlocks and advances to the next one. Returns whether it was correct.
   */
  submitAnswer(answer: ChallengeAnswer): boolean {
    const session = this._session();
    const stageIndex = session.currentStageIndex;
    const stage = session.stages[stageIndex];
    if (!stage || stage.status === 'completed') {
      return false;
    }

    const correct = isAnswerCorrect(stage.challenge, answer);
    const stages = session.stages.map((s): StageProgress =>
      s.stageIndex === stageIndex
        ? { ...s, attempts: s.attempts + 1, status: correct ? 'completed' : s.status, completedAt: correct ? Date.now() : s.completedAt }
        : s,
    );

    const isLastStage = stageIndex === stages.length - 1;
    let currentStageIndex = stageIndex;
    if (correct && !isLastStage) {
      currentStageIndex = stageIndex + 1;
      stages[currentStageIndex] = { ...stages[currentStageIndex], status: 'active' };
    }

    this.persist({
      ...session,
      stages,
      currentStageIndex,
      completedAt: correct && isLastStage ? Date.now() : session.completedAt,
    });

    return correct;
  }

  /** Clears progress and starts a brand-new, freshly-generated session. */
  restart(): void {
    this.persist(this.createSession());
  }

  private persist(session: CaptchaSession): void {
    this._session.set(session);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(session));
  }

  private loadOrCreateSession(): CaptchaSession {
    const stored = this.readStoredSession();
    if (stored) {
      return stored;
    }
    const session = this.createSession();
    localStorage.setItem(STORAGE_KEY, JSON.stringify(session));
    return session;
  }

  private readStoredSession(): CaptchaSession | null {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    try {
      return JSON.parse(raw) as CaptchaSession;
    } catch {
      return null; // corrupted storage — fall back to a fresh session
    }
  }

  private createSession(): CaptchaSession {
    const stages: StageProgress[] = pickStageTypes(STAGE_COUNT).map((type, index) => ({
      stageIndex: index,
      challenge: generateChallenge(type),
      status: index === 0 ? 'active' : 'locked',
      attempts: 0,
    }));

    return {
      sessionId: crypto.randomUUID(),
      startedAt: Date.now(),
      currentStageIndex: 0,
      stages,
    };
  }
}
