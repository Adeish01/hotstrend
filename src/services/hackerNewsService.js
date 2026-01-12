/**
 * Hacker News API Service
 * Fetches top, new, and best stories from Hacker News
 * 
 * API Docs: https://github.com/HackerNews/API
 */

import { calculateHotness, calculateDiscussionIntensity } from '../utils/hotness.js';

const HN_API_BASE = 'https://hacker-news.firebaseio.com/v0';

/**
 * Story types available from Hacker News
 */
export const StoryTypes = {
    TOP: 'top',
    NEW: 'new',
    BEST: 'best',
    ASK: 'ask',
    SHOW: 'show',
    JOB: 'job'
};

/**
 * Fetches story IDs for a given type
 * @param {string} type - Story type (top, new, best, ask, show, job)
 * @returns {Promise<number[]>} Array of story IDs
 */
export async function fetchStoryIds(type = StoryTypes.TOP) {
    try {
        const endpoint = `${HN_API_BASE}/${type}stories.json`;
        const response = await fetch(endpoint);

        if (!response.ok) {
            throw new Error(`Failed to fetch ${type} stories: ${response.status}`);
        }

        return await response.json();
    } catch (error) {
        console.error(`Error fetching ${type} story IDs:`, error);
        throw error;
    }
}

/**
 * Fetches details for a single story
 * @param {number} id - Story ID
 * @returns {Promise<Object>} Story details
 */
export async function fetchStoryDetails(id) {
    try {
        const response = await fetch(`${HN_API_BASE}/item/${id}.json`);

        if (!response.ok) {
            throw new Error(`Failed to fetch story ${id}: ${response.status}`);
        }

        return await response.json();
    } catch (error) {
        console.error(`Error fetching story ${id}:`, error);
        return null;
    }
}

/**
 * Fetches multiple stories with details
 * @param {string} type - Story type
 * @param {number} limit - Maximum number of stories to fetch
 * @returns {Promise<Object[]>} Array of story objects with details
 */
export async function fetchStories(type = StoryTypes.TOP, limit = 30) {
    try {
        // Get story IDs
        const storyIds = await fetchStoryIds(type);

        // Limit the number of stories
        const limitedIds = storyIds.slice(0, limit);

        // Fetch details for each story in parallel
        const storyPromises = limitedIds.map(id => fetchStoryDetails(id));
        const stories = await Promise.all(storyPromises);

        // Filter out null results and format
        return stories
            .filter(story => story !== null && story.type === 'story')
            .map((story, index) => formatStory(story, index + 1));
    } catch (error) {
        console.error('Error fetching stories:', error);
        throw error;
    }
}

/**
 * Formats a story object for display
 * @param {Object} story - Raw story from HN API
 * @param {number} rank - Story rank in the list
 * @returns {Object} Formatted story object
 */
function formatStory(story, rank) {
    const timestamp = story.time ? new Date(story.time * 1000) : new Date();
    const points = story.score || 0;
    const commentCount = story.descendants || 0;

    // Calculate velocity-based hotness
    const hotness = calculateHotness(points, timestamp);
    const discussion = calculateDiscussionIntensity(commentCount, points);

    return {
        id: story.id,
        rank: rank,
        title: story.title || 'Untitled',
        url: story.url || `https://news.ycombinator.com/item?id=${story.id}`,
        domain: extractDomain(story.url),
        author: story.by || 'anonymous',
        points: points,
        commentCount: commentCount,
        commentsUrl: `https://news.ycombinator.com/item?id=${story.id}`,
        timestamp: timestamp,
        source: 'Hacker News',
        isHackerNews: true,
        // Hotness data
        hotness: hotness,
        discussion: discussion
    };
}

/**
 * Extracts domain from a URL
 * @param {string} url - Full URL
 * @returns {string} Domain name or empty string
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


