/**
 * Loader Component
 * Loading spinner and skeleton states
 */

import { createElement } from '../utils/helpers.js';

/**
 * Creates a loading spinner
 * @param {string} message - Loading message
 * @returns {HTMLElement} Loader element
 */
export function Loader(message = 'Loading stories...') {
    const html = `
    <div class="loader-container">
      <div class="loader-spinner"></div>
      <p class="loader-text">${message}</p>
    </div>
  `;

    return createElement(html);
}

/**
 * Creates skeleton loading cards
 * @param {number} count - Number of skeleton cards
 * @returns {HTMLElement} Skeleton container
 */
export function SkeletonLoader(count = 5) {
    const container = createElement('<div class="news-list"></div>');

    for (let i = 0; i < count; i++) {
        const skeleton = createElement('<div class="skeleton skeleton-card"></div>');
        container.appendChild(skeleton);
    }

    return container;
}

/**
 * Creates an error state display
 * @param {string} title - Error title
 * @param {string} message - Error message
 * @param {Function} onRetry - Retry callback
 * @returns {HTMLElement} Error container
 */
export function ErrorState(title = 'Something went wrong', message = '', onRetry = null) {
    const html = `
    <div class="error-container">
      <svg class="error-icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <circle cx="12" cy="12" r="10"/>
        <line x1="12" y1="8" x2="12" y2="12"/>
        <line x1="12" y1="16" x2="12.01" y2="16"/>
      </svg>
      <h3 class="error-title">${title}</h3>
      ${message ? `<p class="error-message">${message}</p>` : ''}
      ${onRetry ? '<button class="btn btn-primary" id="btn-retry">Try Again</button>' : ''}
    </div>
  `;

    const element = createElement(html);

    if (onRetry) {
        element.querySelector('#btn-retry').addEventListener('click', onRetry);
    }

    return element;
}

/**
 * Creates an empty state display
 * @param {string} title - Empty state title
 * @param {string} message - Empty state message
 * @returns {HTMLElement} Empty container
 */
export function EmptyState(title = 'No stories found', message = 'Try adjusting your filters') {
    const html = `
    <div class="empty-container">
      <svg class="empty-icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
        <polyline points="14 2 14 8 20 8"/>
        <line x1="16" y1="13" x2="8" y2="13"/>
        <line x1="16" y1="17" x2="8" y2="17"/>
        <polyline points="10 9 9 9 8 9"/>
      </svg>
      <h3 class="empty-title">${title}</h3>
      <p class="empty-message">${message}</p>
    </div>
  `;

    return createElement(html);
}
