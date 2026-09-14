import { Component, inject } from '@angular/core';
import { SHARED_IMPORTS } from '@shared';
import { NzMessageService } from 'ng-zorro-antd/message';
import { NzModalRef } from 'ng-zorro-antd/modal';

@Component({
  selector: 'app-basic-list-edit',
  templateUrl: './edit.component.html',
  imports: SHARED_IMPORTS
})
export class ProBasicListEditComponent {
  private readonly modal = inject(NzModalRef);
  private readonly msgSrv = inject(NzMessageService);

  record: { title?: string; createdAt?: string; owner?: string; subDescription?: string } = {};

  save(): void {
    this.msgSrv.success('保存成功');
    this.modal.close(this.record);
  }

  close(): void {
    this.modal.destroy();
  }
}
