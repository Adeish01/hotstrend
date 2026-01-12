/**
 * NewsAPI Service
 * Fetches news sources and headlines from NewsAPI.org
 * 
 * API Docs: https://newsapi.org/docs
 */

const NEWS_API_BASE = 'https://newsapi.org/v2';







/**
 * Gets the API key from environment variables
 * @returns {string|null} API key or null if not set
 */
function getApiKey() {
    return import.meta.env.VITE_NEWS_API_KEY || null;
}



/**
 * Fetches top headlines
 * @param {Object} options - Query options
 * @param {string} options.category - News category
 * @param {string} options.country - Country code
 * @param {string} options.sources - Comma-separated source IDs
 * @param {number} options.pageSize - Number of results (max 100)
 * @returns {Promise<Object[]>} Array of article objects
 */
export async function fetchTopHeadlines({
    category = 'technology',
    country = 'us',
    sources = '',
    pageSize = 30
} = {}) {
    const apiKey = getApiKey();

    if (!apiKey) {
        console.warn('NewsAPI key not configured - headlines disabled');
        return [];
    }

    try {
        const params = new URLSearchParams();
        params.append('apiKey', apiKey);
        params.append('pageSize', pageSize.toString());

        // Note: sources cannot be combined with country or category
        if (sources) {
            params.append('sources', sources);
        } else {
            if (country) params.append('country', country);
            if (category) params.append('category', category);
        }

        const response = await fetch(`${NEWS_API_BASE}/top-headlines?${params}`);
        const data = await response.json();

        if (data.status !== 'ok') {
            throw new Error(data.message || 'Failed to fetch headlines');
        }

        return data.articles.map((article, index) => formatArticle(article, index + 1));
    } catch (error) {
        console.error('Error fetching headlines:', error);
        return [];
    }
}

/**
 * Formats an article object for display
 * @param {Object} article - Raw article from NewsAPI
 * @param {number} rank - Article rank in the list
 * @returns {Object} Formatted article object
 */
function formatArticle(article, rank) {
    return {
        id: `newsapi-${rank}-${Date.now()}`,
        rank: rank,
        title: article.title || 'Untitled',
        url: article.url,
        domain: extractDomain(article.url),
        author: article.author || article.source?.name || 'Unknown',
        description: article.description,
        imageUrl: article.urlToImage,
        timestamp: article.publishedAt ? new Date(article.publishedAt) : new Date(),
        source: article.source?.name || 'Unknown',
        isHackerNews: false,
        // NewsAPI doesn't provide engagement metrics
        points: null,
        commentCount: null,
        commentsUrl: null
    };
}

/**
 * Extracts domain from a URL
 * @param {string} url - Full URL
 * @returns {string} Domain name
 */
function extractDomain(url) {
    if (!url) return '';

    try {
        const urlObj = new URL(url);
        return urlObj.hostname.replace('www.', '');
    } catch {
        return '';
    }
}







/**
 * Check if NewsAPI is configured
 * @returns {boolean} True if API key is set
 */
export function isConfigured() {
    return !!getApiKey();
}
