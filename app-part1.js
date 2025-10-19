// ========================================
// CONFIGURATION & GLOBAL VARIABLES
// ========================================

const API_KEY = 'AIzaSyC2T6bY7jeG2c5ZpCQrb8NucwqwjCndnvA';

let allFonts = [];
let filteredFonts = [];
let seenFonts = [];
let selectedMode = null;
let selectedLanguages = ['latin', 'cyrillic'];
let requireBothLanguages = false;
let selectedCategories = ['serif', 'sans-serif', 'display', 'handwriting', 'monospace'];

// Swipe mode variables
let swipeIndex = 0;
let swipeFavorites = [];
let currentFont = null; // Новое - текущий отображаемый шрифт

// Tournament mode variables
let tournamentFonts = [];
let tournamentRound = 0;

// Combo mode variables
let comboH1Candidates = [];
let comboH1Winner = null;
let comboH2Selected = [];
let comboH3Selected = [];
let comboH2Index = 0;
let comboH3Index = 0;
let currentH2CarouselIndex = 0;
let comboH1Index = 0;

// Preload queue
let preloadQueue = [];

// Session persistence
const SESSION_KEY = 'fontser_session';

// Sample texts
const sampleTexts = {
    latin: [
        'The Quick Brown Fox Jumps Over The Lazy Dog',
        'Pack my box with five dozen liquor jugs',
        'How vexingly quick daft zebras jump',
        'Sphinx of black quartz, judge my vow'
    ],
    cyrillic: [
        'Жебракують філософи при ґанку церкви в Гадячі',
        'Чуєш їх, доцю, га? Кумедна ж ти, príліжна й ґречна!',
        'Ех, яструб цей, фахівець із ґудзиків, чином вище за два жа',
        'Юнкерський джинс із футболки – ґешефт, хоч це й не ПВХ'
    ]
};

// ========================================
// UTILITY FUNCTIONS
// ========================================

function saveSession() {
    const session = {
        selectedMode,
        selectedLanguages,
        requireBothLanguages,
        selectedCategories,
        swipeFavorites,
        seenFonts,
        swipeIndex,
        isInGame: document.getElementById('game-screen').classList.contains('active'), // Новое!
        timestamp: Date.now()
    };
    localStorage.setItem(SESSION_KEY, JSON.stringify(session));
}

function loadSession() {
    try {
        const saved = localStorage.getItem(SESSION_KEY);
        if (!saved) return false;
        
        const session = JSON.parse(saved);
        
        // Проверяем что сессия не старше 24 часов
        const hoursPassed = (Date.now() - session.timestamp) / (1000 * 60 * 60);
        if (hoursPassed > 24) {
            localStorage.removeItem(SESSION_KEY);
            return false;
        }
        
        // Восстанавливаем состояние
        selectedMode = session.selectedMode;
        selectedLanguages = session.selectedLanguages || ['latin', 'cyrillic'];
        requireBothLanguages = session.requireBothLanguages || false;
        selectedCategories = session.selectedCategories || ['serif', 'sans-serif', 'display', 'handwriting', 'monospace'];
        swipeFavorites = session.swipeFavorites || [];
        seenFonts = session.seenFonts || [];
        swipeIndex = session.swipeIndex || 0;
        
        return true;
    } catch (e) {
        console.error('Failed to load session:', e);
        return false;
    }
}

function clearSession() {
    localStorage.removeItem(SESSION_KEY);
}

function clearSessionAndReload() {
    if (confirm('Are you sure? This will clear all your progress and favorites.')) {
        clearSession();
        location.reload();
    }
}

function getSampleTextForFont(font) {
    const subsets = font.subsets || [];
    const hasLatin = subsets.includes('latin');
    const hasCyrillic = subsets.includes('cyrillic');
    let samples = [];

    if (requireBothLanguages) {
        // Если требуются оба языка, показываем только если оба есть
        if (hasLatin && hasCyrillic) {
            samples.push(sampleTexts.latin[Math.floor(Math.random() * sampleTexts.latin.length)]);
            samples.push(sampleTexts.cyrillic[Math.floor(Math.random() * sampleTexts.cyrillic.length)]);
        } else if (hasLatin) {
            // Только латиница
            samples.push(sampleTexts.latin[Math.floor(Math.random() * sampleTexts.latin.length)]);
        } else if (hasCyrillic) {
            // Только кириллица
            samples.push(sampleTexts.cyrillic[Math.floor(Math.random() * sampleTexts.cyrillic.length)]);
        }
    } else {
        // Показываем только те языки, которые реально поддерживаются
        if (selectedLanguages.includes('latin') && hasLatin) {
            samples.push(sampleTexts.latin[Math.floor(Math.random() * sampleTexts.latin.length)]);
        }
        if (selectedLanguages.includes('cyrillic') && hasCyrillic) {
            samples.push(sampleTexts.cyrillic[Math.floor(Math.random() * sampleTexts.cyrillic.length)]);
        }
        
        // Если ни один выбранный язык не поддерживается, показываем AaBbCc
        if (samples.length === 0) {
            return 'AaBbCc 123';
        }
    }

    return samples.length > 0 ? samples.join('<br><br>') : 'AaBbCc 123';
}

