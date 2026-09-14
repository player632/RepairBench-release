import { createSignal } from 'solid-js'
import { useSearchParams } from 'solid-app-router'
import DeveloperDaoNftLookup from '@components/_dapps/DeveloperDaoNftLookup'
import useNftLookupDapp from '@components/_dapps/DeveloperDaoNftLookup/useNftLookupDapp'
import Input from '@components/Input'
import { ButtonCta } from '@components/Button'
import { ListScale, ListVariant } from '@components/Input/types'
import { publishArea } from '../../rb-probe'
import styles from './index.module.css'

export default function Home() {
  const [nftStore, setNftStore] = useNftLookupDapp()
  const devId = nftStore.lookupId
  const [searchParams, setSearchParams] = useSearchParams()
  /* @ts-expect-error */
  const [lookupValue, setLookupValue] = createSignal('')

  /* RepairBench instrumentation: publish the store scalars, including ownerNFTList which
   * the UI never renders. Live getters, read-only, fail-closed - see src/rb-probe.ts. */
  publishArea('dapp', {
    lookupId: () => nftStore.lookupId,
    nftLoading: () => nftStore.nftData.loading,
    nftError: () => nftStore.nftData.error,
    nftValueOs: () => (nftStore.nftData.value ? nftStore.nftData.value.os : null),
    ownerLoading: () => nftStore.owner.loading,
    ownerError: () => nftStore.owner.error,
    ownerAddress: () => nftStore.owner.address,
    listLoading: () => nftStore.ownerNFTList.loading,
    listError: () => nftStore.ownerNFTList.error,
    ownerListLen: () => (nftStore.ownerNFTList.list ? nftStore.ownerNFTList.list.length : null),
    ownerListJoin: () => (nftStore.ownerNFTList.list ? nftStore.ownerNFTList.list.join(',') : null),
  })

  let pendingLookupId: any = nftStore.lookupId

  function handleSubmit(e: Event) {
    e.preventDefault()
    pendingLookupId = lookupValue()
    setSearchParams({ id: pendingLookupId })
  }

  function handleFieldLookupIdChange(e: any) {
    setLookupValue(e.currentTarget.value)
  }

  return (
    <div class="flex-grow flex flex-col items-center">
      <h1 class="pb-6" data-testid="rb-title">
        <div class="flex flex-col items-center leading-none">
          <span data-testid="rb-title-holographic" class={`tracking-md font-mono text-ss pb-1.5 ${styles.labelHolographic}`}>(holographic)</span>
          <span
            data-testid="rb-title-developer"
            class={`${styles.labelDeveloper} uppercase text-sl font-900 italic text-stroke-neutral-900 text-stroke-ss text-transparent`}
          >
            Developer
          </span>{' '}
          <span data-testid="rb-title-dao" class={`${styles.labelDao} uppercase text-sl font-900 italic text-neutral-900`}>DAO</span>
        </div>
      </h1>
      <p data-testid="rb-intro-community" class="px-2 font-mono text-sm text-center max-w-prose">
        A community of developers, designers, writers, students, mentors... learning and working together to build the web of tomorrow.
      </p>
      <p data-testid="rb-intro-hint" class="px-2 max-w-prose mt-6 mb-2 text-center font-600">
        Checkout any Dev NFT by entering its ID (a number) below.
      </p>
      <div class="flex flex-col items-center pb-5 px-2 mx-auto w-full">
        <form
          data-testid="rb-lookup-form"
          onSubmit={handleSubmit}
          classList={{
            /* @ts-expect-error */
            'border-opacity-10': nftStore.nftData.loading === true || nftStore.owner.loading === true,
          }}
          class="shadow-yellow-800 relative border-solid border-ss border-neutral-900 rounded-sm mb-6 flex"
        >
          <label class="focus-within:z-10 ss:flex-shrink-0 flex-grow" for="lookup_nft_id">
            <span class="sr-only">Lookup NFT ID</span>
            <Input
              data-testid="rb-lookup-input"
              css="border-md border-opacity-10 border-ie-transparent rounded-ie-none w-full"
              id="lookup_nft_id"
              name="lookup_nft_id"
              value={lookupValue()}
              type="number"
              min="0"
              max="8000"
              step="1"
              scale={ListScale.sm}
              onChange={handleFieldLookupIdChange}
              /* @ts-expect-error */
              disabled={nftStore.nftData.loading === true ? true : false}
            />
          </label>
          <ButtonCta
            data-testid="rb-lookup-submit"
            /* @ts-expect-error */
            isLoading={nftStore.nftData.loading === true || nftStore.owner.loading === true ? true : false}
            /* @ts-expect-error */
            scale={ListScale.sm}
            /* @ts-expect-error */
            variant={ListVariant['primary-solid']}
            css="focus-within:z-10 rounded-is-none flex-shrink-0 w-content"
            type="submit"
          >
            {/* @ts-expect-error */}
            {nftStore.nftData.loading === true || nftStore.owner.loading === true ? 'Looking up...' : 'Lookup'}

            <span
              class="pis-2"
              classList={{
                'animate-flipendo motion-reduced:animate-none':
                  /* @ts-expect-error */
                  nftStore.nftData.loading === true || nftStore.owner.loading === true,
              }}
              aria-hidden="true"
            >
              👀
            </span>
          </ButtonCta>
        </form>
      </div>
      {/* @ts-expect-error */}
      <DeveloperDaoNftLookup nft={nftStore.nftData} owner={nftStore.owner} devId={devId} />
    </div>
  )
}
