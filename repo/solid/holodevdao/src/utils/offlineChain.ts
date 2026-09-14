/*
 * RepairBench adaptation - OFFLINE CHAIN TRANSPORT for the DevDAO NFT lookup.
 *
  *
 * the seed reads every token from Ethereum mainnet. useNftLookupDapp.ts built an ethers
 * FallbackProvider out of getDefaultProvider('mainnet', { infura }) plus
 * JsonRpcProvider(ALCHEMY_URL) - i.e. requests to Infura/Alchemy (and, through
 * src/utils/supportedBlockchains.ts, main-light.eth.linkpool.io / rinkeby-light.eth.linkpool.io) -
 * called nine contract methods per lookup and then did `await fetch(tokenURI)` against whatever
 * remote metadata URL the contract returned. task.toml sets [environment] allow_internet=false, and
 * the clone ships only .env.dist whose every VITE_* value is EMPTY (vite never loads .env.dist), so
 * VITE_INFURA_PROJECT_ID / VITE_ALCHEMY_URL / VITE_DEVELOPER_DAO_CONTRACT are all undefined at build
 * time: the tree could not resolve one token, online or offline.
 *
 * What this module changes: the TRANSPORT ONLY. Every name, call shape and return shape the
 * application already used is preserved - getOS / getTextEditor / getLanguage / getIndustry /
 * getLocation / getMind / getVibe / getClothing / tokenURI / ownerOf / balanceOf /
 * functions.tokenOfOwnerByIndex and provider.lookupAddress - so useNftLookupDapp.ts keeps its own
 * Promise.all fan-out, its own parseInt() coercions, its own try/catch -> onError() contract, its
 * own three-stage effect and its own module-level cachedTokensByAddress cache. No application
 * decision is taken over here: this module only answers reads.
 *
 * Zero network: the nine attribute reads and ownerOf/balanceOf/tokenOfOwnerByIndex resolve from the
 * table below; tokenURI resolves to a SAME-ORIGIN path under public/devdao/tokens/ so the
 * application's own `await fetch(uri)` + `.json()` still runs and the built dist answers its own
  *
 * at a same-origin fixture). Ids with no record REJECT, exactly like a contract revert, so the
 * application's own error branch stays reachable and stays the application's decision.
 *
 * The small fixed delays below stand in for RPC round-trips so the app's own loading state machine
 * (button label, disabled input, D_D spinner, tagline, flip) remains observable and deterministic.
 */

export const OFFLINE_CONTRACT_ADDRESS = '0x25ed58c027921E14D86380eA2646E3a1B5C55A8b'
export const OFFLINE_MAX_TOKEN_ID = 8000

const LATENCY = { read: 200, owner: 600, owned: 140, ens: 40 }

type TokenRecord = {
  id: number
  os: string
  text_editor: string
  language: string
  industry: string
  location: string
  mind: string
  vibe: string
  clothing: string
  owner: string | null
}

