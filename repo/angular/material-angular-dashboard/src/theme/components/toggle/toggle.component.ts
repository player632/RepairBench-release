import { Component, HostBinding, Input } from '@angular/core';

@Component({
  template: '',
})
export abstract class ToggleComponent {
  private static idCounter = 0;

  public isChecked = false;

  @HostBinding('for') @Input() public innerID = `base-toggle-${ToggleComponent.nextId()}`;

  private static nextId(): number {
    const current = ToggleComponent.idCounter;
    return current;
  }

  @Input() protected color;

  @Input() set checked(value) {
    if (value || value === '') {
      this.isChecked = true;
    }
  }
}
