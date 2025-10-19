// api/recommend.js
export default async function handler(req, res) {
    // CORS headers
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    
    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }
    
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }
    
    try {
        const { favorites } = req.body;
        
        if (!favorites || favorites.length === 0) {
            return res.status(400).json({ error: 'No favorites provided' });
        }
        
        // Создаём промпт для AI
        const prompt = `You are a professional typography expert. Analyze these fonts that the user likes:

${favorites.map(f => `- ${f.family} (${f.category})`).join('\n')}

Based on their preferences, suggest:
1. 5 similar fonts they might like (with brief reason why)
2. 3 fonts that would pair well with their favorites (with pairing explanation)

Respond in JSON format:
{
  "analysis": "brief analysis of user's style preference",
  "similar": [
    {"name": "Font Name", "reason": "why similar"},
    ...
  ],
  "pairings": [
    {"name": "Font Name", "reason": "why good pairing"},
    ...
  ]
}

Only return valid JSON, no markdown, no extra text.`;

        // Вызываем Google Gemini API
        const response = await fetch('https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=' + process.env.GEMINI_API_KEY, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                contents: [{
                    parts: [{
                        text: prompt
                    }]
                }],
                generationConfig: {
                    temperature: 0.7,
                    maxOutputTokens: 1000
                }
            })
        });
        
        if (!response.ok) {
            throw new Error('Gemini API error: ' + response.status);
        }
        
        const data = await response.json();
        const aiText = data.candidates[0].content.parts[0].text;
        
        // Парсим JSON из ответа
        let aiResponse;
        try {
            // Убираем markdown если есть
            const jsonText = aiText.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
            aiResponse = JSON.parse(jsonText);
        } catch (e) {
            console.error('Failed to parse AI response:', aiText);
            throw new Error('Invalid AI response format');
        }
        
        // Форматируем ответ
        return res.status(200).json({
            success: true,
            source: 'ai',
            similar: aiResponse.similar.map(f => f.name),
            pairings: aiResponse.pairings.map(f => f.name),
            explanation: aiResponse.analysis,
            details: {
                similar: aiResponse.similar,
                pairings: aiResponse.pairings
            }
        });
        
    } catch (error) {
        console.error('Error:', error);
        return res.status(500).json({ 
            error: 'AI request failed',
            message: error.message 
        });
    }
}