// ========================================
// AI & SMART RECOMMENDATIONS
// ========================================

// База данных шрифтов с правилами
const fontDatabase = {
    // SERIF FONTS
    'Playfair Display': {
        category: 'serif',
        style: 'elegant',
        mood: 'formal',
        weight: 'bold',
        goodPairs: ['Raleway', 'Source Sans Pro', 'Open Sans', 'Lato'],
        similar: ['Crimson Text', 'Lora', 'Merriweather', 'Libre Baskerville'],
        avoidWith: ['Times New Roman', 'Georgia']
    },
    
    'Merriweather': {
        category: 'serif',
        style: 'traditional',
        mood: 'serious',
        weight: 'medium',
        goodPairs: ['Montserrat', 'Lato', 'Roboto', 'Open Sans'],
        similar: ['Lora', 'PT Serif', 'Crimson Text', 'Playfair Display'],
        avoidWith: ['Georgia']
    },
    
    'Lora': {
        category: 'serif',
        style: 'elegant',
        mood: 'warm',
        weight: 'light',
        goodPairs: ['Roboto', 'Open Sans', 'Lato', 'Raleway'],
        similar: ['Merriweather', 'Crimson Text', 'Playfair Display'],
        avoidWith: []
    },
    
    // SANS-SERIF FONTS
    'Roboto': {
        category: 'sans-serif',
        style: 'modern',
        mood: 'neutral',
        weight: 'medium',
        goodPairs: ['Playfair Display', 'Merriweather', 'Lora', 'Crimson Text'],
        similar: ['Open Sans', 'Lato', 'Source Sans Pro', 'Noto Sans'],
        avoidWith: ['Arial', 'Helvetica']
    },
    
    'Open Sans': {
        category: 'sans-serif',
        style: 'friendly',
        mood: 'casual',
        weight: 'light',
        goodPairs: ['Playfair Display', 'Merriweather', 'Lora', 'Montserrat'],
        similar: ['Roboto', 'Lato', 'Source Sans Pro', 'Nunito'],
        avoidWith: []
    },
    
    'Montserrat': {
        category: 'sans-serif',
        style: 'geometric',
        mood: 'modern',
        weight: 'bold',
        goodPairs: ['Merriweather', 'Lora', 'PT Serif', 'Crimson Text'],
        similar: ['Raleway', 'Poppins', 'Nunito', 'Quicksand'],
        avoidWith: ['Raleway']
    }
};

// Получаем информацию о шрифте
function getFontInfo(fontFamily) {
    return fontDatabase[fontFamily] || null;
}

// Проверяем, есть ли готовые правила для шрифтов
function hasRulesForFonts(fonts) {
    return fonts.some(font => fontDatabase[font.family] !== undefined);
}

// Анализируем предпочтения пользователя
function analyzeUserPreferences(favorites) {
    const analysis = {
        categories: {},
        styles: {},
        moods: {},
        weights: {}
    };
    
    favorites.forEach(font => {
        const info = getFontInfo(font.family);
        if (info) {
            analysis.categories[info.category] = (analysis.categories[info.category] || 0) + 1;
            analysis.styles[info.style] = (analysis.styles[info.style] || 0) + 1;
            analysis.moods[info.mood] = (analysis.moods[info.mood] || 0) + 1;
            analysis.weights[info.weight] = (analysis.weights[info.weight] || 0) + 1;
        }
    });
    
    return analysis;
}

// Главная функция: получаем умные рекомендации
async function getSmartRecommendations(favorites) {
    if (favorites.length === 0) {
        return {
            success: false,
            message: 'No favorites to analyze'
        };
    }
    
    const hasRules = hasRulesForFonts(favorites);
    
    if (hasRules) {
        console.log('✅ Using rule-based recommendations');
        return getRuleBasedRecommendations(favorites);
    } else {
        console.log('🤖 Using fallback recommendations');
        return getFallbackRecommendations(favorites);
    }
}