function getSampleText() {
    let samples = [];
    
    if (requireBothLanguages) {
        const latinText = sampleTexts.latin[Math.floor(Math.random() * sampleTexts.latin.length)];
        const cyrillicText = sampleTexts.cyrillic[Math.floor(Math.random() * sampleTexts.cyrillic.length)];
        return `${latinText}<br>${cyrillicText}`;
    }
    
    if (selectedLanguages.includes('latin')) {
        samples.push(sampleTexts.latin[Math.floor(Math.random() * sampleTexts.latin.length)]);
    }
    if (selectedLanguages.includes('cyrillic')) {
        samples.push(sampleTexts.cyrillic[Math.floor(Math.random() * sampleTexts.cyrillic.length)]);
    }
    
    return samples.join('<br>');
}

function shuffleArray(array) {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
}

function getCategoryName(category) {
    const names = {
        'serif': 'Serif',
        'sans-serif': 'Sans Serif',
        'display': 'Display',
        'handwriting': 'Handwriting',
        'monospace': 'Monospace'
    };
    return names[category] || category;
}

function showToast(message, duration = 2500) {
    const existingToast = document.querySelector('.toast');
    if (existingToast) existingToast.remove();
    
    const toast = document.createElement('div');
    toast.className = 'toast';
    toast.textContent = message;
    document.body.appendChild(toast);
    
    setTimeout(() => toast.classList.add('show'), 10);
    
    setTimeout(() => {
        toast.classList.remove('show');
        setTimeout(() => toast.remove(), 300);
    }, duration);
}

function shakButton() {
    const btn = document.getElementById('btnStart');
    btn.classList.add('shake');
    setTimeout(() => btn.classList.remove('shake'), 500);
}

// ========================================
// SETUP SCREEN FUNCTIONS
// ========================================

function selectMode(mode) {
    selectedMode = mode;
    document.querySelectorAll('.option-card').forEach(card => card.classList.remove('selected'));
    event.target.closest('.option-card').classList.add('selected');
}

function toggleLang(lang) {
    const checkbox = document.getElementById(lang);
    const option = event.currentTarget;
    
    checkbox.checked = !checkbox.checked;
    option.classList.toggle('selected', checkbox.checked);
    
    if (lang === 'both' && checkbox.checked) {
        document.getElementById('latin').checked = false;
        document.getElementById('cyrillic').checked = false;
        document.querySelector('[onclick*="toggleLang(\'latin\')"]').classList.remove('selected');
        document.querySelector('[onclick*="toggleLang(\'cyrillic\')"]').classList.remove('selected');
    } else if ((lang === 'latin' || lang === 'cyrillic') && checkbox.checked) {
        document.getElementById('both').checked = false;
        document.querySelector('[onclick*="toggleLang(\'both\')"]').classList.remove('selected');
    }
    
    updateLanguageSelection();
}

function updateLanguageSelection() {
    selectedLanguages = [];
    requireBothLanguages = false;
    
    if (document.getElementById('both').checked) {
        requireBothLanguages = true;
        selectedLanguages = ['latin', 'cyrillic'];
    } else {
        if (document.getElementById('latin').checked) selectedLanguages.push('latin');
        if (document.getElementById('cyrillic').checked) selectedLanguages.push('cyrillic');
    }
}

function toggleCategory(category) {
    const checkbox = document.getElementById(category);
    const option = event.currentTarget;
    
    checkbox.checked = !checkbox.checked;
    option.classList.toggle('selected', checkbox.checked);
    
    selectedCategories = [];
    ['serif', 'sans-serif', 'display', 'handwriting', 'monospace'].forEach(cat => {
        if (document.getElementById(cat).checked) {
            selectedCategories.push(cat);
        }
    });
}

