/**
 * FilterBar Component
 * Dropdown filters for source type, category, language, and country
 * Plus search input and time filter
 */

import { createElement } from '../utils/helpers.js';

import { isConfigured as isNewsApiConfigured } from '../services/newsApiService.js';

/**
 * Creates the filter bar component
 * @param {Object} options - Filter options
 * @param {Object} options.currentFilters - Current filter values
 * @param {Function} options.onFilterChange - Callback when filter changes
 * @param {Function} options.onRefresh - Callback when refresh button clicked
 * @param {Function} options.onSearch - Callback when search is submitted
 * @returns {HTMLElement} FilterBar element
 */
export function FilterBar({ currentFilters, onFilterChange, onRefresh, onSearch }) {
  const { storyType, category, language, country, searchQuery = '', timeFilter = 'all' } = currentFilters;
  const newsApiAvailable = isNewsApiConfigured();

  const html = `
    <div class="filter-bar">
      <div class="filter-content">
        <div class="filter-group search-group">
          <label class="filter-label" for="filter-search">Search</label>
          <div class="search-input-wrapper">
            <svg class="search-icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <circle cx="11" cy="11" r="8"/>
              <path d="M21 21l-4.35-4.35"/>
            </svg>
            <input 
              type="text" 
              class="filter-input" 
              id="filter-search" 
              placeholder="Search topics..." 
              value="${searchQuery}"
              data-filter="searchQuery"
            />
          </div>
        </div>

        <div class="filter-group">
          <label class="filter-label" for="filter-source">Source</label>
          <select class="filter-select" id="filter-source" data-filter="storyType">
            <optgroup label="Hacker News">
              <option value="top" ${storyType === 'top' ? 'selected' : ''}>Top Stories</option>
              <option value="best" ${storyType === 'best' ? 'selected' : ''}>Best Stories</option>
              <option value="new" ${storyType === 'new' ? 'selected' : ''}>New Stories</option>
              <option value="ask" ${storyType === 'ask' ? 'selected' : ''}>Ask HN</option>
              <option value="show" ${storyType === 'show' ? 'selected' : ''}>Show HN</option>
            </optgroup>
            ${newsApiAvailable ? `
            <optgroup label="NewsAPI">
              <option value="newsapi" ${storyType === 'newsapi' ? 'selected' : ''}>Top Headlines</option>
            </optgroup>
            ` : ''}
          </select>
        </div>

        <div class="filter-group">
          <label class="filter-label" for="filter-time">Time</label>
          <select class="filter-select" id="filter-time" data-filter="timeFilter">
            <option value="all" ${timeFilter === 'all' ? 'selected' : ''}>All Time</option>
            <option value="1h" ${timeFilter === '1h' ? 'selected' : ''}>Past Hour</option>
            <option value="24h" ${timeFilter === '24h' ? 'selected' : ''}>Past 24 Hours</option>
            <option value="7d" ${timeFilter === '7d' ? 'selected' : ''}>Past Week</option>
          </select>
        </div>

        <div class="filter-group" ${storyType !== 'newsapi' ? 'style="opacity: 0.5; pointer-events: none;"' : ''}>
          <label class="filter-label" for="filter-category">Category</label>
          <select class="filter-select" id="filter-category" data-filter="category" ${storyType !== 'newsapi' ? 'disabled' : ''}>
            <option value="technology" ${category === 'technology' ? 'selected' : ''}>Technology</option>
          </select>
        </div>

        <div class="filter-spacer"></div>

        <button class="btn-icon" id="btn-refresh" title="Refresh">
          <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M21 12a9 9 0 0 0-9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/>
            <path d="M3 3v5h5"/>
            <path d="M3 12a9 9 0 0 0 9 9 9.75 9.75 0 0 0 6.74-2.74L21 16"/>
            <path d="M16 16h5v5"/>
          </svg>
        </button>
      </div>
    </div>
  `;

  const element = createElement(html);

  // Add event listeners for filter changes
  element.querySelectorAll('.filter-select').forEach(select => {
    select.addEventListener('change', (e) => {
      const filterName = e.target.dataset.filter;
      const filterValue = e.target.value;
      onFilterChange(filterName, filterValue);
    });
  });

  // Add search input listener
  const searchInput = element.querySelector('#filter-search');
  if (searchInput && onSearch) {
    searchInput.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        onSearch(e.target.value);
      }
    });
  }

  // Add refresh button listener
  element.querySelector('#btn-refresh').addEventListener('click', onRefresh);

  return element;
}

/**
 * Updates filter bar state based on current source
 * @param {HTMLElement} filterBar - Filter bar element
 * @param {string} storyType - Current story type
 */
export function updateFilterState(filterBar, storyType) {
  const isNewsApi = storyType === 'newsapi';

  const categoryGroup = filterBar.querySelector('#filter-category')?.closest('.filter-group');

  if (categoryGroup) {
    categoryGroup.style.opacity = isNewsApi ? '1' : '0.5';
    categoryGroup.style.pointerEvents = isNewsApi ? 'auto' : 'none';
    categoryGroup.querySelector('select').disabled = !isNewsApi;
  }
}
