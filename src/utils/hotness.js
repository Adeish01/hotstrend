/**
 * Hotness Calculator Utility
 * Calculates velocity-based hotness scores for stories
 */

/**
 * Stop words to exclude from trending topic extraction
 */
const STOP_WORDS = new Set([
    'the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for',
    'of', 'with', 'by', 'from', 'is', 'it', 'as', 'be', 'was', 'are',
    'been', 'being', 'have', 'has', 'had', 'do', 'does', 'did', 'will',
    'would', 'could', 'should', 'may', 'might', 'must', 'shall', 'can',
    'this', 'that', 'these', 'those', 'i', 'you', 'he', 'she', 'we',
    'they', 'what', 'which', 'who', 'whom', 'when', 'where', 'why', 'how',
    'all', 'each', 'every', 'both', 'few', 'more', 'most', 'other', 'some',
    'such', 'no', 'nor', 'not', 'only', 'own', 'same', 'so', 'than', 'too',
    'very', 'just', 'about', 'into', 'through', 'during', 'before', 'after',
    'above', 'below', 'between', 'under', 'again', 'further', 'then', 'once',
    'here', 'there', 'any', 'my', 'your', 'its', 'our', 'their', 'out', 'up',
    'down', 'off', 'over', 'now', 'new', 'also', 'get', 'got', 'getting',
    'show', 'ask', 'hn', 'via', 'using', 'use', 'used', 'make', 'made',
    'video', 'pdf', 'why', 'how', 'im', "i'm", 'dont', "don't", 'cant',
    "can't", 'wont', "won't", 'like', 'need', 'want', 'way', 'one', 'two',
    'first', 'last', 'year', 'years', 'day', 'days', 'time', 'still'
]);

/**
 * Tech-focused keywords that get extra weight
 */
const TECH_KEYWORDS = new Set([
    'ai', 'ml', 'gpt', 'llm', 'openai', 'chatgpt', 'claude', 'gemini',
    'rust', 'python', 'javascript', 'typescript', 'golang', 'swift',
    'react', 'vue', 'angular', 'node', 'deno', 'bun',
    'linux', 'windows', 'macos', 'android', 'ios',
    'aws', 'azure', 'gcp', 'cloud', 'kubernetes', 'docker',
    'blockchain', 'crypto', 'bitcoin', 'ethereum', 'web3',
    'startup', 'vc', 'funding', 'ipo', 'acquisition',
    'apple', 'google', 'microsoft', 'meta', 'amazon', 'nvidia', 'tesla',
    'security', 'privacy', 'hack', 'breach', 'vulnerability',
    'opensource', 'github', 'gitlab',
    'database', 'sql', 'postgres', 'mongodb', 'redis',
    'api', 'sdk', 'framework', 'library'
]);

/**
 * Calculates the velocity-based hotness score
 * @param {number} points - Story points/score
 * @param {Date} timestamp - When the story was posted
 * @returns {Object} Hotness data with score, level, and explanation
 */
export function calculateHotness(points, timestamp) {
    if (!timestamp || !(timestamp instanceof Date)) {
        return { score: 0, velocity: 0, level: 'cold', reason: null };
    }

    const now = new Date();
    const hoursOld = Math.max((now - timestamp) / (1000 * 60 * 60), 0.1); // min 6 minutes

    // Velocity = points per hour
    const velocity = points / hoursOld;

    // Hotness score combines velocity with recency bonus
    // Fresh stories get a boost, older stories need higher velocity
    const recencyMultiplier = Math.max(1, 3 - (hoursOld / 4)); // 3x for <1hr, decays to 1x at 8hrs
    const score = velocity * recencyMultiplier;

    // Determine hotness level based on score thresholds
    let level, reason;

    if (score >= 100) {
        level = 'fire';
        reason = `🔥 ${Math.round(velocity)} pts/hr`;
    } else if (score >= 50) {
        level = 'hot';
        reason = `🔥 ${Math.round(velocity)} pts/hr`;
    } else if (score >= 20) {
        level = 'warm';
        reason = `📈 ${Math.round(velocity)} pts/hr`;
    } else if (score >= 5) {
        level = 'mild';
        reason = hoursOld < 2 ? '🆕 Fresh' : null;
    } else {
        level = 'cold';
        reason = null;
    }

    return {
        score: Math.round(score * 10) / 10,
        velocity: Math.round(velocity * 10) / 10,
        level,
        reason,
        hoursOld: Math.round(hoursOld * 10) / 10
    };
}