const TOKENS: TokenRecord[] = [
  {
    id: 1,
    os: 'Linux',
    text_editor: 'Neovim',
    language: 'Rust',
    industry: 'Cartography',
    location: 'Lisbon',
    mind: 'Systems',
    vibe: 'Nocturnal',
    clothing: 'Hoodie',
    owner: '0x71C7656EC7ab88b098defB751B7401B5f6d8976F',
  },
  {
    id: 2,
    os: 'MacOS',
    text_editor: 'VSCode',
    language: 'TypeScript',
    industry: 'Logistics',
    location: 'Osaka',
    mind: 'Analytical',
    vibe: 'Caffeinated',
    clothing: 'Flannel',
    owner: '0x2Ed4C6a8B0f1D3e5A7c9B2f4E6a8C0d1B3e5F7a9',
  },
  {
    id: 3,
    os: 'Windows',
    text_editor: 'Notepad++',
    language: 'Python',
    industry: 'Astronomy',
    location: 'Quito',
    mind: 'Creative',
    vibe: 'Mellow',
    clothing: 'Parka',
    owner: '0x71C7656EC7ab88b098defB751B7401B5f6d8976F',
  },
  {
    id: 4,
    os: 'Linux',
    text_editor: 'Emacs',
    language: 'Elixir',
    industry: 'Robotics',
    location: 'Tallinn',
    mind: 'Strategic',
    vibe: 'Focused',
    clothing: 'Blazer',
    owner: '0x4Ba2f3Ae90c2d1c3E70b1d6Fb2C6c9F0a5d3E1c8',
  },
  {
    id: 5,
    os: 'FreeBSD',
    text_editor: 'Helix',
    language: 'Go',
    industry: 'Genomics',
    location: 'Perth',
    mind: 'Empirical',
    vibe: 'Steady',
    clothing: 'T-Shirt',
    owner: '0x4Ba2f3Ae90c2d1c3E70b1d6Fb2C6c9F0a5d3E1c8',
  },
  {
    id: 6,
    os: 'MacOS',
    text_editor: 'Zed',
    language: 'Solidity',
    industry: 'Numismatics',
    location: 'Reykjavik',
    mind: 'Adversarial',
    vibe: 'Electric',
    clothing: 'Kimono',
    owner: '0x4Ba2f3Ae90c2d1c3E70b1d6Fb2C6c9F0a5d3E1c8',
  },
  {
    id: 7,
    os: 'Linux',
    text_editor: 'Sublime Text',
    language: 'Kotlin',
    industry: 'Mycology',
    location: 'Hanoi',
    mind: 'Taxonomic',
    vibe: 'Quiet',
    clothing: 'Anorak',
    owner: '0x4Ba2f3Ae90c2d1c3E70b1d6Fb2C6c9F0a5d3E1c8',
  },
  {
    id: 8,
    os: 'Windows',
    text_editor: 'IntelliJ IDEA',
    language: 'Java',
    industry: 'Seismology',
    location: 'Bergen',
    mind: 'Methodical',
    vibe: 'Grounded',
    clothing: 'Dungarees',
    owner: '0x2Ed4C6a8B0f1D3e5A7c9B2f4E6a8C0d1B3e5F7a9',
  },
  {
    id: 9,
    os: 'Linux',
    text_editor: 'Vim',
    language: 'Haskell',
    industry: 'Cryptography',
    location: 'Montevideo',
    mind: 'Formal',
    vibe: 'Icy',
    clothing: 'Trench',
    owner: '0x9Fb6Ae3c1D0e5b7A8C2f4E6d9B0a1C3e5F7d9B21',
  },
  {
    id: 10,
    os: 'NixOS',
    text_editor: 'Emacs',
    language: 'OCaml',
    industry: 'Archaeology',
    location: 'Delphi',
    mind: 'Patient',
    vibe: 'Dusty',
    clothing: 'Linen',
    owner: null,
  },
  {
    id: 11,
    os: 'MacOS',
    text_editor: 'Fleet',
    language: 'Swift',
    industry: 'Marine biology',
    location: 'Kochi',
    mind: 'Curious',
    vibe: 'Sunny',
    clothing: 'Aloha',
    owner: '0xC0ffee0123456789abcdef0123456789AbCdEf01',
  },
  {
    id: 12,
    os: 'Linux',
    text_editor: 'Nano',
    language: 'C',
    industry: 'Telephony',
    location: 'Tromso',
    mind: 'Frugal',
    vibe: 'Brisk',
    clothing: 'Wool',
    owner: '0x2Ed4C6a8B0f1D3e5A7c9B2f4E6a8C0d1B3e5F7a9',
  },
  {
    id: 42,
    os: 'Plan 9',
    text_editor: 'Acme',
    language: 'Limbo',
    industry: 'Interplanetary',
    location: 'Europa',
    mind: 'Speculative',
    vibe: 'Weightless',
    clothing: 'Pressure suit',
    owner: '0x71C7656EC7ab88b098defB751B7401B5f6d8976F',
  },
  {
    id: 1337,
    os: 'Linux',
    text_editor: 'Vim',
    language: 'Assembly',
    industry: 'Retrocomputing',
    location: 'Berlin',
    mind: 'Bitwise',
    vibe: 'Leet',
    clothing: 'Denim',
    owner: '0x71C7656EC7ab88b098defB751B7401B5f6d8976F',
  },
]

const BY_ID: { [key: number]: TokenRecord } = {}
for (const t of TOKENS) BY_ID[t.id] = t

