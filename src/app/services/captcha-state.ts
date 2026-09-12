import { Injectable, computed, signal } from '@angular/core';
import { ChallengeAnswer, ChallengeType } from '../models/challenge.model';
import { CaptchaSession, StageProgress, StageStatus, isSessionComplete } from '../models/session.model';
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

    const stages: StageProgress[] = [];
    for (const s of session.stages) {
      if (s.stageIndex !== stageIndex) {
        stages.push(s);
        continue;
      }
      const updatedStage: StageProgress = { ...s, attempts: s.attempts + 1 };
      if (correct) {
        updatedStage.status = 'completed';
        updatedStage.completedAt = Date.now();
      }
      stages.push(updatedStage);
    }

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
      return null; 
    }
  }

  private createSession(): CaptchaSession {
    const types = pickStageTypes();

    const stages: StageProgress[] = [];
    for (let index = 0; index < types.length; index++) {
      let status: StageStatus = 'locked';
      if (index === 0) {
        status = 'active'; 
      }
      stages.push({
        stageIndex: index,
        challenge: generateChallenge(types[index]),
        status,
        attempts: 0,
      });
    }

    return {
      sessionId: crypto.randomUUID(),
      startedAt: Date.now(),
      currentStageIndex: 0,
      stages,
    };
  }
}