/**
 * Calculates the discussion intensity
 * @param {number} commentCount - Number of comments
 * @param {number} points - Story points
 * @returns {Object|null} Discussion data if noteworthy
 */
export function calculateDiscussionIntensity(commentCount, points) {
    if (!commentCount || commentCount < 10) return null;

    // Comment-to-point ratio indicates discussion intensity
    const ratio = points > 0 ? commentCount / points : 0;

    if (commentCount >= 200) {
        return { level: 'intense', reason: `💬 ${commentCount} comments` };
    } else if (ratio > 2 && commentCount >= 50) {
        return { level: 'controversial', reason: `💬 Heated debate` };
    } else if (commentCount >= 100) {
        return { level: 'active', reason: `💬 ${commentCount} discussing` };
    }

    return null;
}

/**
 * Gets the "Why It's Hot" explanation for a story
 * @param {Object} story - Story object with hotness data
 * @returns {string|null} Explanation text
 */
export function getWhyItsHot(story) {
    // Priority: Hotness velocity > Discussion intensity > Fresh
    if (story.hotness?.reason) {
        return story.hotness.reason;
    }

    if (story.discussion?.reason) {
        return story.discussion.reason;
    }

    return null;
}

/**
 * Extracts trending topics from story titles
 * @param {Object[]} stories - Array of story objects
 * @param {number} limit - Max number of topics to return
 * @returns {Object[]} Array of { word, count, weight } objects
 */
export function extractTrendingTopics(stories, limit = 15) {
    const wordCounts = new Map();

    stories.forEach(story => {
        if (!story.title) return;

        // Tokenize and clean the title
        const words = story.title
            .toLowerCase()
            .replace(/[^\w\s-]/g, ' ')
            .split(/\s+/)
            .filter(word =>
                word.length >= 2 &&
                word.length <= 20 &&
                !STOP_WORDS.has(word) &&
                !/^\d+$/.test(word)
            );

        // Count unique words per story (prevent one story from dominating)
        const uniqueWords = new Set(words);
        uniqueWords.forEach(word => {
            const current = wordCounts.get(word) || { count: 0, points: 0 };
            current.count += 1;
            current.points += story.points || 0;
            wordCounts.set(word, current);
        });
    });

    // Convert to array and calculate weighted score
    const topics = Array.from(wordCounts.entries())
        .map(([word, data]) => {
            // Weight = count * (1 + log of avg points) * tech bonus
            const avgPoints = data.points / data.count;
            const techBonus = TECH_KEYWORDS.has(word) ? 1.5 : 1;
            const weight = data.count * (1 + Math.log10(Math.max(avgPoints, 1))) * techBonus;

            return {
                word,
                count: data.count,
                weight: Math.round(weight * 10) / 10,
                isTech: TECH_KEYWORDS.has(word)
            };
        })
        // Filter: must appear in at least 2 stories
        .filter(topic => topic.count >= 2)
        // Sort by weight
        .sort((a, b) => b.weight - a.weight)
        // Limit results
        .slice(0, limit);

    return topics;
}

/**
 * Gets a size class for word cloud based on weight
 * @param {number} weight - Topic weight
 * @param {number} maxWeight - Maximum weight in the set
 * @returns {string} Size class (xs, sm, md, lg, xl)
 */
export function getTopicSizeClass(weight, maxWeight) {
    const ratio = weight / maxWeight;

    if (ratio >= 0.8) return 'xl';
    if (ratio >= 0.6) return 'lg';
    if (ratio >= 0.4) return 'md';
    if (ratio >= 0.2) return 'sm';
    return 'xs';
}
