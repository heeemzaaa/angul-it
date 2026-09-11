import { TestBed } from '@angular/core/testing';

import { correctAnswerFor } from '../testing/captcha-test-helpers';
import { CaptchaState, STAGE_COUNT } from './captcha-state';

const STORAGE_KEY = 'angul-it:session';

describe('CaptchaState', () => {
  let service: CaptchaState;

  beforeEach(() => {
    localStorage.clear();
    TestBed.configureTestingModule({});
    service = TestBed.inject(CaptchaState);
  });

  it('is created', () => {
    expect(service).toBeTruthy();
  });

  it('starts a fresh session with the first stage active and the rest locked', () => {
    const session = service.session();
    expect(session.stages).toHaveLength(STAGE_COUNT);
    expect(session.currentStageIndex).toBe(0);
    expect(session.stages[0].status).toBe('active');
    expect(session.stages.slice(1).every((s) => s.status === 'locked')).toBe(true);
    expect(service.isComplete()).toBe(false);
  });

  it('persists the initial session to localStorage', () => {
    const stored = JSON.parse(localStorage.getItem(STORAGE_KEY)!);
    expect(stored.sessionId).toBe(service.session().sessionId);
  });

  it('keeps the user on the same stage and records an attempt on a wrong answer', () => {
    service.submitAnswer(-1); // never a valid answer for any challenge type
    const session = service.session();
    expect(session.currentStageIndex).toBe(0);
    expect(session.stages[0].status).toBe('active');
    expect(session.stages[0].attempts).toBe(1);
  });

  it('advances to the next stage on a correct answer, unlocking it', () => {
    const correct = service.submitAnswer(correctAnswerFor(service));
    expect(correct).toBe(true);

    const session = service.session();
    expect(session.stages[0].status).toBe('completed');
    expect(session.currentStageIndex).toBe(1);
    expect(session.stages[1].status).toBe('active');
    expect(service.isComplete()).toBe(false);
  });

  it('completes the session once every stage is answered correctly', () => {
    for (let i = 0; i < STAGE_COUNT; i++) {
      expect(service.submitAnswer(correctAnswerFor(service))).toBe(true);
    }
    const session = service.session();
    expect(service.isComplete()).toBe(true);
    expect(session.stages.every((s) => s.status === 'completed')).toBe(true);
    expect(session.completedAt).toBeDefined();
  });

  it('ignores further submissions once a stage is already completed', () => {
    service.submitAnswer(correctAnswerFor(service)); // completes stage 0, advances to stage 1
    const beforeStage1Attempts = service.session().stages[1].attempts;

    // Re-answering stage 0 shouldn't be possible via the service's own current-stage pointer,
    // but guard the invariant directly: submitting again only ever affects the *current* stage.
    service.submitAnswer(-1);
    expect(service.session().stages[1].attempts).toBe(beforeStage1Attempts + 1);
    expect(service.session().stages[0].attempts).toBe(1);
  });

  it('survives a "page refresh" by resuming from localStorage instead of generating a new session', () => {
    service.submitAnswer(correctAnswerFor(service));
    const sessionIdBefore = service.session().sessionId;
    const stageIndexBefore = service.session().currentStageIndex;

    // Simulate a refresh: a brand-new injector/service instance reading the same localStorage.
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({});
    const resumed = TestBed.inject(CaptchaState);

    expect(resumed.session().sessionId).toBe(sessionIdBefore);
    expect(resumed.session().currentStageIndex).toBe(stageIndexBefore);
  });

  it('falls back to a fresh session instead of throwing when localStorage holds corrupted data', () => {
    localStorage.setItem(STORAGE_KEY, '{not valid json');
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({});

    expect(() => TestBed.inject(CaptchaState)).not.toThrow();
    const recovered = TestBed.inject(CaptchaState);
    expect(recovered.session().stages).toHaveLength(STAGE_COUNT);
  });

  it('restart() discards progress and starts a new session', () => {
    service.submitAnswer(correctAnswerFor(service));
    const sessionIdBefore = service.session().sessionId;

    service.restart();

    expect(service.session().sessionId).not.toBe(sessionIdBefore);
    expect(service.session().currentStageIndex).toBe(0);
    expect(service.isComplete()).toBe(false);
  });
});