function startGame() {
    if (!selectedMode) {
        showToast('⚠️ Please select a mode first!');
        shakButton();
        return;
    }
    
    if (selectedLanguages.length === 0 && !requireBothLanguages) {
        showToast('⚠️ Please select at least one language!');
        shakButton();
        return;
    }
    
    if (selectedCategories.length === 0) {
        showToast('⚠️ Please select at least one font category!');
        shakButton();
        return;
    }
    
    document.getElementById('setup-screen').style.display = 'none';
    document.getElementById('game-screen').classList.add('active');
    
    // Скроллим вверх к игровому контенту
    window.scrollTo({ top: 0, behavior: 'smooth' });
    
    const titles = {
        'swipe': '<span>💘</span><span>Swipe Mode</span>',
        'tournament': '<span>🏆</span><span>Tournament Mode</span>',
        'combo': '<span>🎯</span><span>Combo Mode</span>'
    };
    
    document.getElementById('gameTitle').innerHTML = titles[selectedMode];
    loadGoogleFonts();
}

function backToSetup() {
    document.getElementById('setup-screen').style.display = 'block';
    document.getElementById('game-screen').classList.remove('active');
    document.removeEventListener('keydown', handleKeyboardShortcuts);
    
    // Не сбрасываем состояние полностью, только текущий режим
    // swipeIndex = 0;
    // swipeFavorites = [];
    // seenFonts = [];
    tournamentFonts = [];
    tournamentRound = 0;
    comboH1Candidates = [];
    comboH1Winner = null;
    comboH2Selected = [];
    comboH3Selected = [];
    
    saveSession();
}

// ========================================
// FONT LOADING
// ========================================

async function loadGoogleFonts() {
    document.getElementById('gameContent').innerHTML = '<div class="loading">⏳ Loading fonts...</div>';
    
    try {
        const response = await fetch(`https://www.googleapis.com/webfonts/v1/webfonts?key=${API_KEY}&sort=popularity`);
        
        if (!response.ok) throw new Error(`API Error: ${response.status}`);
        
        const data = await response.json();
        console.log(`Total fonts: ${data.items.length}`);
        
        allFonts = data.items.filter(font => {
            if (!selectedCategories.includes(font.category)) return false;
            
            const subsets = font.subsets || [];
            const hasLatin = subsets.includes('latin');
            const hasCyrillic = subsets.includes('cyrillic');
            
            if (requireBothLanguages) {
                return hasLatin && hasCyrillic;
            } else {
                const needLatin = selectedLanguages.includes('latin');
                const needCyrillic = selectedLanguages.includes('cyrillic');
                
                if (needLatin && needCyrillic) return hasLatin || hasCyrillic;
                else if (needLatin) return hasLatin;
                else if (needCyrillic) return hasCyrillic;
            }
            return false;
        }).map(font => ({
            family: font.family,
            category: font.category,
            subsets: font.subsets
        }));
        
        const iconFonts = ['Material Icons', 'Material Symbols', 'Noto Emoji', 'Icons', 'Font Awesome'];
        allFonts = allFonts.filter(font => !iconFonts.some(icon => font.family.includes(icon)));
        
        shuffleArray(allFonts);
        filteredFonts = [...allFonts];
        seenFonts = [];
        
        if (allFonts.length === 0) {
            document.getElementById('gameContent').innerHTML = '<div class="empty-state">❌ No fonts found. Try different options.</div>';
            return;
        }
        
        // Предзагружаем больше шрифтов для плавности
        console.log('🚀 Preloading first 15 fonts...');
        const preloadPromises = allFonts.slice(0, 15).map(font => {
            loadSingleFont(font.family);
            return waitForFont(font.family);
        });
        
        // Ждём только первые 3 шрифта
        await Promise.all(preloadPromises.slice(0, 3));
        console.log('✅ First 3 fonts ready!');
        
        if (selectedMode === 'swipe') startSwipeMode();
        else if (selectedMode === 'tournament') startTournamentMode();
        else if (selectedMode === 'combo') startComboMode();
        
    } catch (error) {
        console.error('Error:', error);
        document.getElementById('gameContent').innerHTML = '<div class="empty-state">❌ Error loading fonts.</div>';
    }
}

function loadSingleFont(fontFamily) {
    if (document.querySelector(`link[data-font="${fontFamily}"]`)) return;
    
    const link = document.createElement('link');
    link.href = `https://fonts.googleapis.com/css2?family=${fontFamily.replace(/ /g, '+')}:wght@400;700&display=swap`;
    link.rel = 'stylesheet';
    link.setAttribute('data-font', fontFamily);
    document.head.appendChild(link);
}

