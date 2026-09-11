import { Component, ElementRef, afterRenderEffect, computed, inject, signal } from '@angular/core';
import { FormControl, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { ChallengeAnswer, ChallengeType } from '../../models/challenge.model';
import { StageProgress } from '../../models/session.model';
import { CaptchaState, STAGE_COUNT } from '../../services/captcha-state';

@Component({
  selector: 'app-captcha',
  imports: [ReactiveFormsModule],
  templateUrl: './captcha.html',
  styleUrl: './captcha.scss',
})
export class Captcha {
  private readonly captchaState = inject(CaptchaState);
  private readonly router = inject(Router);
  private readonly elementRef: ElementRef<HTMLElement> = inject(ElementRef);

  readonly ChallengeType = ChallengeType;
  readonly stageCount = STAGE_COUNT;
  readonly stages = computed(() => this.captchaState.session().stages);

  /**
   * Which stage is currently shown. Defaults to (and follows) the active
   * stage, but the user can browse back to any already-completed one —
   * read-only, since re-submitting a finished stage isn't meaningful.
   */
  readonly viewedStageIndex = signal(this.captchaState.session().currentStageIndex);
  readonly viewedStage = computed<StageProgress | undefined>(() => this.stages()[this.viewedStageIndex()]);
  readonly isViewingActiveStage = computed(
    () => this.viewedStageIndex() === this.captchaState.session().currentStageIndex,
  );

  readonly numberAnswer = new FormControl<number | null>(null, Validators.required);
  readonly selectedTileIds = signal<string[]>([]);
  readonly wasWrong = signal(false);

  constructor() {
    // The native `autofocus` attribute only fires on a real page load — Angular
    // swapping in a new <input> for the next stage doesn't retrigger it once the
    // user has already interacted with the page. Focus it explicitly instead,
    // re-running after every render where the viewed stage changed.
    afterRenderEffect(() => {
      this.viewedStage();
      this.elementRef.nativeElement.querySelector<HTMLInputElement>('#answer')?.focus();
    });
  }

  get canSubmit(): boolean {
    if (!this.isViewingActiveStage()) return false;
    const challenge = this.viewedStage()?.challenge;
    if (!challenge) return false;
    return challenge.type === ChallengeType.ImageGrid
      ? this.selectedTileIds().length > 0
      : this.numberAnswer.valid;
  }

  /** Only stages already reached — completed ones, or the current active one — can be viewed. */
  canViewStage(index: number): boolean {
    return index <= this.captchaState.session().currentStageIndex;
  }

  viewStage(index: number): void {
    if (this.canViewStage(index)) {
      this.viewedStageIndex.set(index);
    }
  }

  toggleTile(id: string): void {
    if (!this.isViewingActiveStage()) return;
    this.selectedTileIds.update((ids) =>
      ids.includes(id) ? ids.filter((tileId) => tileId !== id) : [...ids, id],
    );
  }

  submit(): void {
    if (!this.isViewingActiveStage()) return;
    const challenge = this.viewedStage()?.challenge;
    if (!challenge || !this.canSubmit) return;

    const answer: ChallengeAnswer =
      challenge.type === ChallengeType.ImageGrid ? this.selectedTileIds() : this.numberAnswer.value!;

    const correct = this.captchaState.submitAnswer(answer);
    this.wasWrong.set(!correct);

    this.numberAnswer.reset();
    this.selectedTileIds.set([]);

    if (correct) {
      // Follow the view forward to whatever stage is now active.
      this.viewedStageIndex.set(this.captchaState.session().currentStageIndex);
      if (this.captchaState.isComplete()) {
        this.router.navigateByUrl('/result');
      }
    }
  }
}
