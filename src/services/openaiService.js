/**
 * OpenAI Service
 * Provides AI-powered summarization for news stories
 */

const OPENAI_API_URL = 'https://api.openai.com/v1/chat/completions';

/**
 * Gets the OpenAI API key from environment
 * @returns {string|null} API key or null
 */
function getApiKey() {
    return import.meta.env.VITE_OPENAI_API_KEY || null;
}

/**
 * Checks if OpenAI is configured
 * @returns {boolean} True if API key is set
 */
export function isConfigured() {
    return !!getApiKey();
}

/**
 * Generates a smart summary for a single story
 * @param {Object} story - Story object with title and url
 * @param {boolean} detailed - Whether to generate a detailed summary
 * @returns {Promise<string>} AI-generated summary
 */
export async function summarizeStory(story, detailed = false) {
    const apiKey = getApiKey();

    if (!apiKey) {
        throw new Error('OpenAI API key not configured');
    }

    const systemPrompt = detailed
        ? 'You are a tech news analyst. Provide a detailed 3-4 sentence analysis of this story, explaining the context, technical details if relevant, and why it matters to the industry.'
        : 'You are a tech news summarizer. Generate a concise 1-2 sentence summary explaining why this story matters to tech professionals. Be specific and insightful, not generic.';

    const userPrompt = detailed
        ? `Analyze this tech news story in detail:\n\nTitle: ${story.title}\nSource: ${story.domain || 'Hacker News'}\nEngagement: ${story.points} points, ${story.commentCount} comments`
        : `Summarize this tech news story:\n\nTitle: ${story.title}\nSource: ${story.domain || 'Hacker News'}\nEngagement: ${story.points} points, ${story.commentCount} comments`;

    const maxTokens = detailed ? 200 : 100;

    try {
        const response = await fetch(OPENAI_API_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${apiKey}`
            },
            body: JSON.stringify({
                model: 'gpt-3.5-turbo',
                messages: [
                    {
                        role: 'system',
                        content: systemPrompt
                    },
                    {
                        role: 'user',
                        content: userPrompt
                    }
                ],
                max_tokens: maxTokens,
                temperature: 0.7
            })
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error?.message || 'Failed to generate summary');
        }

        const data = await response.json();
        return data.choices[0]?.message?.content?.trim() || null;
    } catch (error) {
        console.error('Error generating summary:', error);
        throw error;
    }
}

/**
 * Generates summaries for multiple stories (batch)
 * @param {Object[]} stories - Array of story objects
 * @param {number} limit - Max stories to summarize (to manage API costs)
 * @returns {Promise<Map<string, string>>} Map of story ID to summary
 */
export async function summarizeStories(stories, limit = 10) {
    const apiKey = getApiKey();

    if (!apiKey) {
        throw new Error('OpenAI API key not configured');
    }

    // Only summarize top stories to manage costs
    const topStories = stories.slice(0, limit);

    // Create a combined prompt for efficiency
    const storyList = topStories
        .map((s, i) => `${i + 1}. "${s.title}" (${s.points} pts)`)
        .join('\n');

    try {
        const response = await fetch(OPENAI_API_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${apiKey}`
            },
            body: JSON.stringify({
                model: 'gpt-3.5-turbo',
                messages: [
                    {
                        role: 'system',
                        content: `You are a tech news analyst. For each story, provide a brief 1-sentence summary explaining its significance. Format: Return a JSON array of objects with "index" (1-based) and "summary" fields. Be insightful and specific.`
                    },
                    {
                        role: 'user',
                        content: `Summarize these top tech stories:\n\n${storyList}`
                    }
                ],
                max_tokens: 800,
                temperature: 0.7
            })
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error?.message || 'Failed to generate summaries');
        }

        const data = await response.json();
        const content = data.choices[0]?.message?.content?.trim();

        // Parse the JSON response
        const summaries = new Map();
        try {
            // Extract JSON from response (handle markdown code blocks)
            const jsonMatch = content.match(/\[[\s\S]*\]/);
            if (jsonMatch) {
                const parsed = JSON.parse(jsonMatch[0]);
                parsed.forEach(item => {
                    const story = topStories[item.index - 1];
                    if (story) {
                        summaries.set(story.id.toString(), item.summary);
                    }
                });
            }
        } catch (parseError) {
            console.error('Error parsing summaries:', parseError);
        }

        return summaries;
    } catch (error) {
        console.error('Error generating summaries:', error);
        throw error;
    }
}


