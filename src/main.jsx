import './storage-shim.js'; // MUST be first — sets up window.storage before the app runs
import React from 'react';
import ReactDOM from 'react-dom/client';
import Forge from './AdventurersForge.jsx';

ReactDOM.createRoot(document.getElementById('root')).render(<Forge />);
