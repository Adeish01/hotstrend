const OPENAI_API_URL = 'https://api.openai.com/v1/chat/completions';

export default async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    const apiKey = process.env.OPENAI_API_KEY;

    if (!apiKey) {
        return res.status(500).json({ error: 'OpenAI API key not configured on server' });
    }

    const { type, story, stories, detailed, limit } = req.body;

    try {
        let messages = [];
        let maxTokens = 100;

        if (type === 'single') {
            const systemPrompt = detailed
                ? 'You are a tech news analyst. Provide a detailed 3-4 sentence analysis of this story, explaining the context, technical details if relevant, and why it matters to the industry.'
                : 'You are a tech news summarizer. Generate a concise 1-2 sentence summary explaining why this story matters to tech professionals. Be specific and insightful, not generic.';

            const userPrompt = detailed
                ? `Analyze this tech news story in detail:\n\nTitle: ${story.title}\nSource: ${story.domain || 'Hacker News'}\nEngagement: ${story.points} points, ${story.commentCount} comments`
                : `Summarize this tech news story:\n\nTitle: ${story.title}\nSource: ${story.domain || 'Hacker News'}\nEngagement: ${story.points} points, ${story.commentCount} comments`;

            maxTokens = detailed ? 200 : 100;
            messages = [
                { role: 'system', content: systemPrompt },
                { role: 'user', content: userPrompt }
            ];

        } else if (type === 'batch') {
            const topStories = stories.slice(0, limit || 10);
            const storyList = topStories
                .map((s, i) => `${i + 1}. "${s.title}" (${s.points} pts)`)
                .join('\n');

            messages = [
                {
                    role: 'system',
                    content: `You are a tech news analyst. For each story, provide a brief 1-sentence summary explaining its significance. Format: Return a JSON array of objects with "index" (1-based) and "summary" fields. Be insightful and specific.`
                },
                {
                    role: 'user',
                    content: `Summarize these top tech stories:\n\n${storyList}`
                }
            ];
            maxTokens = 800;

        } else {
            return res.status(400).json({ error: 'Invalid request type' });
        }

        const response = await fetch(OPENAI_API_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${apiKey}`
            },
            body: JSON.stringify({
                model: 'gpt-3.5-turbo',
                messages,
                max_tokens: maxTokens,
                temperature: 0.7
            })
        });

        if (!response.ok) {
            const error = await response.json();
            return res.status(response.status).json({ error: error.error?.message || 'OpenAI API error' });
        }

        const data = await response.json();
        return res.status(200).json(data);

    } catch (error) {
        console.error('Error in OpenAI function:', error);
        return res.status(500).json({ error: 'Internal Server Error' });
    }
}
