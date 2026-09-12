import { Component, computed, inject, signal } from '@angular/core';
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

  get canSubmit(): boolean {
    if (!this.isViewingActiveStage()) {
      return false;
    }
    const challenge = this.viewedStage()?.challenge;
    if (!challenge) {
      return false;
    }
    if (challenge.type === ChallengeType.ImageGrid) {
      return this.selectedTileIds().length > 0;
    }
    return this.numberAnswer.valid;
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
    if (!this.isViewingActiveStage()) {
      return;
    }

    const currentIds = this.selectedTileIds();
    if (currentIds.includes(id)) {
      const newIds: string[] = [];
      for (const tileId of currentIds) {
        if (tileId !== id) {
          newIds.push(tileId);
        }
      }
      this.selectedTileIds.set(newIds);
    } else {
      this.selectedTileIds.set([...currentIds, id]);
    }
  }

  submit(): void {
    if (!this.isViewingActiveStage() || !this.canSubmit) {
      return;
    }
    const challenge = this.viewedStage()!.challenge;

    let answer: ChallengeAnswer;
    if (challenge.type === ChallengeType.ImageGrid) {
      answer = this.selectedTileIds();
    } else {
      answer = this.numberAnswer.value!;
    }

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