// index order as the chain would return it (deliberately NOT ascending: the application sorts it)
const OWNER_INDEX: { [key: string]: number[] } = {
  '0x71c7656ec7ab88b098defb751b7401b5f6d8976f': [1337, 42, 1, 3],
  '0x4ba2f3ae90c2d1c3e70b1d6fb2c6c9f0a5d3e1c8': [7, 4, 6, 5],
  '0x9fb6ae3c1d0e5b7a8c2f4e6d9b0a1c3e5f7d9b21': [9],
  '0x2ed4c6a8b0f1d3e5a7c9b2f4e6a8c0d1b3e5f7a9': [12, 2, 8],
  '0xc0ffee0123456789abcdef0123456789abcdef01': [11],
}

const ENS_BY_ADDRESS: { [key: string]: string } = {
  '0x9fb6ae3c1d0e5b7a8c2f4e6d9b0a1c3e5f7d9b21': 'naomi.eth',
}

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))
const norm = (address: any) => String(address == null ? '' : address).toLowerCase()

function record(id: any, method: string): TokenRecord {
  const key = Number(id)
  const hit = BY_ID[key]
  if (!hit) throw new Error(`offline chain: ${method} reverted for token ${id} (no such Dev)`)
  return hit
}

// The application hands this either a hex address or an ENS name: fetchNFTOwner returns the ENS
// name when the chain resolved one, and stage 3 then queries the holder's other tokens with that
// same string. A real node resolves ENS before balanceOf/tokenOfOwnerByIndex, so the fixture does too.
function holderKey(address: any): string {
  const key = norm(address)
  if (OWNER_INDEX[key]) return key
  for (const ens of Object.keys(ENS_BY_ADDRESS)) if (ENS_BY_ADDRESS[ens] === key) return ens
  return key
}

function ownedBy(address: any, method: string): number[] {
  const list = OWNER_INDEX[holderKey(address)]
  if (!list) throw new Error(`offline chain: ${method} reverted for holder ${address} (no such holder)`)
  return list
}

// Stand-in for ethers' JsonRpcProvider surface that the application actually touches.
export function getOfflineProvider() {
  return {
    async lookupAddress(address: string): Promise<string | null> {
      await sleep(LATENCY.ens)
      const hit = ENS_BY_ADDRESS[norm(address)]
      return hit === undefined ? null : hit
    },
  }
}

// Stand-in for `new Contract(DEVELOPER_DAO_CONTRACT, DEVELOPER_DAO_CONTRACT_ABI, provider)`.
export function getOfflineContract() {
  const read = async (id: any, field: keyof TokenRecord, method: string) => {
    await sleep(LATENCY.read)
    return record(id, method)[field] as any
  }
  return {
    getOS: (id: any) => read(id, 'os', 'getOS'),
    getTextEditor: (id: any) => read(id, 'text_editor', 'getTextEditor'),
    getLanguage: (id: any) => read(id, 'language', 'getLanguage'),
    getIndustry: (id: any) => read(id, 'industry', 'getIndustry'),
    getLocation: (id: any) => read(id, 'location', 'getLocation'),
    getMind: (id: any) => read(id, 'mind', 'getMind'),
    getVibe: (id: any) => read(id, 'vibe', 'getVibe'),
    getClothing: (id: any) => read(id, 'clothing', 'getClothing'),
    async tokenURI(id: any) {
      await sleep(LATENCY.read)
      return `/devdao/tokens/${record(id, 'tokenURI').id}.json`
    },
    async ownerOf(id: any) {
      await sleep(LATENCY.owner)
      return record(id, 'ownerOf').owner
    },
    async balanceOf(address: any) {
      await sleep(LATENCY.owned)
      return ownedBy(address, 'balanceOf').length
    },
    functions: {
      async tokenOfOwnerByIndex(address: any, index: any) {
        await sleep(LATENCY.owned)
        const list = ownedBy(address, 'tokenOfOwnerByIndex')
        const i = Number(index)
        if (!(i >= 0) || i >= list.length) throw new Error(`offline chain: tokenOfOwnerByIndex(${address}, ${index}) reverted`)
        return list[i]
      },
    },
  }
}
