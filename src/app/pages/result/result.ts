import { Component, computed, inject } from '@angular/core';
import { Router } from '@angular/router';
import { ChallengeType } from '../../models/challenge.model';
import { buildResultSummary } from '../../models/session.model';
import { CaptchaState } from '../../services/captcha-state';

@Component({
  selector: 'app-result',
  imports: [],
  templateUrl: './result.html',
  styleUrl: './result.scss',
})
export class Result {
  private readonly captchaState = inject(CaptchaState);
  private readonly router = inject(Router);

  readonly summary = computed(() => buildResultSummary(this.captchaState.session()));

  label(type: ChallengeType): string {
    if (type === ChallengeType.MathPuzzle) {
      return 'Math Puzzle';
    }
    if (type === ChallengeType.PatternSequence) {
      return 'Pattern Sequence';
    }
    return 'Image Grid';
  }

  restart(): void {
    this.captchaState.restart();
    this.router.navigateByUrl('/captcha');
  }
}
