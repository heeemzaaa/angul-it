import { Injectable, computed, signal } from '@angular/core';
import { ChallengeAnswer, ChallengeType } from '../models/challenge.model';
import { CaptchaSession, StageProgress, isSessionComplete } from '../models/session.model';
import { generateChallenge, isAnswerCorrect, pickStageTypes } from './challenge-generators';

const STORAGE_KEY = 'angul-it:session';

export const STAGE_COUNT = Object.values(ChallengeType).length;


@Injectable({ providedIn: 'root' })
export class CaptchaState {
  private readonly _session = signal<CaptchaSession>(this.loadOrCreateSession());

  readonly session = this._session.asReadonly();

  readonly currentStage = computed<StageProgress | undefined>(() => {
    const session = this._session();
    return session.stages[session.currentStageIndex];
  });

  readonly isComplete = computed(() => isSessionComplete(this._session()));


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
    const stages: StageProgress[] = pickStageTypes().map((type, index) => ({
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
