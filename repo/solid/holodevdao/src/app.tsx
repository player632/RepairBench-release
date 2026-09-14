import type { Component } from 'solid-js'
import { useRoutes } from 'solid-app-router'
import { Web3Provider } from '@contexts/Web3'
import { routes } from './routes'

const footerLinksStyles =
  'text-neutral-900 underline hover:no-underline focus:text-yellow-500 focus:no-underline focus:outline-none'
const App: Component = () => {
  const Route = useRoutes(routes)

  return (
    <Web3Provider>
      <main data-testid="rb-main" class="flex-grow flex flex-col py-8">
        <Route />
      </main>
      <footer data-testid="rb-footer" class="text-center p-3 mt-auto text-yellow-800 w-full justify-center items-center flex flex-col space-y-3 font-mono text-ss">
        <span>
          Crafted by{' '}
          <a data-testid="rb-footer-naomi" class={footerLinksStyles} href="https://twitter.com/naomihauret" target="_blank" rel="nofollow noreferrer">
            Naomi Hauret
          </a>{' '}
          with{' '}
          <a data-testid="rb-footer-solidjs" class={footerLinksStyles} href="https://solidjs.com/" target="_blank" rel="nofollow noreferrer">
            SolidJS
          </a>
        </span>
        <span>
          Hosted with{' '}
          <a data-testid="rb-footer-fleek" class={footerLinksStyles} href="https://fleek.co/" target="_blank" rel="nofollow noreferrer">
            Fleek.co ⚡
          </a>
        </span>
        <div>
          <a
            data-testid="rb-footer-github"
            class={`${footerLinksStyles} col-span-2 sm:col-span-1`}
            href="https://github.com/naomihauret/holodevdao"
            target="_blank"
            rel="nofollow noreferrer"
          >
            Github 🐙 repository
          </a>
        </div>
      </footer>
    </Web3Provider>
  )
}

export default App
