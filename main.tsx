import React from 'react';
import { createRoot } from 'react-dom/client';
import { FileRouter } from './shim';
import { App } from './App';
import './style.css';
import './polish.css';
import './native.css';
import './ui2.css';
import './live.css';
import './ui3.css';
import './ui4.css';
import './ui5.css';
import { Ticker } from './ticker';
import { AppBar } from './appbar';

createRoot(document.getElementById('root')!).render(<FileRouter><App /><Ticker /><AppBar /></FileRouter>);
