/**
 * NewsList Component
 * Container for rendering list of news cards
 */

import { createElement } from '../utils/helpers.js';
import { NewsCard } from './NewsCard.js';

/**
 * Creates the news list container
 * @param {Object[]} stories - Array of story objects
 * @param {Object} options - Display options
 * @param {boolean} options.showSummaries - Whether to show AI summaries
 * @returns {HTMLElement} NewsList element
 */
export function NewsList(stories, options = {}) {
  const { showSummaries = false, onExtendSummary = null } = options;
  const container = createElement('<div class="news-list"></div>');

  stories.forEach(story => {
    const card = NewsCard(story, {
      showSummary: showSummaries,
      onExtendSummary: onExtendSummary
    });
    container.appendChild(card);
  });

  return container;
}

/**
 * Creates the stats bar showing result count and source
 * @param {Object} options - Stats options
 * @param {number} options.count - Number of stories
 * @param {string} options.source - Current source name
 * @param {Date} options.lastUpdated - Last update time
 * @param {boolean} options.aiEnabled - Whether AI is enabled
 * @param {boolean} options.aiLoading - Whether AI summaries are loading
 * @param {string} options.sortBy - Current sort method ('rank' or 'velocity')
 * @param {Function} options.onSortChange - Callback when sort changes
 * @returns {HTMLElement} Stats bar element
 */
export function StatsBar({ count, source, lastUpdated, aiEnabled = false, aiLoading = false, sortBy = 'rank', onSortChange = null }) {
  const html = `
    <div class="stats-bar">
      <div class="stats-info">
        <span class="stats-count">
          Showing <strong>${count}</strong> ${count === 1 ? 'story' : 'stories'}
        </span>
        <span class="stats-source">
          <span class="stats-source-dot"></span>
          ${source}
        </span>
        ${aiEnabled ? `
          <span class="stats-ai ${aiLoading ? 'loading' : ''}">
            <svg class="ai-indicator-icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <circle cx="12" cy="12" r="3"/>
              <path d="M12 2v4"/>
              <path d="M12 18v4"/>
              <path d="M4.93 4.93l2.83 2.83"/>
              <path d="M16.24 16.24l2.83 2.83"/>
              <path d="M2 12h4"/>
              <path d="M18 12h4"/>
            </svg>
            ${aiLoading ? 'Generating summaries...' : 'AI Summaries'}
          </span>
        ` : ''}
      </div>
      ${onSortChange ? `
      <div class="stats-sort">
        <span class="sort-label">Sort by:</span>
        <button class="sort-btn ${sortBy === 'rank' ? 'active' : ''}" data-sort="rank">
          HN Rank
        </button>
        <button class="sort-btn ${sortBy === 'velocity' ? 'active' : ''}" data-sort="velocity">
          Velocity
        </button>
      </div>
      ` : ''}
    </div>
  `;

  const element = createElement(html);

  // Add sort button listeners
  if (onSortChange) {
    element.querySelectorAll('.sort-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        onSortChange(btn.dataset.sort);
      });
    });
  }

  return element;
}
