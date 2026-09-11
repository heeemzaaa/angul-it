import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Router, provideRouter } from '@angular/router';

import { CaptchaState, STAGE_COUNT } from '../../services/captcha-state';
import { completeAllStages } from '../../testing/captcha-test-helpers';
import { Result } from './result';

describe('Result', () => {
  let component: Result;
  let fixture: ComponentFixture<Result>;
  let captchaState: CaptchaState;

  beforeEach(async () => {
    localStorage.clear();
    await TestBed.configureTestingModule({
      imports: [Result],
      providers: [provideRouter([])],
    }).compileComponents();

    captchaState = TestBed.inject(CaptchaState);
    completeAllStages(captchaState); // Result assumes a finished session, like the guarded route provides

    fixture = TestBed.createComponent(Result);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('summarizes every stage: total count, total attempts, and a non-negative duration', () => {
    const summary = component.summary();
    const expectedAttempts = captchaState.session().stages.reduce((sum, s) => sum + s.attempts, 0);

    expect(summary.totalStages).toBe(STAGE_COUNT);
    expect(summary.perStage).toHaveLength(STAGE_COUNT);
    expect(summary.totalAttempts).toBe(expectedAttempts);
    expect(summary.durationMs).toBeGreaterThanOrEqual(0);
  });

  it('renders one list item per stage with a human-readable label', () => {
    const items = fixture.nativeElement.querySelectorAll('.stage-list li');
    expect(items).toHaveLength(STAGE_COUNT);
    expect(items[0].textContent).toContain('Stage 1');
  });

  it('restart() resets the session and navigates back to /captcha', () => {
    const router = TestBed.inject(Router);
    const navigateSpy = vi.spyOn(router, 'navigateByUrl');
    const sessionIdBefore = captchaState.session().sessionId;

    component.restart();

    expect(captchaState.session().sessionId).not.toBe(sessionIdBefore);
    expect(captchaState.isComplete()).toBe(false);
    expect(navigateSpy).toHaveBeenCalledWith('/captcha');
  });
});