// Рекомендации на основе правил
function getRuleBasedRecommendations(favorites) {
    const similarFonts = new Set();
    const pairings = new Set();
    
    const analysis = analyzeUserPreferences(favorites);
    
    favorites.forEach(font => {
        const info = getFontInfo(font.family);
        
        if (info) {
            info.similar.forEach(similar => {
                if (!favorites.find(f => f.family === similar)) {
                    similarFonts.add(similar);
                }
            });
            
            info.goodPairs.forEach(pair => {
                if (!favorites.find(f => f.family === pair)) {
                    pairings.add(pair);
                }
            });
        }
    });
    
    const topCategory = Object.keys(analysis.categories).sort((a, b) => 
        analysis.categories[b] - analysis.categories[a]
    )[0];
    
    const topStyle = Object.keys(analysis.styles).sort((a, b) => 
        analysis.styles[b] - analysis.styles[a]
    )[0];
    
    const explanation = `You prefer ${topCategory} fonts with a ${topStyle} style.`;
    
    return {
        success: true,
        source: 'rules',
        similar: Array.from(similarFonts).slice(0, 5),
        pairings: Array.from(pairings).slice(0, 5),
        explanation: explanation,
        analysis: analysis
    };
}

// Fallback рекомендации
function getFallbackRecommendations(favorites) {
    const popularFonts = ['Roboto', 'Open Sans', 'Lato', 'Montserrat', 'Raleway', 'Poppins', 'Nunito'];
    
    return {
        success: true,
        source: 'fallback',
        similar: popularFonts.slice(0, 3),
        pairings: popularFonts.slice(3, 5),
        explanation: 'Based on popular choices, here are some recommended fonts.',
        analysis: null
    };
}

// Показываем рекомендации в модальном окне
function showRecommendationsModal(recommendations) {
    if (!recommendations.success) {
        showToast('❌ ' + recommendations.message);
        return;
    }
    
    const modal = document.createElement('div');
    modal.className = 'ai-modal';
    modal.innerHTML = `
        <div class="ai-modal-content">
            <div class="ai-modal-header">
                <h2>🤖 Smart Recommendations</h2>
                <button class="ai-modal-close" onclick="this.closest('.ai-modal').remove()">✕</button>
            </div>
            
            <div class="ai-explanation">
                <p><strong>Analysis:</strong> ${recommendations.explanation}</p>
                ${recommendations.source === 'rules' ? '<span class="badge">⚡ Instant</span>' : '<span class="badge">📊 Popular</span>'}
            </div>
            
            ${recommendations.similar.length > 0 ? `
                <div class="ai-section">
                    <h3>✨ Similar Fonts You Might Like</h3>
                    <div class="ai-font-grid">
                        ${recommendations.similar.map(fontName => `
                            <div class="ai-font-card" onclick="addFontToFavorites('${fontName}')">
                                <div class="ai-font-preview" style="font-family: '${fontName}', sans-serif;">Aa</div>
                                <div class="ai-font-name">${fontName}</div>
                                <button class="ai-add-btn">+ Add</button>
                            </div>
                        `).join('')}
                    </div>
                </div>
            ` : ''}
            
            ${recommendations.pairings.length > 0 ? `
                <div class="ai-section">
                    <h3>💡 Great Pairings</h3>
                    <div class="ai-font-grid">
                        ${recommendations.pairings.map(fontName => `
                            <div class="ai-font-card" onclick="addFontToFavorites('${fontName}')">
                                <div class="ai-font-preview" style="font-family: '${fontName}', sans-serif;">Aa</div>
                                <div class="ai-font-name">${fontName}</div>
                                <button class="ai-add-btn">+ Add</button>
                            </div>
                        `).join('')}
                    </div>
                </div>
            ` : ''}
            
            <button class="btn-next" onclick="this.closest('.ai-modal').remove()">Close</button>
        </div>
    `;
    
    document.body.appendChild(modal);
    
    [...recommendations.similar, ...recommendations.pairings].forEach(fontName => {
        loadSingleFont(fontName);
    });
}

// Добавляем шрифт в избранное
function addFontToFavorites(fontName) {
    if (swipeFavorites.find(f => f.family === fontName)) {
        showToast('✅ Already in favorites!');
        return;
    }
    
    const font = {
        family: fontName,
        category: getFontInfo(fontName)?.category || 'sans-serif',
        subsets: ['latin']
    };
    
    swipeFavorites.push(font);
    addToFavorites(font);
    saveSession();
    
    showToast(`✅ ${fontName} added to favorites!`);
}

// Кнопка для вызова рекомендаций
async function showAIRecommendationsButton() {
    if (swipeFavorites.length === 0) {
        showToast('⚠️ First, like some fonts in Swipe mode!');
        return;
    }
    
    showToast('🤖 Analyzing your preferences...');
    
    const recommendations = await getSmartRecommendations(swipeFavorites);
    
    showRecommendationsModal(recommendations);
}