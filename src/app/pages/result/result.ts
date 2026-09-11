import { Component, computed, inject } from '@angular/core';
import { Router } from '@angular/router';
import { ChallengeType } from '../../models/challenge.model';
import { buildResultSummary } from '../../models/session.model';
import { CaptchaState } from '../../services/captcha-state';

const CHALLENGE_TYPE_LABELS: Record<ChallengeType, string> = {
  [ChallengeType.MathPuzzle]: 'Math Puzzle',
  [ChallengeType.PatternSequence]: 'Pattern Sequence',
  [ChallengeType.ColorGrid]: 'Color Grid',
};

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
    return CHALLENGE_TYPE_LABELS[type];
  }

  restart(): void {
    this.captchaState.restart();
    this.router.navigateByUrl('/captcha');
  }
}
