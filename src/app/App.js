/**
 * App Controller
 * Main application logic and state management
 */

import { Header } from '../components/Header.js';
import { FilterBar, updateFilterState } from '../components/FilterBar.js';
import { NewsList, StatsBar } from '../components/NewsList.js';
import { Loader, SkeletonLoader, ErrorState, EmptyState } from '../components/Loader.js';
import { TrendingTopics, updateTrendingTopics } from '../components/TrendingTopics.js';
import {
    fetchStories
} from '../services/hackerNewsService.js';
import {
    fetchTopHeadlines,
    isConfigured as isNewsApiConfigured
} from '../services/newsApiService.js';
import {
    summarizeStories,
    summarizeStory,
    isConfigured as isOpenAIConfigured
} from '../services/openaiService.js';
import { createElement } from '../utils/helpers.js';

/**
 * Application state
 */
const state = {
    stories: [],
    isLoading: false,
    error: null,
    filters: {
        storyType: 'newsapi',
        category: 'technology',
        language: 'en',
        country: 'us',
        searchQuery: '',
        timeFilter: 'all'
    },
    lastUpdated: null,
    // AI state
    aiEnabled: true,
    aiLoading: false,
    aiSummaries: new Map(),
    // Sort state
    sortBy: 'rank', // 'rank' or 'velocity'
    // Pagination
    displayCount: 10
};

/**
 * DOM element references
 */
let appContainer = null;
let contentContainer = null;
let trendingSidebar = null;
let filterBarElement = null;
let headerElement = null;

/**
 * Initializes the application
 * @param {HTMLElement} container - Root container element
 */
export function initApp(container) {
    appContainer = container;
    renderApp();
    loadStories();
}

/**
 * Renders the full application structure
 */
function renderApp() {
    appContainer.innerHTML = '';

    // Header with AI toggle
    headerElement = Header({
        aiEnabled: state.aiEnabled,
        onAIToggle: handleAIToggle
    });
    appContainer.appendChild(headerElement);

    // Filter bar
    filterBarElement = FilterBar({
        currentFilters: state.filters,
        onFilterChange: handleFilterChange,
        onRefresh: handleRefresh,
        onSearch: handleSearch
    });
    appContainer.appendChild(filterBarElement);

    // Main layout with sidebar
    const mainLayout = createElement('<div class="main-layout"></div>');

    // Main content area
    const main = createElement('<main class="main-content"></main>');
    contentContainer = main;
    mainLayout.appendChild(main);

    // Trending sidebar
    trendingSidebar = TrendingTopics([], handleSearch);
    mainLayout.appendChild(trendingSidebar);

    appContainer.appendChild(mainLayout);

    // Footer
    const footer = createFooter();
    appContainer.appendChild(footer);

    // Initial render of content
    renderContent();
}

/**
 * Renders content based on current state
 */
