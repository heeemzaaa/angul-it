import { Component, ElementRef, afterRenderEffect, computed, inject, signal } from '@angular/core';
import { FormControl, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { ChallengeAnswer, ChallengeType } from '../../models/challenge.model';
import { StageProgress } from '../../models/session.model';
import { CaptchaState, STAGE_COUNT } from '../../services/captcha-state';
import { colorName } from '../../services/challenge-generators';

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

  readonly viewedStageIndex = signal(this.captchaState.session().currentStageIndex);
  readonly viewedStage = computed<StageProgress | undefined>(() => this.stages()[this.viewedStageIndex()]);
  readonly isViewingActiveStage = computed(
    () => this.viewedStageIndex() === this.captchaState.session().currentStageIndex,
  );

  readonly numberAnswer = new FormControl<number | null>(null, Validators.required);
  readonly selectedTileIds = signal<string[]>([]);
  readonly wasWrong = signal(false);

  constructor() {
    afterRenderEffect(() => {
      this.viewedStage();
      this.elementRef.nativeElement.querySelector<HTMLInputElement>('#answer')?.focus();
    });
  }

  get canSubmit(): boolean {
    if (!this.isViewingActiveStage()) return false;
    const challenge = this.viewedStage()?.challenge;
    if (!challenge) return false;
    return challenge.type === ChallengeType.ColorGrid
      ? this.selectedTileIds().length > 0
      : this.numberAnswer.valid;
  }

  colorName(hex: string): string {
    return colorName(hex);
  }

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
      challenge.type === ChallengeType.ColorGrid ? this.selectedTileIds() : this.numberAnswer.value!;

    const correct = this.captchaState.submitAnswer(answer);
    this.wasWrong.set(!correct);

    this.numberAnswer.reset();
    this.selectedTileIds.set([]);

    if (correct) {
      this.viewedStageIndex.set(this.captchaState.session().currentStageIndex);
      if (this.captchaState.isComplete()) {
        this.router.navigateByUrl('/result');
      }
    }
  }
}
