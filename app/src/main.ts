import './style.css'
import { VoidBlasterApp } from './game/VoidBlasterApp'

const root = document.querySelector<HTMLDivElement>('#app')

if (!root) {
  throw new Error('Missing #app root')
}

const app = new VoidBlasterApp(root)
app.start()