function renderContent() {
    if (!contentContainer) return;

    contentContainer.innerHTML = '';

    if (state.isLoading) {
        contentContainer.appendChild(Loader('Fetching stories...'));
        contentContainer.appendChild(SkeletonLoader(5));
        return;
    }

    if (state.error) {
        contentContainer.appendChild(ErrorState(
            'Failed to load stories',
            state.error,
            handleRefresh
        ));
        return;
    }

    if (state.stories.length === 0) {
        contentContainer.appendChild(EmptyState(
            'No stories found',
            'Try selecting a different source or adjusting your filters'
        ));
        return;
    }

    // Filter stories by search query
    let filteredStories = state.stories;

    if (state.filters.searchQuery) {
        const query = state.filters.searchQuery.toLowerCase();
        filteredStories = filteredStories.filter(story =>
            story.title.toLowerCase().includes(query) ||
            (story.domain && story.domain.toLowerCase().includes(query)) ||
            (story.author && story.author.toLowerCase().includes(query))
        );
    }

    // Filter by time
    if (state.filters.timeFilter !== 'all') {
        const now = new Date();
        const cutoffs = {
            '1h': 60 * 60 * 1000,
            '24h': 24 * 60 * 60 * 1000,
            '7d': 7 * 24 * 60 * 60 * 1000
        };
        const cutoff = cutoffs[state.filters.timeFilter];
        if (cutoff) {
            filteredStories = filteredStories.filter(story =>
                story.timestamp && (now - story.timestamp) <= cutoff
            );
        }
    }

    // Stats bar
    const sourceLabel = getSourceLabel(state.filters.storyType);
    const statsBar = StatsBar({
        count: filteredStories.length,
        source: sourceLabel,
        lastUpdated: state.lastUpdated,
        aiEnabled: state.aiEnabled,
        aiLoading: state.aiLoading,
        sortBy: state.sortBy,
        onSortChange: state.filters.storyType === 'newsapi' ? null : handleSortChange
    });
    contentContainer.appendChild(statsBar);

    // Add AI summaries to stories if available
    let storiesWithSummaries = filteredStories.map(story => ({
        ...story,
        aiSummary: state.aiSummaries.get(story.id.toString()) || null
    }));

    // Sort by velocity if selected
    if (state.sortBy === 'velocity') {
        storiesWithSummaries = [...storiesWithSummaries].sort((a, b) => {
            const velA = a.hotness?.velocity || 0;
            const velB = b.hotness?.velocity || 0;
            return velB - velA;
        });
        // Re-assign ranks after sorting
        storiesWithSummaries = storiesWithSummaries.map((story, index) => ({
            ...story,
            rank: index + 1
        }));
    }

    // Limit to displayCount
    const displayedStories = storiesWithSummaries.slice(0, state.displayCount);
    const hasMore = storiesWithSummaries.length > state.displayCount;

    // News list with AI summaries option
    const newsList = NewsList(displayedStories, {
        showSummaries: state.aiEnabled && state.aiSummaries.size > 0,
        onExtendSummary: handleExtendSummary
    });
    contentContainer.appendChild(newsList);

    // Load More button
    if (hasMore) {
        const loadMoreBtn = createElement(`
            <div class="load-more-container">
                <button class="btn btn-secondary load-more-btn">
                    Load More (${storiesWithSummaries.length - state.displayCount} remaining)
                </button>
            </div>
        `);
        loadMoreBtn.querySelector('button').addEventListener('click', handleLoadMore);
        contentContainer.appendChild(loadMoreBtn);
    }

    // Update trending sidebar with current stories
    if (trendingSidebar) {
        // Pass original stories to trending topics so tags reflect all content,
        // or filteredStories if we want tags to reflect only current view?
        // Usually trending topics should reflect the broader dataset (state.stories).
        // But if user filters by time, maybe they want trending topics for that time.
        // Let's use filteredStories to keep it contextual.
        updateTrendingTopics(trendingSidebar, filteredStories, handleSearch);
    }
}

/**
 * Gets human-readable label for source type
 * @param {string} storyType - Story type code
 * @returns {string} Source label
 */
function getSourceLabel(storyType) {
    const labels = {
        'top': 'Hacker News - Top Stories',
        'best': 'Hacker News - Best Stories',
        'new': 'Hacker News - New Stories',
        'ask': 'Hacker News - Ask HN',
        'show': 'Hacker News - Show HN',
        'job': 'Hacker News - Jobs',
        'newsapi': 'NewsAPI - Top Headlines'
    };
    return labels[storyType] || 'Unknown Source';
}

/**
 * Loads stories based on current filters
 */
async function loadStories() {
    state.isLoading = true;
    state.error = null;
    state.aiSummaries = new Map(); // Clear summaries on new load
    renderContent();

    try {
        let stories = [];

        if (state.filters.storyType === 'newsapi') {
            // Use NewsAPI
            if (!isNewsApiConfigured()) {
                throw new Error('NewsAPI key not configured. Add VITE_NEWS_API_KEY to your .env file.');
            }
            stories = await fetchTopHeadlines({
                category: state.filters.category,
                country: state.filters.country,
                pageSize: 30
            });
        } else {
            // Use Hacker News API
            stories = await fetchStories(state.filters.storyType, 30);
        }

        state.stories = stories;
        state.lastUpdated = new Date();
        state.isLoading = false;
        state.error = null;

        renderContent();

        // If AI is enabled, generate summaries
        if (state.aiEnabled && isOpenAIConfigured()) {
            generateSummaries();
        }
    } catch (error) {
        console.error('Error loading stories:', error);
        state.stories = [];
        state.isLoading = false;
        state.error = error.message || 'Failed to load stories';
        renderContent();
    }
}

