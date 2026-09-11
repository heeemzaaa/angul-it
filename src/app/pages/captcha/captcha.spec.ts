import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Router, provideRouter } from '@angular/router';

import { ChallengeType } from '../../models/challenge.model';
import { CaptchaState } from '../../services/captcha-state';
import { correctAnswerFor } from '../../testing/captcha-test-helpers';
import { Captcha } from './captcha';

/** Selects every tile id in `answer` (color-grid) or sets the number control (math/pattern). */
function enterAnswer(component: Captcha, answer: ReturnType<typeof correctAnswerFor>): void {
  if (Array.isArray(answer)) {
    answer.forEach((id) => component.toggleTile(id));
  } else {
    component.numberAnswer.setValue(answer);
  }
}

describe('Captcha', () => {
  let component: Captcha;
  let fixture: ComponentFixture<Captcha>;
  let captchaState: CaptchaState;

  beforeEach(async () => {
    localStorage.clear();
    await TestBed.configureTestingModule({
      imports: [Captcha],
      providers: [provideRouter([])],
    }).compileComponents();

    fixture = TestBed.createComponent(Captcha);
    component = fixture.componentInstance;
    captchaState = TestBed.inject(CaptchaState);
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('renders a number input for math/pattern stages, or a 3x3 grid for color-grid stages', () => {
    const challenge = captchaState.currentStage()!.challenge;
    const compiled = fixture.nativeElement as HTMLElement;

    if (challenge.type === ChallengeType.ColorGrid) {
      expect(compiled.querySelectorAll('.tile')).toHaveLength(9);
      expect(compiled.querySelector('input[type="number"]')).toBeNull();
    } else {
      expect(compiled.querySelector('input[type="number"]')).not.toBeNull();
      expect(compiled.querySelectorAll('.tile')).toHaveLength(0);
    }
  });

  it('keeps submit disabled until an answer is entered', () => {
    const submitButton = fixture.nativeElement.querySelector('button.submit') as HTMLButtonElement;
    expect(submitButton.disabled).toBe(true);
  });

  it('shows feedback and records an attempt on a wrong submission, without advancing the stage', () => {
    const challenge = captchaState.currentStage()!.challenge;
    if (challenge.type === ChallengeType.ColorGrid) {
      const wrongTile = challenge.tiles.find((t) => t.color !== challenge.targetColor)!;
      component.toggleTile(wrongTile.id);
    } else {
      component.numberAnswer.setValue(challenge.answer + 1000);
    }

    component.submit();
    fixture.detectChanges();

    expect(component.wasWrong()).toBe(true);
    expect(captchaState.currentStage()!.attempts).toBe(1);
    expect(fixture.nativeElement.querySelector('.feedback')).not.toBeNull();
  });

  it('advances to the next stage on a correct submission', () => {
    const stageIndexBefore = captchaState.session().currentStageIndex;
    enterAnswer(component, correctAnswerFor(captchaState));

    component.submit();
    fixture.detectChanges();

    expect(component.wasWrong()).toBe(false);
    expect(captchaState.session().currentStageIndex).toBe(stageIndexBefore + 1);
  });

  it('navigates to /result once the final stage is completed correctly', () => {
    const router = TestBed.inject(Router);
    const navigateSpy = vi.spyOn(router, 'navigateByUrl');

    // Drive every stage but the last one directly through the service...
    const lastStageIndex = captchaState.session().stages.length - 1;
    while (captchaState.session().currentStageIndex < lastStageIndex) {
      captchaState.submitAnswer(correctAnswerFor(captchaState));
    }
    fixture.detectChanges();

    // ...then answer the final stage through the component itself.
    enterAnswer(component, correctAnswerFor(captchaState));
    component.submit();

    expect(navigateSpy).toHaveBeenCalledWith('/result');
  });
});
