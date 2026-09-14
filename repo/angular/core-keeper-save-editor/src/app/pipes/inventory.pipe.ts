import { Pipe, PipeTransform } from '@angular/core';

import { Bag } from '~enums';
import { InventorySlot } from '~models';
import { CharacterService } from '~services';

@Pipe({
  name: 'inventory'
})
export class InventoryPipe implements PipeTransform {
  private lastInventory: InventorySlot[] | null = null;
  private lastResult: InventorySlot[] = [];

  constructor(private characterService: CharacterService) {}

  transform(inventory: InventorySlot[], bag: Bag): InventorySlot[] {
    // The component hands over a fresh array whenever another character is
    // loaded, so the reference alone tells us whether the slice must be rebuilt.
    if (this.lastInventory === inventory) {
      return this.lastResult;
    }
    // Get the bagSize and show the inventory based on the bag size.
    const bagSize = this.characterService.getBagSize(bag);
    // The inventory variable does not include the toolbar (the first 10 items)
    // So we need to take the base size (30) and extract the toolbar
    // After that we add the bagSize and have our inventory size
    const result = inventory.slice(0, 30 - 10 + bagSize);
    this.lastInventory = inventory;
    this.lastResult = result;
    return result;
  }
}
