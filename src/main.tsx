import { createRoot } from 'react-dom/client'
import { App } from './App'
import { refreshSigns } from './world/textures'
import './styles.css'

createRoot(document.getElementById('root')!).render(<App />)

// 3D signs are painted on canvases, so repaint them once the web fonts are in.
Promise.all([
  document.fonts.load('800 40px "Bricolage Grotesque"'),
  document.fonts.load('700 40px "Caveat"'),
]).then(refreshSigns, () => {})

console.log(
  '%c☕ hey, you opened the console.',
  'font-size:16px;font-weight:700',
  "\nthat's the kind of curiosity I like working with.\naryanyadav.devop@gmail.com\n\n(psst: type chai on the page.)",
)
