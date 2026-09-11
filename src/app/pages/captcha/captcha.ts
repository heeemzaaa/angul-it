import { Component, ElementRef, afterRenderEffect, inject, signal } from '@angular/core';
import { FormControl, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { ChallengeAnswer, ChallengeType } from '../../models/challenge.model';
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
  readonly stage = this.captchaState.currentStage;

  readonly numberAnswer = new FormControl<number | null>(null, Validators.required);
  readonly selectedTileIds = signal<string[]>([]);
  readonly wasWrong = signal(false);

  constructor() {
    // The native `autofocus` attribute only fires on a real page load — Angular
    // swapping in a new <input> for the next stage doesn't retrigger it once the
    // user has already interacted with the page. Focus it explicitly instead,
    // re-running after every render where the active stage changed.
    afterRenderEffect(() => {
      this.stage();
      this.elementRef.nativeElement.querySelector<HTMLInputElement>('#answer')?.focus();
    });
  }

  get canSubmit(): boolean {
    const challenge = this.stage()?.challenge;
    if (!challenge) return false;
    return challenge.type === ChallengeType.ColorGrid
      ? this.selectedTileIds().length > 0
      : this.numberAnswer.valid;
  }

  colorName(hex: string): string {
    return colorName(hex);
  }

  toggleTile(id: string): void {
    this.selectedTileIds.update((ids) =>
      ids.includes(id) ? ids.filter((tileId) => tileId !== id) : [...ids, id],
    );
  }

  submit(): void {
    const challenge = this.stage()?.challenge;
    if (!challenge || !this.canSubmit) return;

    const answer: ChallengeAnswer =
      challenge.type === ChallengeType.ColorGrid ? this.selectedTileIds() : this.numberAnswer.value!;

    const correct = this.captchaState.submitAnswer(answer);
    this.wasWrong.set(!correct);

    // Always start the next attempt from a clean slate — otherwise a stale
    // selection from a previous wrong guess lingers and silently corrupts
    // the next submission (a tile the user forgot was still toggled on).
    this.numberAnswer.reset();
    this.selectedTileIds.set([]);

    if (correct && this.captchaState.isComplete()) {
      this.router.navigateByUrl('/result');
    }
  }
}
