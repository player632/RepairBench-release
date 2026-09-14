import { ChangeDetectionStrategy, ChangeDetectorRef, Component, inject } from '@angular/core';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { SHARED_IMPORTS } from '@shared';
import { NzMessageService } from 'ng-zorro-antd/message';

@Component({
  selector: 'app-basic-form',
  templateUrl: './basic-form.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: SHARED_IMPORTS
})
export class BasicFormComponent {
  private readonly msg = inject(NzMessageService);
  private readonly cdr = inject(ChangeDetectorRef);

  form = new FormGroup({
    title: new FormControl('', Validators.required),
    date: new FormControl('', Validators.required),
    goal: new FormControl('', Validators.required),
    standard: new FormControl('', Validators.required),
    client: new FormControl(''),
    invites: new FormControl(''),
    weight: new FormControl(''),
    public: new FormControl(1, [Validators.min(1), Validators.max(3)]),
    publicUsers: new FormControl('')
  });
  submitting = false;

  // Instrumentation probe: deterministic date fill for the required `date` control.
  protected probeDate(v: string): void {
    const parts = String(v).split(',');
    const mk = (s: string): Date => {
      const nums = s.trim().split('-').map(Number);
      return new Date(nums[0], nums[1] - 1, nums[2]);
    };
    const start = parts[0].trim();
    const end = parts.length === 2 ? parts[1].trim() : start;
    (this.form.controls.date as unknown as FormControl<Date[]>).setValue([mk(start), mk(end)]);
  }

  submit(): void {
    this.submitting = true;
    setTimeout(() => {
      this.msg.success(`提交成功`);
      this.cdr.detectChanges();
    }, 1000);
  }
}
