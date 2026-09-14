import type { IBarcodeIdProps } from './types'

const BarcodeId = (props: IBarcodeIdProps) => {
  return (
    <div data-testid="rb-barcode" class="tracking-lg text-center pt-0.5 mt-auto">
      <div data-testid="rb-barcode-dev" class="leading-none text-ml -mb-5 font-barcode whitespace-nowrap">Dev {props.id}</div>
      <div class="uppercase text-md tracking-lg">
        <span data-testid="rb-barcode-hash" class="font-700 text-stroke-neutral-900 text-stroke-ss text-transparent mie-1">#</span>
        <span data-testid="rb-barcode-id" class="font-900 text-neutral-900">{props.id}</span>
      </div>
    </div>
  )
}

export default BarcodeId
