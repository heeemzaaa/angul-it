import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Router, provideRouter } from '@angular/router';

import { ChallengeType } from '../../models/challenge.model';
import { CaptchaState } from '../../services/captcha-state';
import { correctAnswerFor } from '../../testing/captcha-test-helpers';
import { Captcha } from './captcha';

/** Selects every tile id in `answer` (image-grid) or sets the number control (math/pattern). */
function enterAnswer(component: Captcha, answer: ReturnType<typeof correctAnswerFor>): void {
  if (Array.isArray(answer)) {
    answer.forEach((id) => component.toggleTile(id));
  } else {
    component.numberAnswer.setValue(answer);
  }
}

/**
 * Stage order is shuffled per session — skip forward until an image-grid stage is
 * current. Goes through the component's own submit(), not the service directly,
 * so `viewedStageIndex` stays in sync exactly as it would for a real user (the
 * component is the only thing that ever advances the session in the real app).
 */
function advanceToImageGridStage(component: Captcha, state: CaptchaState): void {
  while (state.currentStage()!.challenge.type !== ChallengeType.ImageGrid) {
    enterAnswer(component, correctAnswerFor(state));
    component.submit();
  }
}

describe('Captcha', () => {
  let component: Captcha;
  let fixture: ComponentFixture<Captcha>;
  let captchaState: CaptchaState;
  let navigateSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(async () => {
    localStorage.clear();
    await TestBed.configureTestingModule({
      imports: [Captcha],
      providers: [provideRouter([])],
    }).compileComponents();

    fixture = TestBed.createComponent(Captcha);
    component = fixture.componentInstance;
    captchaState = TestBed.inject(CaptchaState);

    // Mocked (not just spied on) for every test in this file: the test router has no
    // real routes (provideRouter([])), and several tests drive the session to a
    // random stage order — any of them can incidentally complete every stage and
    // trigger a real navigateByUrl('/result') call, which would otherwise reject
    // with NG04002 (no route matches) as an unhandled rejection.
    navigateSpy = vi.spyOn(TestBed.inject(Router), 'navigateByUrl').mockResolvedValue(true);

    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('renders a labeled number input for math/pattern stages, or a 3x3 grid of named images for image-grid stages', () => {
    const challenge = captchaState.currentStage()!.challenge;
    const compiled = fixture.nativeElement as HTMLElement;

    if (challenge.type === ChallengeType.ImageGrid) {
      const tiles = compiled.querySelectorAll('.tile');
      expect(tiles).toHaveLength(9);
      expect(compiled.querySelector('input[type="number"]')).toBeNull();
      // Each tile's accessible name comes from its <img alt>, not a color/style alone.
      tiles.forEach((tile) => expect(tile.querySelector('img')?.getAttribute('alt')).toBeTruthy());
    } else {
      const input = compiled.querySelector('input[type="number"]') as HTMLInputElement;
      expect(input).not.toBeNull();
      expect(compiled.querySelector(`label[for="${input.id}"]`)).not.toBeNull();
      expect(compiled.querySelectorAll('.tile')).toHaveLength(0);
    }
  });

  it('keeps submit disabled until an answer is entered', () => {
    const submitButton = fixture.nativeElement.querySelector('button.submit') as HTMLButtonElement;
    expect(submitButton.disabled).toBe(true);
  });

  it('shows feedback and records an attempt on a wrong submission, without advancing the stage', () => {
    const challenge = captchaState.currentStage()!.challenge;
    if (challenge.type === ChallengeType.ImageGrid) {
      const wrongTile = challenge.tiles.find((t) => t.category !== challenge.targetCategory)!;
      component.toggleTile(wrongTile.id);
    } else {
      component.numberAnswer.setValue(challenge.answer + 1000);
    }

    component.submit();
    fixture.detectChanges();

    expect(component.wasWrong()).toBe(true);
    expect(captchaState.currentStage()!.attempts).toBe(1);
    // .feedback is an always-present aria-live region (so screen readers pick up the
    // change); only its text content signals whether an attempt just failed.
    expect(fixture.nativeElement.querySelector('.feedback').textContent).toContain('Not quite');
  });

  it('leaves the aria-live feedback region empty before any submission', () => {
    expect(fixture.nativeElement.querySelector('.feedback').textContent.trim()).toBe('');
  });

  it('resets the answer state after a wrong submission instead of leaving a stale pick behind', () => {
    const challenge = captchaState.currentStage()!.challenge;
    if (challenge.type === ChallengeType.ImageGrid) {
      const wrongTile = challenge.tiles.find((t) => t.category !== challenge.targetCategory)!;
      component.toggleTile(wrongTile.id);
    } else {
      component.numberAnswer.setValue(challenge.answer + 1000);
    }

    component.submit();
    fixture.detectChanges();

    expect(component.selectedTileIds()).toEqual([]);
    expect(component.numberAnswer.value).toBeNull();
  });

  it('regression: a leftover wrong-tile selection no longer corrupts the next correct submission', () => {
    advanceToImageGridStage(component, captchaState);
    fixture.detectChanges();

    const challenge = captchaState.currentStage()!.challenge;
    if (challenge.type !== ChallengeType.ImageGrid) {
      throw new Error('expected an image-grid stage');
    }
    const wrongTile = challenge.tiles.find((t) => t.category !== challenge.targetCategory)!;
    const correctIds = challenge.tiles
      .filter((t) => t.category === challenge.targetCategory)
      .map((t) => t.id);

    // First attempt: pick a wrong tile.
    component.toggleTile(wrongTile.id);
    component.submit();
    fixture.detectChanges();
    expect(component.wasWrong()).toBe(true);

    // Second attempt: select only the correct tiles. Before the fix, the
    // wrong tile from the first attempt was still selected underneath, so
    // this would still fail even though the user picked the right answer.
    correctIds.forEach((id) => component.toggleTile(id));
    component.submit();
    fixture.detectChanges();

    expect(component.wasWrong()).toBe(false);
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
    const lastStageIndex = captchaState.session().stages.length - 1;
    while (captchaState.session().currentStageIndex < lastStageIndex) {
      enterAnswer(component, correctAnswerFor(captchaState));
      component.submit();
    }
    fixture.detectChanges();

    enterAnswer(component, correctAnswerFor(captchaState));
    component.submit();

    expect(navigateSpy).toHaveBeenCalledWith('/result');
  });

  describe('backward navigation through completed stages', () => {
    it('locks stages that have not been reached yet', () => {
      const lastIndex = captchaState.session().stages.length - 1;
      expect(component.canViewStage(0)).toBe(true);
      expect(component.canViewStage(lastIndex)).toBe(false);

      const pills = fixture.nativeElement.querySelectorAll('.stage-pill') as NodeListOf<HTMLButtonElement>;
      expect(pills[0].disabled).toBe(false);
      expect(pills[lastIndex].disabled).toBe(true);
    });

    it('shows a read-only summary (no submit UI) when viewing a completed stage', () => {
      enterAnswer(component, correctAnswerFor(captchaState)); // completes stage 0
      component.submit();
      fixture.detectChanges();

      component.viewStage(0);
      fixture.detectChanges();

      expect(component.isViewingActiveStage()).toBe(false);
      expect(fixture.nativeElement.querySelector('button.submit')).toBeNull();
      expect(fixture.nativeElement.querySelector('.completed-note').textContent).toContain('Completed');
    });

    it('ignores toggleTile and submit while viewing a non-active stage', () => {
      enterAnswer(component, correctAnswerFor(captchaState)); // completes stage 0
      component.submit();
      fixture.detectChanges();
      const attemptsBefore = captchaState.session().stages[1].attempts;

      component.viewStage(0);
      fixture.detectChanges();
      component.toggleTile('tile-0');
      component.submit();

      expect(component.selectedTileIds()).toEqual([]);
      expect(captchaState.session().stages[1].attempts).toBe(attemptsBefore);
    });

    it('returns to the interactive form when navigating back to the active stage', () => {
      enterAnswer(component, correctAnswerFor(captchaState)); // completes stage 0
      component.submit();
      fixture.detectChanges();

      component.viewStage(0);
      fixture.detectChanges();
      expect(component.isViewingActiveStage()).toBe(false);

      component.viewStage(1);
      fixture.detectChanges();

      expect(component.isViewingActiveStage()).toBe(true);
      expect(fixture.nativeElement.querySelector('button.submit')).not.toBeNull();
    });
  });
});
