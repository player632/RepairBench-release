/* @refresh reload */
import { render } from 'solid-js/web'
import './index.css'
import App from './App.tsx'
import { installRbProbe } from './rb/probe'

const root = document.getElementById('root')

// rb probe: 只读测量面，在 render 之前安装（instrumentation 面；window.__RB__）
installRbProbe()

render(() => <App />, root!)
