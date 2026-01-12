export default async function handler(req, res) {
    const apiKey = process.env.NEWS_API_KEY;

    if (!apiKey) {
        return res.status(500).json({ error: 'NewsAPI key not configured on server' });
    }

    const { category, country, sources, pageSize } = req.query;

    try {
        const params = new URLSearchParams();
        params.append('apiKey', apiKey);
        if (pageSize) params.append('pageSize', pageSize);
        if (sources) {
            params.append('sources', sources);
        } else {
            if (country) params.append('country', country);
            if (category) params.append('category', category);
        }

        const response = await fetch(`https://newsapi.org/v2/top-headlines?${params}`);
        const data = await response.json();

        if (data.status !== 'ok') {
            return res.status(response.status).json({ message: data.message || 'Failed to fetch headlines' });
        }

        return res.status(200).json(data);
    } catch (error) {
        console.error('Error fetching headlines:', error);
        return res.status(500).json({ error: 'Internal Server Error' });
    }
}
