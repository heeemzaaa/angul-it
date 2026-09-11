import { Component, inject, signal } from '@angular/core';
import { FormControl, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { ChallengeAnswer, ChallengeType } from '../../models/challenge.model';
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

  readonly ChallengeType = ChallengeType;
  readonly stageCount = STAGE_COUNT;
  readonly stage = this.captchaState.currentStage;

  readonly numberAnswer = new FormControl<number | null>(null, Validators.required);
  readonly selectedTileIds = signal<string[]>([]);
  readonly wasWrong = signal(false);

  get canSubmit(): boolean {
    const challenge = this.stage()?.challenge;
    if (!challenge) return false;
    return challenge.type === ChallengeType.ColorGrid
      ? this.selectedTileIds().length > 0
      : this.numberAnswer.valid;
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

    if (correct) {
      this.numberAnswer.reset();
      this.selectedTileIds.set([]);
      if (this.captchaState.isComplete()) {
        this.router.navigateByUrl('/result');
      }
    }
  }
}
