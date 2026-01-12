/**
 * Header Component
 * App header with logo, title, and AI toggle
 */

import { createElement } from '../utils/helpers.js';


/**
 * Creates the header component
 * @param {Object} options - Header options
 * @param {boolean} options.aiEnabled - Whether AI summaries are enabled
 * @param {Function} options.onAIToggle - Callback when AI toggle is clicked
 * @returns {HTMLElement} Header element
 */
export function Header() {
  const html = `
    <header class="app-header">
      <div class="header-content">
        <div class="header-brand">
          <div class="header-logo-type">
            <span class="logo-highlight">Hots</span>Trends
          </div>
        </div>
        <div class="header-actions">
          
        </div>
      </div>
    </header>
  `;

  const element = createElement(html);

  return element;
}
