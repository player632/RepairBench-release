import type { ISerialNumberProps } from './types'

const SerialNumber = (props: ISerialNumberProps) => {
  return (
    <div data-testid="rb-serial" class="tracking-lg font-800 pt-6 text-base text-end pie-3">
      <span data-testid="rb-serial-id" class="text-neutral-900">{props.id}</span>
      <span data-testid="rb-serial-sep" class="mx-1 text-neutral-900 text-opacity-20">/</span>
      <span data-testid="rb-serial-max" class="text-stroke-neutral-900 text-stroke-ss text-transparent">{props.id}</span>
    </div>
  )
}

export default SerialNumber
