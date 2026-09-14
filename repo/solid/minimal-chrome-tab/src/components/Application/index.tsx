import { Loading } from 'solid-js'
// INSTRUMENTATION (repair-bench): publish the app's own settings accessor read-only.
import { bindApp } from '@/rb-probe'
import type { JSX } from '@solidjs/web'
import Footer from '@/components/Footer'
import Layout from '@/components/Layout'
import Time from '@/components/Time'
import TimeMilestones from '@/components/TimeMilestones'
import useSettings from '@/hooks/useSettings'
import createApplyTheme from './hooks/createApplyTheme'
import createMountEffect from './hooks/createMountEffect'
import createSettingsDialog from './hooks/createSettingsDialog'

export default function Application(): JSX.Element {
  // INSTRUMENTATION (repair-bench): hand the verifier the SAME settings accessor the tree
  // reads (the detached app-singleton), so a checkpoint can observe the in-memory settings
  // the app is actually rendering from instead of inferring them from a painted attribute.
  // useSettings() only creates/returns the singleton - it does not read it - so this adds
  // no suspension boundary and no render-order change; the bridge reads it lazily, outside
  // the reactive graph, and yields null while the async load is still in flight.
  const [settings] = useSettings()
  bindApp({ settings })

  createMountEffect()
  createApplyTheme()

  const settingsDialog = createSettingsDialog()

  return (
    <>
      <Layout>
        <Loading>
          <TimeMilestones />
        </Loading>
        <Time />
        <Footer onSettingsRequest={settingsDialog.open} />
      </Layout>
      {settingsDialog.$el}
    </>
  )
}
