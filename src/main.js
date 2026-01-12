/**
 * Application Entry Point
 * Initializes the HotsTrends app
 */

import './styles/index.css';
import { initApp } from './app/App.js';

// Wait for DOM to be ready
document.addEventListener('DOMContentLoaded', () => {
    const appContainer = document.getElementById('app');

    if (!appContainer) {
        console.error('App container not found');
        return;
    }

    // Initialize the app
    initApp(appContainer);
});
