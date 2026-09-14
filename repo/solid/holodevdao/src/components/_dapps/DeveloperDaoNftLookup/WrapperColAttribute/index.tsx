import type { IWrapperColAttributeProps } from './types'

const WrapperColAttribute = (props: IWrapperColAttributeProps) => {
  /* RepairBench instrumentation: the probe name is derived from the label, which is a static
   * literal at every one of the nine call sites, so this changes nothing that is rendered. */
  const rbSlug = String(props.label || '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
  return (
    <div data-testid={`rb-attr-${rbSlug}`} class="flex text-start flex-col w-full justify-baseline p-3 overflow-hidden">
      <span data-testid={`rb-attr-${rbSlug}-label`} class="text-hs text-neutral-900 text-opacity-50">{props.label}</span>
      <span data-testid={`rb-attr-${rbSlug}-value`} class={`text-sm overflow-hidden overflow-ellipsis ${props.valueStyles || ''}`}>{props.value}</span>
    </div>
  )
}

export default WrapperColAttribute