async function waitForFont(fontFamily) {
    loadSingleFont(fontFamily);
    if (!document.fonts) return new Promise(resolve => setTimeout(resolve, 50));
    
    try {
        await Promise.race([
            document.fonts.load(`16px "${fontFamily}"`),
            new Promise(resolve => setTimeout(resolve, 800))
        ]);
        return document.fonts.check(`16px "${fontFamily}"`);
    } catch (error) {
        return false;
    }
}

function getNextFont() {
    const unseenFonts = filteredFonts.filter(font => !seenFonts.includes(font.family));
    
    if (unseenFonts.length === 0) {
        showToast("🎉 You've seen all fonts! Starting over...", 3000);
        seenFonts = [];
        preloadQueue = [];
        return filteredFonts[0];
    }
    
    return unseenFonts[0];
}

// ========================================
// SWIPE MODE
// ========================================

function startSwipeMode() {
    document.getElementById('gameContent').innerHTML = `
        <div class="keyboard-hint">💡 Tip: Use <kbd>←</kbd> <kbd>→</kbd> arrow keys</div>
        <div class="card-container">
            <div class="card-loading" id="cardLoading">⏳ Loading font...</div>
            <div class="swipe-feedback" id="swipeFeedback">❤️</div>
            <div class="card" id="swipeCard" style="z-index:2;opacity:0;">
                <span class="font-category" id="fontCategory">Sans Serif</span>
                <div class="font-name" id="fontName">Roboto</div>
                <div class="font-preview-large" id="fontPreview">AaBbCc</div>
                <div class="sample-text"><p id="sampleText"></p></div>
            </div>
            <div class="card" id="nextCard" style="transform:scale(0.95);z-index:1;opacity:1;pointer-events:none;">
                <span class="font-category" id="nextFontCategory">Sans Serif</span>
                <div class="font-name" id="nextFontName">Loading...</div>
                <div class="font-preview-large" id="nextFontPreview">AaBbCc</div>
                <div class="sample-text"><p id="nextSampleText"></p></div>
            </div>
        </div>
        <div class="buttons">
            <button class="btn btn-dislike" onclick="swipeDislike()" title="Dislike">✕</button>
            <button class="btn btn-like" onclick="swipeLike()" title="Like">♥</button>
        </div>
    `;
    loadSwipeFont();
    updateSwipeFavorites();
    setupSwipeGestures();
    setupKeyboardShortcuts();
    
    // Готовим следующую карточку после загрузки первой
    setTimeout(() => {
        preloadNextFont();
    }, 500);
    
    // Скрываем подсказку через 5 секунд
    setTimeout(() => {
        const hint = document.querySelector('.keyboard-hint');
        if (hint) {
            hint.style.opacity = '0';
            setTimeout(() => hint.remove(), 300);
        }
    }, 5000);
}

