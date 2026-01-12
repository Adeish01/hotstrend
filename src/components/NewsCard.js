/**
 * NewsCard Component
 * Individual news item card with title, metadata, engagement stats, image, and optional AI summary
 */

import { createElement, escapeHtml, formatRelativeTime, formatNumber } from '../utils/helpers.js';
import { getWhyItsHot } from '../utils/hotness.js';

/**
 * Creates a news card element
 * @param {Object} story - Story data
 * @param {Object} options - Display options
 * @param {boolean} options.showSummary - Whether to show AI summary
 * @returns {HTMLElement} NewsCard element
 */
export function NewsCard(story, options = {}) {
  const {
    rank,
    title,
    url,
    domain,
    author,
    points,
    commentCount,
    commentsUrl,
    timestamp,
    source,
    isHackerNews,
    hotness,
    discussion,
    aiSummary,
    imageUrl,
    description
  } = story;

  /* Extract options */
  const { showSummary = false, onExtendSummary = null } = options;

  const relativeTime = formatRelativeTime(timestamp);

  /* ... (rest of variable prep) ... */

  const pointsDisplay = points !== null ? formatNumber(points) : null;
  const commentsDisplay = commentCount !== null ? formatNumber(commentCount) : null;

  // Get the "Why It's Hot" explanation
  const whyHot = getWhyItsHot(story);
  const hotnessLevel = hotness?.level || 'cold';

  // Determine card styling based on hotness
  const cardClass = hotnessLevel === 'fire' || hotnessLevel === 'hot'
    ? `news-card hotness-${hotnessLevel}`
    : 'news-card';

  // Show image for NewsAPI stories
  const hasImage = !isHackerNews && imageUrl;

  const html = `
    <article class="${cardClass} ${hasImage ? 'has-image' : ''}">
      ${hasImage ? `
        <div class="news-card-image">
          <img src="${escapeHtml(imageUrl)}" alt="" loading="lazy" onerror="this.parentElement.style.display='none'" />
        </div>
      ` : ''}
      <div class="news-card-body">
        <div class="news-card-header">
          <div class="news-card-rank">${rank}</div>
          <div class="news-card-content">
            <div class="news-card-title-row">
              <h2 class="news-card-title">
                <a href="${escapeHtml(url)}" target="_blank" rel="noopener noreferrer">
                  ${escapeHtml(title)}
                </a>
              </h2>
              ${whyHot ? `<span class="hotness-badge hotness-${hotnessLevel}">${whyHot}</span>` : ''}
            </div>
            <div class="news-card-meta">
              ${domain ? `<span class="news-card-source">${escapeHtml(domain)}</span>` : ''}
              ${domain && author ? '<span class="news-card-divider">•</span>' : ''}
              ${author ? `<span class="news-card-author">by ${escapeHtml(author)}</span>` : ''}
              ${(domain || author) && relativeTime ? '<span class="news-card-divider">•</span>' : ''}
              ${relativeTime ? `<span class="news-card-time">${relativeTime}</span>` : ''}
            </div>
            ${showSummary && aiSummary ? `
              <div class="news-card-summary">
                <svg class="summary-icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <circle cx="12" cy="12" r="3"/>
                  <path d="M12 2v4"/>
                  <path d="M12 18v4"/>
                  <path d="M4.93 4.93l2.83 2.83"/>
                  <path d="M16.24 16.24l2.83 2.83"/>
                  <path d="M2 12h4"/>
                  <path d="M18 12h4"/>
                </svg>
                <div class="summary-content">
                  <p class="summary-text">${escapeHtml(aiSummary)}</p>
                  ${onExtendSummary ? `<button class="btn-text extend-summary-btn" title="Get detailed analysis">Tell me more</button>` : ''}
                </div>
              </div>
            ` : description && !isHackerNews ? `
              <p class="news-card-description">${escapeHtml(description.substring(0, 150))}${description.length > 150 ? '...' : ''}</p>
            ` : ''}
          </div>
        </div>
        
        ${isHackerNews ? `
          <div class="news-card-stats">
            ${pointsDisplay !== null ? `
              <div class="news-card-stat points">
                <svg class="news-card-stat-icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 4l2.293 6.293h6.414l-5.207 4.214 2.293 6.293-5.793-4.293-5.793 4.293 2.293-6.293-5.207-4.214h6.414z"/>
                </svg>
                <span>${pointsDisplay} points</span>
              </div>
            ` : ''}
            
            ${commentsDisplay !== null ? `
              <div class="news-card-stat comments">
                <svg class="news-card-stat-icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
                </svg>
                <a href="${escapeHtml(commentsUrl)}" target="_blank" rel="noopener noreferrer">
                  ${commentsDisplay} comments
                </a>
              </div>
            ` : ''}
            
            ${hotness?.velocity ? `
              <div class="news-card-stat velocity">
                <svg class="news-card-stat-icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/>
                  <polyline points="17 6 23 6 23 12"/>
                </svg>
                <span>${hotness.velocity} pts/hr</span>
              </div>
            ` : ''}
          </div>
        ` : `
          <div class="news-card-stats">
            <div class="news-card-stat source-badge">
              <svg class="news-card-stat-icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <rect x="3" y="3" width="18" height="18" rx="2"/>
                <path d="M9 3v18M21 9H9"/>
              </svg>
              <span>${escapeHtml(source)}</span>
            </div>
          </div>
        `}
      </div>
    </article>
  `;

  const element = createElement(html);

  // Attach event listener for extend button
  if (onExtendSummary) {
    const extendBtn = element.querySelector('.extend-summary-btn');
    if (extendBtn) {
      extendBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        // Visual feedback
        extendBtn.textContent = 'Analyzing...';
        extendBtn.style.opacity = '0.7';
        extendBtn.style.cursor = 'wait';
        onExtendSummary(story);
      });
    }
  }

  return element;
}
