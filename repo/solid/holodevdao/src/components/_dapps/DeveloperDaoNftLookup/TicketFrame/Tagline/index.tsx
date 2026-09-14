import { TaglinePosition } from './types'
import type { ITaglineProps } from './types'

const Tagline = (props: ITaglineProps) => {
  /* RepairBench instrumentation: the position is static per instance, so deriving the probe
   * name once here does not change what is rendered. */
  const rbPos = props.position === TaglinePosition.Top ? 'top' : 'bottom'
  return (
    <>
      <div
        data-testid={`rb-tagline-${rbPos}`}
        aria-hidden="true"
        classList={{
          'pt-1.5': props.position === TaglinePosition.Top,
          'pb-1.5 mt-auto': props.position === TaglinePosition.Bottom,
        }}
        class="py-1.5 flex whitespace-nowrap overflow-hidden text-hs tracking-sm font-mono text-neutral-900 text-opacity-50 uppercase justify-between"
      >
        <span class="whitespace-nowrap transform -translate-x-1/4">{props.text}</span>
        <span data-testid={`rb-tagline-${rbPos}-text`}>{props.text}</span>
        <span class="whitespace-nowrap transform translate-x-1/4">{props.text}</span>
      </div>
    </>
  )
}

export default Tagline
