import { render } from 'preact'
import { registerSW } from 'virtual:pwa-register'
import './index.css'
import { App } from './app.tsx'

// An installed PWA can sit resumed-from-background for days and never notice a
// deploy — the service worker only checks for updates on a real page load. Check
// explicitly every hour and whenever the app returns to the foreground; the
// autoUpdate register reloads once the new worker takes control.
registerSW({
  immediate: true,
  onRegisteredSW(_url, registration) {
    if (!registration) return
    setInterval(() => void registration.update(), 60 * 60 * 1000)
    document.addEventListener('visibilitychange', () => {
      if (!document.hidden) void registration.update()
    })
  },
})

render(<App />, document.getElementById('app')!)
