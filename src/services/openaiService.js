/**
 * OpenAI Service
 * Provides AI-powered summarization for news stories via serverless API
 */

/**
 * Checks if OpenAI is configured (assumed true for server)
 * @returns {boolean} True
 */
export function isConfigured() {
    return true;
}

/**
 * Generates a smart summary for a single story
 * @param {Object} story - Story object with title and url
 * @param {boolean} detailed - Whether to generate a detailed summary
 * @returns {Promise<string>} AI-generated summary
 */
export async function summarizeStory(story, detailed = false) {
    try {
        const response = await fetch('/api/openai', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                type: 'single',
                story,
                detailed
            })
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error || 'Failed to generate summary');
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
    try {
        const response = await fetch('/api/openai', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                type: 'batch',
                stories,
                limit
            })
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error || 'Failed to generate summaries');
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
                    // Match back to original story by index
                    const story = stories[item.index - 1];
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


