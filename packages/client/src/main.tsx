import React from 'react'
import ReactDOM from 'react-dom/client'
import './public/reset.css'
import './public/util.css'
import './public/root.css'
import './public/buttons.css'
import App from './App'

ReactDOM.createRoot(document.getElementById('root') as HTMLElement).render(
    <React.StrictMode>
        <App />
    </React.StrictMode>
)
