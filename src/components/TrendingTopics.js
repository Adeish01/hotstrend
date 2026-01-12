/**
 * TrendingTopics Component
 * Displays a word cloud of trending topics extracted from stories
 */

import { createElement } from '../utils/helpers.js';
import { extractTrendingTopics, getTopicSizeClass } from '../utils/hotness.js';

/**
 * Creates the trending topics sidebar component
 * @param {Object[]} stories - Array of story objects
 * @param {Function} onTopicClick - Callback when a topic is clicked
 * @returns {HTMLElement} TrendingTopics element
 */
export function TrendingTopics(stories, onTopicClick) {
    const html = `
        <aside class="trending-sidebar">
            <div class="trending-header">
                <h3 class="trending-title">
                    <svg class="trending-icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/>
                        <polyline points="17 6 23 6 23 12"/>
                    </svg>
                    Trending Now
                </h3>
                <span class="trending-subtitle">What tech is talking about</span>
            </div>
            <div class="trending-cloud">
                <span class="trending-empty">Loading topics...</span>
            </div>
        </aside>
    `;

    const element = createElement(html);

    // Initial content update
    updateTrendingTopics(element, stories, onTopicClick);

    return element;
}

/**
 * Updates the trending topics content
 * @param {HTMLElement} container - Trending sidebar container
 * @param {Object[]} stories - Updated stories array
 * @param {Function} onTopicClick - Callback when a topic is clicked
 */
export function updateTrendingTopics(container, stories, onTopicClick) {
    const cloudContainer = container.querySelector('.trending-cloud');
    if (!cloudContainer) return;

    const topics = extractTrendingTopics(stories, 15);
    const maxWeight = topics.length > 0 ? topics[0].weight : 1;

    const topicsHtml = topics.map(topic => {
        const sizeClass = getTopicSizeClass(topic.weight, maxWeight);

        return `
            <button class="topic-tag topic-${sizeClass}" 
                  title="Appears in ${topic.count} stories"
                  data-topic="${topic.word}">
                ${topic.word}
            </button>
        `;
    }).join('');

    cloudContainer.innerHTML = topicsHtml || '<span class="trending-empty">No topics yet</span>';

    // Add click listeners
    if (onTopicClick) {
        cloudContainer.querySelectorAll('.topic-tag').forEach(tag => {
            tag.addEventListener('click', () => {
                onTopicClick(tag.dataset.topic);
            });
        });
    }
}
