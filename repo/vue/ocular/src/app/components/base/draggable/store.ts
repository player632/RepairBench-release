import { reactive } from 'vue';
import type { DropOrder } from './Draggable.types';

export interface DraggableStore {
  group?: string;
  source?: string;
  target?: string;
  targets?: string[];
  type?: DropOrder;
}

export const store = reactive<DraggableStore>({
  group: undefined,
  source: undefined,
  target: undefined,
  targets: undefined,
  type: undefined
});