function setupSwipeGestures() {
    const card = document.getElementById('swipeCard');
    if (!card) return;
    
    let startX = 0, currentX = 0, isDragging = false, hasMoved = false;
    let longPressTimer = null;
    let longPressTriggered = false;
    let progressIndicator = null;
    
    const onStart = (e) => {
        if (e.target.closest('.btn')) return;
        isDragging = true;
        hasMoved = false;
        longPressTriggered = false;
        startX = e.type.includes('mouse') ? e.clientX : e.touches[0].clientX;
        card.style.transition = 'none';
        card.classList.add('dragging');
        
        // Создаём визуальный индикатор прогресса
        progressIndicator = document.createElement('div');
        progressIndicator.style.cssText = `
            position: absolute;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            width: 80px;
            height: 80px;
            border-radius: 50%;
            border: 4px solid rgba(102, 126, 234, 0.3);
            border-top-color: var(--primary);
            z-index: 1000;
            pointer-events: none;
            animation: spin 1s linear;
            opacity: 0;
            transition: opacity 0.2s ease;
        `;
        card.appendChild(progressIndicator);
        
        // Показываем индикатор после 200мс (чтобы не мигал при быстром тапе)
        setTimeout(() => {
            if (progressIndicator && !hasMoved && isDragging) {
                progressIndicator.style.opacity = '1';
            }
        }, 200);
        
        // Запускаем таймер долгого нажатия (1 секунда)
        longPressTimer = setTimeout(() => {
            if (isDragging && !hasMoved) {
                longPressTriggered = true;
                if (progressIndicator) progressIndicator.remove();
                openFontDetails();
                // Вибрация если доступна
                if (navigator.vibrate) {
                    navigator.vibrate(50);
                }
            }
        }, 1000);
    };
    
    const onMove = (e) => {
        if (!isDragging) return;
        currentX = e.type.includes('mouse') ? e.clientX : e.touches[0].clientX;
        const deltaX = currentX - startX;
        
        if (Math.abs(deltaX) > 5) {
            hasMoved = true;
            // Отменяем долгое нажатие если начали свайпить
            if (longPressTimer) {
                clearTimeout(longPressTimer);
                longPressTimer = null;
            }
            if (progressIndicator) {
                progressIndicator.remove();
                progressIndicator = null;
            }
            e.preventDefault();
            card.style.transform = `translateX(${deltaX}px) rotate(${deltaX / 20}deg)`;
            card.style.opacity = 1 - Math.abs(deltaX) / 500;
        }
    };
    
    const onEnd = () => {
        if (!isDragging) return;
        isDragging = false;
        card.classList.remove('dragging');
        
        // Очищаем таймер и индикатор
        if (longPressTimer) {
            clearTimeout(longPressTimer);
            longPressTimer = null;
        }
        if (progressIndicator) {
            progressIndicator.remove();
            progressIndicator = null;
        }
        
        // Если было долгое нажатие, не делаем ничего
        if (longPressTriggered) {
            card.style.transition = 'transform 0.3s ease, opacity 0.3s ease';
            card.style.transform = '';
            card.style.opacity = 1;
            return;
        }
        
        if (!hasMoved) return;
        
        const deltaX = currentX - startX;
        
        if (Math.abs(deltaX) > 100) {
            deltaX > 0 ? swipeLike() : swipeDislike();
        } else {
            card.style.transition = 'transform 0.5s ease, opacity 0.3s ease';
            card.style.transform = '';
            card.style.opacity = 1;
        }
    };
    
    card.addEventListener('mousedown', onStart);
    card.addEventListener('touchstart', onStart, { passive: true });
    document.addEventListener('mousemove', onMove);
    document.addEventListener('touchmove', onMove, { passive: false });
    document.addEventListener('mouseup', onEnd);
    document.addEventListener('touchend', onEnd);
}

