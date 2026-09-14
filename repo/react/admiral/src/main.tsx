import { createRoot } from 'react-dom/client'
import { worker } from './mocks/browser'
import App from './App'
import { publishRbProbe } from './rbProbe'

async function prepare() {
    return worker.start()
}

prepare().then(() => {
    createRoot(document.getElementById('root')!).render(<App />)
    // RepairBench instrumentation: publish the read-only probe object once.
    publishRbProbe()
})