/**
 * Generates AI summaries for loaded stories
 */
async function generateSummaries() {
    if (!isOpenAIConfigured() || state.stories.length === 0) return;

    state.aiLoading = true;
    renderContent();

    try {
        const summaries = await summarizeStories(state.stories, 10);
        state.aiSummaries = summaries;
        state.aiLoading = false;
    } catch (error) {
        console.error('Error generating summaries:', error);
        state.aiLoading = false;
    }

    renderContent();
}

/**
 * Handles AI toggle button click
 */
function handleAIToggle() {
    state.aiEnabled = !state.aiEnabled;

    // Re-render header to update button state
    const newHeader = Header({
        aiEnabled: state.aiEnabled,
        onAIToggle: handleAIToggle
    });
    headerElement.replaceWith(newHeader);
    headerElement = newHeader;

    // If AI just enabled and we have stories, generate summaries
    if (state.aiEnabled && state.stories.length > 0 && state.aiSummaries.size === 0) {
        generateSummaries();
    } else {
        renderContent();
    }
}

/**
 * Handles sort change
 * @param {string} sortBy - Sort method ('rank' or 'velocity')
 */
function handleSortChange(sortBy) {
    state.sortBy = sortBy;
    renderContent();
}

/**
 * Handles search input
 * @param {string} query - Search query
 */
function handleSearch(query) {
    state.filters.searchQuery = query;
    state.displayCount = 10; // Reset pagination
    renderContent();
}

/**
 * Handles Load More button click
 */
function handleLoadMore() {
    state.displayCount += 10;
    renderContent();
}

/**
 * Handles filter changes
 * @param {string} filterName - Name of the filter
 * @param {string} filterValue - New filter value
 */
function handleFilterChange(filterName, filterValue) {
    state.filters[filterName] = filterValue;
    state.displayCount = 10; // Reset pagination on filter change

    // Update filter bar state for enabling/disabling dropdowns
    if (filterName === 'storyType') {
        updateFilterState(filterBarElement, filterValue);
        // Reload stories from API for source changes
        loadStories();
    } else if (filterName === 'category' || filterName === 'country') {
        // Reload stories from API for NewsAPI filter changes
        loadStories();
    } else {
        // For search and time filters, just re-render (client-side filtering)
        renderContent();
    }
}

/**
 * Handles extending a summary for a specific story
 * @param {Object} story - Story to analyze in detail
 */
async function handleExtendSummary(story) {
    try {
        const detail = await summarizeStory(story, true);
        if (detail) {
            state.aiSummaries.set(story.id.toString(), detail);
            // Re-render to show new detailed summary and remove "Tell me more" button
            renderContent();
        }
    } catch (error) {
        console.error('Failed to extend summary:', error);
        // On error, re-rendering will reset the button state from "Analyzing..."
        renderContent();
    }
}

/**
 * Handles refresh button click
 */
function handleRefresh() {
    loadStories();
}

/**
 * Creates the footer element
 * @returns {HTMLElement} Footer element
 */
function createFooter() {
    const html = `
    <footer class="app-footer">
      <div class="footer-content">
        <div class="footer-links">
          <a href="https://news.ycombinator.com" target="_blank" rel="noopener">Hacker News</a>
          <a href="https://github.com/HackerNews/API" target="_blank" rel="noopener">HN API</a>
          ${isNewsApiConfigured() ? `<a href="https://newsapi.org" target="_blank" rel="noopener">NewsAPI</a>` : ''}
          ${isOpenAIConfigured() ? `<a href="https://openai.com" target="_blank" rel="noopener">OpenAI</a>` : ''}
        </div>
      </div>
    </footer>
  `;

    return createElement(html);
}