function openFontDetails() {
    if (!currentFont) {
        console.error('No current font available');
        return;
    }
    
    const font = currentFont;
    const googleFontsUrl = `https://fonts.google.com/specimen/${font.family.replace(/ /g, '+')}`;
    
    // Показываем модальное окно с подтверждением
    const modal = document.createElement('div');
    modal.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(0, 0, 0, 0.8);
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 10000;
        animation: fadeIn 0.3s ease;
    `;
    
    modal.innerHTML = `
        <div style="background: white; padding: 36px; border-radius: 24px; max-width: 400px; text-align: center; animation: slideDown 0.3s ease;">
            <h3 style="color: var(--primary); margin-bottom: 16px; font-size: 1.5em;">View font details?</h3>
            <p style="color: #666; margin-bottom: 24px; line-height: 1.6;">Open <strong>${font.family}</strong> on Google Fonts to see more details, download, and explore variants.</p>
            <div style="display: flex; gap: 12px; justify-content: center;">
                <button id="modalCancel" style="padding: 14px 32px; border-radius: 12px; border: 2px solid #ddd; background: white; color: #666; font-weight: 600; cursor: pointer; font-size: 1em;">Cancel</button>
                <button id="modalOpen" style="padding: 14px 32px; border-radius: 12px; border: none; background: var(--bg-gradient); color: white; font-weight: 600; cursor: pointer; font-size: 1em; box-shadow: 0 4px 12px rgba(102, 126, 234, 0.3);">Open</button>
            </div>
        </div>
    `;
    
    document.body.appendChild(modal);
    
    // Обработчики событий
    document.getElementById('modalCancel').addEventListener('click', () => modal.remove());
    document.getElementById('modalOpen').addEventListener('click', () => {
        window.open(googleFontsUrl, '_blank');
        modal.remove();
    });
    
    // Закрытие по клику вне модалки
    modal.addEventListener('click', (e) => {
        if (e.target === modal) {
            modal.remove();
        }
    });
    
    showToast('💡 Long press detected!', 2000);
}

function setupKeyboardShortcuts() {
    document.addEventListener('keydown', handleKeyboardShortcuts);
}

function handleKeyboardShortcuts(e) {
    if (selectedMode !== 'swipe') return;
    if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;
    
    if (e.key === 'ArrowLeft') {
        e.preventDefault();
        swipeDislike();
    } else if (e.key === 'ArrowRight') {
        e.preventDefault();
        swipeLike();
    }
}

async function loadSwipeFont() {
    if (filteredFonts.length === 0) return;
    
    const font = getNextFont();
    currentFont = font;
    
    const card = document.getElementById('swipeCard');
    const preview = document.getElementById('fontPreview');
    const sampleText = document.getElementById('sampleText');
    const loading = document.getElementById('cardLoading');
    
    if (!card || !preview) return;
    
    // Сразу применяем шрифт без ожидания
    const fontFamily = `"${font.family}", sans-serif`;
    
    document.getElementById('fontCategory').textContent = getCategoryName(font.category);
    document.getElementById('fontName').textContent = font.family;
    preview.textContent = 'AaBbCc';
    
    // Получаем правильный пример текста для этого шрифта
    sampleText.innerHTML = getSampleTextForFont(font);
    
    // Применяем шрифт немедленно
    card.style.fontFamily = fontFamily;
    preview.style.fontFamily = fontFamily;
    sampleText.style.fontFamily = fontFamily;
    card.style.setProperty('--current-font', `"${font.family}"`);
    
    // Показываем карточку сразу
    if (loading) loading.style.display = 'none';
    card.style.opacity = '1';
    
    // Загружаем шрифт в фоне
    waitForFont(font.family).then(loaded => {
        if (loaded) {
            console.log('✅ Font loaded:', font.family);
        }
    });
}

function preloadNextFont() {
    const currentIndex = filteredFonts.findIndex(f => f.family === getNextFont().family);
    
    for (let i = 1; i <= 3; i++) {
        const nextIndex = (currentIndex + i) % filteredFonts.length;
        const font = filteredFonts[nextIndex];
        if (font && !preloadQueue.includes(font.family)) {
            preloadQueue.push(font.family);
            loadSingleFont(font.family);
        }
    }
    
    const unseenFonts = filteredFonts.filter(f => !seenFonts.includes(f.family));
    if (unseenFonts.length < 2) return;
    
    const nextFont = unseenFonts[1];
    if (!nextFont) return;
    
    return waitForFont(nextFont.family).then(loaded => {
        const nextCard = document.getElementById('nextCard');
        if (nextCard && loaded) {
            nextCard.style.setProperty('--current-font', `"${nextFont.family}"`);
            const nextPreview = document.getElementById('nextFontPreview');
            const nextSample = document.getElementById('nextSampleText');
            
            if (nextPreview && nextSample) {
                nextPreview.style.fontFamily = `"${nextFont.family}", sans-serif`;
                nextSample.style.fontFamily = `"${nextFont.family}", sans-serif`;
                document.getElementById('nextFontCategory').textContent = getCategoryName(nextFont.category);
                document.getElementById('nextFontName').textContent = nextFont.family;
                nextPreview.textContent = 'AaBbCc';
                nextSample.innerHTML = getSampleTextForFont(nextFont);
            }
        }
    });
}

function swipeLike() {
    const font = getNextFont();
    seenFonts.push(font.family);
    
    if (!swipeFavorites.find(f => f.family === font.family)) {
        swipeFavorites.push(font);
        addToFavorites(font);
        saveSession();
    }
    
    showSwipeFeedback('right');
    animateSwipe('right');
}

function swipeDislike() {
    const font = getNextFont();
    seenFonts.push(font.family);
    showSwipeFeedback('left');
    saveSession();
    animateSwipe('left');
}

function showSwipeFeedback(direction) {
    const feedbackLeft = document.getElementById('swipeFeedbackLeft');
    const feedbackRight = document.getElementById('swipeFeedbackRight');
    
    console.log('Feedback elements:', feedbackLeft, feedbackRight, 'Direction:', direction);
    
    if (direction === 'left' && feedbackLeft) {
        feedbackLeft.classList.add('show');
        console.log('Showing left feedback');
        setTimeout(() => {
            feedbackLeft.classList.remove('show');
        }, 500);
    } else if (direction === 'right' && feedbackRight) {
        feedbackRight.classList.add('show');
        console.log('Showing right feedback');
        setTimeout(() => {
            feedbackRight.classList.remove('show');
        }, 500);
    }
}

function animateSwipe(direction) {
    const currentCard = document.getElementById('swipeCard');
    const nextCard = document.getElementById('nextCard');
    
    if (!currentCard) return;
    
    // Убираем все предыдущие классы
    currentCard.classList.remove('swiped-left', 'swiped-right', 'dragging');
    
    // Сбрасываем любые inline стили от драга
    currentCard.style.transform = '';
    currentCard.style.opacity = '1';
    
    // Применяем правильную анимацию через короткий timeout
    requestAnimationFrame(() => {
        requestAnimationFrame(() => {
            currentCard.style.transition = 'transform 0.5s cubic-bezier(0.4, 0, 0.2, 1), opacity 0.5s ease';
            
            if (direction === 'right') {
                currentCard.style.transform = 'translateX(150%) rotate(25deg)';
                currentCard.style.opacity = '0';
            } else {
                currentCard.style.transform = 'translateX(-150%) rotate(-25deg)';
                currentCard.style.opacity = '0';
            }
        });
    });
    
    if (nextCard) {
        nextCard.style.transition = 'transform 0.4s ease-out, opacity 0.4s ease-out';
        nextCard.style.transform = 'scale(1)';
        nextCard.style.opacity = '1';
        nextCard.style.zIndex = '2';
        nextCard.style.pointerEvents = 'auto';
    }
    
    setTimeout(async () => {
        if (nextCard) {
            nextCard.id = 'swipeCard';
            nextCard.classList.remove('swiped-left', 'swiped-right');
            
            const container = document.querySelector('.card-container');
            const newNextCard = document.createElement('div');
            newNextCard.className = 'card';
            newNextCard.id = 'nextCard';
            newNextCard.style.cssText = 'transform:scale(0.95);z-index:1;opacity:1;pointer-events:none';
            newNextCard.innerHTML = `
                <span class="font-category" id="nextFontCategory">Sans Serif</span>
                <div class="font-name" id="nextFontName">Loading...</div>
                <div class="font-preview-large" id="nextFontPreview">AaBbCc</div>
                <div class="sample-text"><p id="nextSampleText"></p></div>
            `;
            container.appendChild(newNextCard);
        }
        
        if (currentCard) currentCard.remove();
        setupSwipeGestures();
        
        // ВАЖНО: Сразу готовим следующую карточку
        await preloadNextFont();
    }, 500);
}

function updateSwipeFavorites() {
    const favList = document.getElementById('favoritesList');
    const favTitle = document.getElementById('favoritesTitle');
    
    if (swipeFavorites.length === 0) {
        favList.innerHTML = '<div class="empty-state">No favorites yet. Start choosing fonts!</div>';
        if (favTitle) favTitle.textContent = '❤️ Favorites';
    } else {
        favList.innerHTML = '';
        swipeFavorites.forEach((font, i) => {
            const item = document.createElement('div');
            item.className = 'favorite-item';
            item.textContent = font.family;
            
            // Применяем только font-family
            item.style.fontFamily = `'${font.family}', sans-serif`;
            
            // Долгое нажатие для удаления
            let longPressTimer = null;
            let longPressTriggered = false;
            
            item.addEventListener('mousedown', (e) => {
                longPressTriggered = false;
                longPressTimer = setTimeout(() => {
                    longPressTriggered = true;
                    if (confirm(`Remove "${font.family}" from favorites?`)) {
                        removeFontFromFavorites(font);
                    }
                }, 1000);
            });
            
            item.addEventListener('touchstart', (e) => {
                longPressTriggered = false;
                longPressTimer = setTimeout(() => {
                    longPressTriggered = true;
                    if (confirm(`Remove "${font.family}" from favorites?`)) {
                        removeFontFromFavorites(font);
                    }
                }, 1000);
            }, { passive: true });
            
            item.addEventListener('mouseup', () => {
                if (longPressTimer) clearTimeout(longPressTimer);
            });
            
            item.addEventListener('touchend', () => {
                if (longPressTimer) clearTimeout(longPressTimer);
            });
            
            item.addEventListener('mouseleave', () => {
                if (longPressTimer) clearTimeout(longPressTimer);
            });
            
            // Клик для открытия деталей
            item.addEventListener('click', () => {
                if (!longPressTriggered) {
                    openFontDetailsModal(font);
                }
            });
            
            favList.appendChild(item);
        });
        
        if (favTitle) {
            favTitle.textContent = `❤️ Favorites (${swipeFavorites.length})`;
        }
    }
}

function addToFavorites(font) {
    const favList = document.getElementById('favoritesList');
    
    // Удаляем empty state если есть
    const emptyState = favList.querySelector('.empty-state');
    if (emptyState) {
        emptyState.remove();
    }
    
    // Создаём новый элемент
    const item = document.createElement('div');
    item.className = 'favorite-item';
    item.style.fontFamily = `'${font.family}'`;
    item.style.animation = 'fadeIn 0.4s ease both';
    item.textContent = font.family;
    item.style.cursor = 'pointer';
    
    // Добавляем клик для открытия деталей
    item.addEventListener('click', () => {
        openFontDetailsModal(font);
    });
    
    // Добавляем в конец списка
    favList.appendChild(item);
    
    // Обновляем заголовок
    const favTitle = document.getElementById('favoritesTitle');
    if (favTitle) {
        favTitle.textContent = `❤️ Favorites (${swipeFavorites.length})`;
    }
}

function openFontDetailsModal(font) {
    const googleFontsUrl = `https://fonts.google.com/specimen/${font.family.replace(/ /g, '+')}`;
    
    const modal = document.createElement('div');
    modal.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(0, 0, 0, 0.8);
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 10000;
        animation: fadeIn 0.3s ease;
    `;
    
    modal.innerHTML = `
        <div style="background: white; padding: 36px; border-radius: 24px; max-width: 400px; width: 90%; text-align: center; animation: slideDown 0.3s ease;">
            <h3 style="color: var(--primary); margin-bottom: 16px; font-size: 1.5em;">View font details?</h3>
            <p style="color: #666; margin-bottom: 24px; line-height: 1.6;">Open <strong style="font-family: '${font.family}', sans-serif;">${font.family}</strong> on Google Fonts to see more details, download, and explore variants.</p>
            <div style="display: flex; gap: 12px; justify-content: center; flex-wrap: wrap;">
                <button id="modalCancel" style="padding: 14px 32px; border-radius: 12px; border: 2px solid #ddd; background: white; color: #666; font-weight: 600; cursor: pointer; font-size: 1em;">Cancel</button>
                <button id="modalOpen" style="padding: 14px 32px; border-radius: 12px; border: none; background: var(--bg-gradient); color: white; font-weight: 600; cursor: pointer; font-size: 1em; box-shadow: 0 4px 12px rgba(102, 126, 234, 0.3);">Open Google Fonts</button>
            </div>
        </div>
    `;
    
    document.body.appendChild(modal);
    
    // Обработчики
    document.getElementById('modalCancel').addEventListener('click', () => modal.remove());
    document.getElementById('modalOpen').addEventListener('click', () => {
        window.open(googleFontsUrl, '_blank');
        modal.remove();
    });
    
    modal.addEventListener('click', (e) => {
        if (e.target === modal) modal.remove();
    });
}

// ========================================
// INITIALIZE ON PAGE LOAD
// ========================================

window.addEventListener('DOMContentLoaded', () => {
    // Пытаемся загрузить сохранённую сессию
    const hasSession = loadSession();
    
    if (hasSession) {
        console.log('Session restored!');
        // Показываем кнопку очистки сессии
        const btnClear = document.getElementById('btnClearSession');
        if (btnClear) btnClear.style.display = 'block';
        
        // Если есть избранные шрифты, показываем их
        if (swipeFavorites.length > 0) {
            updateSwipeFavorites();
        }
        
        // НОВОЕ: Проверяем была ли игра активна
        const saved = JSON.parse(localStorage.getItem(SESSION_KEY));
        if (saved && saved.isInGame && saved.selectedMode) {
            // Восстанавливаем игровой экран
            setTimeout(() => {
                document.getElementById('setup-screen').style.display = 'none';
                document.getElementById('game-screen').classList.add('active');
                
                const titles = {
                    'swipe': '<span>💘</span><span>Swipe Mode</span>',
                    'tournament': '<span>🏆</span><span>Tournament Mode</span>',
                    'combo': '<span>🎯</span><span>Combo Mode</span>'
                };
                
                document.getElementById('gameTitle').innerHTML = titles[saved.selectedMode];
                
                // Загружаем шрифты и режим
                loadGoogleFonts();
                
                showToast(`✨ Game restored! ${swipeFavorites.length} favorites, ${seenFonts.length} viewed`, 3500);
            }, 100);
        } else {
            // Просто показываем уведомление о прогрессе
            setTimeout(() => {
                showToast(`✨ Progress saved! ${swipeFavorites.length} favorites, ${seenFonts.length} viewed`, 3500);
            }, 500);
        }
    }
});