// ========================================
// TOURNAMENT MODE
// ========================================

function startTournamentMode() {
    if (swipeFavorites.length < 2) {
        document.getElementById('gameContent').innerHTML = `
            <div class="tournament-arena">
                <div class="empty-state">
                    <p style="font-size: 3em; margin-bottom: 20px;">🏆</p>
                    <p>First select at least 2 fonts in Swipe mode!</p>
                    <button class="btn-next" onclick="backToSetup()">Back to setup</button>
                </div>
            </div>
        `;
        return;
    }
    
    // НОВОЕ: Фильтруем избранные шрифты по выбранным языкам
    let filteredFavorites = swipeFavorites.filter(font => {
        const subsets = font.subsets || [];
        const hasLatin = subsets.includes('latin');
        const hasCyrillic = subsets.includes('cyrillic');
        
        if (requireBothLanguages) {
            return hasLatin && hasCyrillic;
        } else {
            const needLatin = selectedLanguages.includes('latin');
            const needCyrillic = selectedLanguages.includes('cyrillic');
            
            if (needLatin && needCyrillic) {
                return hasLatin || hasCyrillic;
            } else if (needLatin) {
                return hasLatin;
            } else if (needCyrillic) {
                return hasCyrillic;
            }
        }
        return false;
    });
    
    // Проверяем что после фильтрации осталось минимум 2 шрифта
    if (filteredFavorites.length < 2) {
        document.getElementById('gameContent').innerHTML = `
            <div class="tournament-arena">
                <div class="empty-state">
                    <p style="font-size: 3em; margin-bottom: 20px;">⚠️</p>
                    <p>Not enough fonts match your language settings!</p>
                    <p style="color: #666; margin: 16px 0;">You have ${swipeFavorites.length} favorites, but only ${filteredFavorites.length} support the selected languages.</p>
                    <button class="btn-next" onclick="backToSetup()">Back to setup</button>
                </div>
            </div>
        `;
        return;
    }
    
    tournamentFonts = [...filteredFavorites];
    tournamentRound = 1;
    shuffleArray(tournamentFonts);
    loadTournamentBattle();
}

function loadTournamentBattle() {
    if (tournamentFonts.length === 1) {
        showTournamentWinner();
        return;
    }
    
    const font1 = tournamentFonts[0];
    const font2 = tournamentFonts[1];
    const sample1 = getSampleTextForFont(font1);
    const sample2 = getSampleTextForFont(font2);
    
    document.getElementById('gameContent').innerHTML = `
        <div class="tournament-arena">
            <div class="tournament-info">Round ${tournamentRound} | ${tournamentFonts.length} fonts remaining</div>
            <div class="fighters">
                <div class="fighter" onclick="chooseFighter(0)">
                    <div class="fighter-name">${font1.family}</div>
                    <div class="fighter-preview" style="font-family:'${font1.family}'">AaBbCc</div>
                    <div class="sample-text" style="font-family:'${font1.family}';font-size:0.95em;line-height:1.6;">${sample1}</div>
                </div>
                <div class="fighter" onclick="chooseFighter(1)">
                    <div class="fighter-name">${font2.family}</div>
                    <div class="fighter-preview" style="font-family:'${font2.family}'">AaBbCc</div>
                    <div class="sample-text" style="font-family:'${font2.family}';font-size:0.95em;line-height:1.6;">${sample2}</div>
                </div>
            </div>
        </div>
    `;
}

function chooseFighter(index) {
    const winner = tournamentFonts[index];
    tournamentFonts.splice(0, 2);
    tournamentFonts.push(winner);
    tournamentRound++;
    setTimeout(loadTournamentBattle, 300);
}

function showTournamentWinner() {
    const winner = tournamentFonts[0];
    document.getElementById('gameContent').innerHTML = `
        <div class="tournament-arena">
            <div style="text-align:center;">
                <div style="font-size:4em;margin-bottom:20px;">🏆</div>
                <h2 style="color:var(--primary);margin-bottom:20px;font-size:2em;">Winner!</h2>
                <div style="font-family:'${winner.family}';font-size:3em;margin:30px 0;">${winner.family}</div>
                <p style="color:#666;margin-bottom:20px;">This font won all rounds!</p>
                <button class="btn-next" onclick="startTournamentMode()">New Tournament</button>
            </div>
        </div>
    `;
    
    document.getElementById('favoritesList').innerHTML = `
        <div class="favorite-item" style="font-family:'${winner.family}';grid-column:1/-1;font-size:1.5em;">🏆 ${winner.family}</div>
    `;
}

// ========================================
// COMBO MODE
// ========================================

function startComboMode() {
    comboH1Candidates = [];
    comboH1Winner = null;
    comboH2Selected = [];
    comboH3Selected = [];
    comboH2Index = 0;
    comboH3Index = 0;
    comboH1Index = 0;
    currentH2CarouselIndex = 0;
    renderComboPhase1();
}

function renderComboPhase1() {
    document.getElementById('gameContent').innerHTML = `
        <div class="combo-container">
            <div class="progress-steps">
                <div class="progress-step active">Step 1: H1</div>
                <div class="progress-step">Step 2: H2</div>
                <div class="progress-step">Step 3: H3</div>
                <div class="progress-step">Result</div>
            </div>
            <h3 style="text-align:center;color:var(--primary);margin-bottom:15px;font-size:1.3em;">Select up to 7 fonts for main heading (H1)</h3>
            <div class="combo-counter">Selected: <span id="comboH1Count">${comboH1Candidates.length}</span>/7</div>
            <div id="comboSwipeCard" style="padding:30px;background:#f8f9fa;border-radius:var(--radius-md);text-align:center;min-height:250px;cursor:grab;">
                <div class="font-name" id="comboH1Name" style="margin-bottom:20px;"></div>
                <div id="comboH1Preview" style="font-size:3em;margin:20px 0;font-weight:400;"></div>
                <div class="sample-text"><p id="comboH1Sample" style="font-family:inherit!important;"></p></div>
            </div>
        </div>
        <div class="buttons">
            <button class="btn btn-dislike" onclick="comboH1Dislike()">✕</button>
            <button class="btn btn-like" onclick="comboH1Like()">♥</button>
        </div>
        <button class="btn-next" id="btnSkipToTournament" onclick="startComboTournament()" ${comboH1Candidates.length < 2 ? 'disabled' : ''}>Proceed to tournament (min 2) →</button>
    `;
    loadComboH1Font();
    setupComboSwipeGestures('H1');
}

function setupComboSwipeGestures(phase) {
    const card = document.getElementById('comboSwipeCard');
    if (!card) return;
    
    let startX = 0, currentX = 0, isDragging = false, hasMoved = false;
    
    const onStart = (e) => {
        if (e.target.closest('.btn')) return;
        isDragging = true;
        hasMoved = false;
        startX = e.type.includes('mouse') ? e.clientX : e.touches[0].clientX;
        card.style.transition = 'none';
    };
    
    const onMove = (e) => {
        if (!isDragging) return;
        currentX = e.type.includes('mouse') ? e.clientX : e.touches[0].clientX;
        const deltaX = currentX - startX;
        
        if (Math.abs(deltaX) > 5) {
            hasMoved = true;
            e.preventDefault();
            card.style.transform = `translateX(${deltaX}px) rotate(${deltaX / 30}deg)`;
            card.style.opacity = 1 - Math.abs(deltaX) / 600;
        }
    };
    
    const onEnd = () => {
        if (!isDragging) return;
        isDragging = false;
        
        if (!hasMoved) {
            card.style.transition = 'transform 0.3s ease, opacity 0.3s ease';
            card.style.transform = '';
            card.style.opacity = 1;
            return;
        }
        
        const deltaX = currentX - startX;
        
        if (Math.abs(deltaX) > 100) {
            // Анимация свайпа
            card.style.transition = 'transform 0.4s ease, opacity 0.4s ease';
            card.style.transform = `translateX(${deltaX > 0 ? '100%' : '-100%'}) rotate(${deltaX > 0 ? '20deg' : '-20deg'})`;
            card.style.opacity = 0;
            
            setTimeout(() => {
                if (deltaX > 0) {
                    if (phase === 'H1') comboH1Like();
                    else if (phase === 'H2') comboH2Like();
                    else if (phase === 'H3') comboH3Like();
                } else {
                    if (phase === 'H1') comboH1Dislike();
                    else if (phase === 'H2') comboH2Dislike();
                    else if (phase === 'H3') comboH3Dislike();
                }
                
                // Сброс анимации
                card.style.transition = 'none';
                card.style.transform = '';
                card.style.opacity = 1;
            }, 400);
        } else {
            card.style.transition = 'transform 0.3s ease, opacity 0.3s ease';
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

function loadComboH1Font() {
    const h1Fonts = allFonts.filter(f => f.category === 'serif' || f.category === 'display');
    if (comboH1Index >= h1Fonts.length) comboH1Index = 0;
    
    const font = h1Fonts[comboH1Index];
    document.getElementById('comboH1Name').textContent = font.family;
    document.getElementById('comboH1Preview').style.fontFamily = font.family;
    document.getElementById('comboH1Preview').textContent = 'Main Heading';
    
    const sample = document.getElementById('comboH1Sample');
    sample.style.fontFamily = font.family;
    sample.innerHTML = getSampleText();
}

function comboH1Like() {
    if (comboH1Candidates.length >= 7) return;
    
    const h1Fonts = allFonts.filter(f => f.category === 'serif' || f.category === 'display');
    const font = h1Fonts[comboH1Index];
    
    if (!comboH1Candidates.find(f => f.family === font.family)) {
        comboH1Candidates.push(font);
    }
    
    comboH1Index++;
    
    // Автопереход если выбрано 7 шрифтов
    if (comboH1Candidates.length >= 7) {
        showToast('✨ 7 fonts selected! Starting tournament...', 2000);
        setTimeout(() => startComboTournament(), 1000);
    } else {
        renderComboPhase1();
    }
}

function comboH1Dislike() {
    comboH1Index++;
    loadComboH1Font();
}

function startComboTournament() {
    if (comboH1Candidates.length < 2) {
        alert('Select at least 2 fonts!');
        return;
    }
    
    let fighters = [...comboH1Candidates];
    let round = 1;
    
    window.chooseComboFighter = function(index) {
        const winner = fighters[index];
        fighters.splice(0, 2);
        fighters.push(winner);
        round++;
        setTimeout(loadComboTournamentBattle, 300);
    };
    
    function loadComboTournamentBattle() {
        if (fighters.length === 1) {
            comboH1Winner = fighters[0];
            renderComboPhase2();
            return;
        }
        
        const font1 = fighters[0];
        const font2 = fighters[1];
        
        document.getElementById('gameContent').innerHTML = `
            <div class="combo-container">
                <div class="progress-steps">
                    <div class="progress-step active">H1 Tournament</div>
                    <div class="progress-step">Step 2: H2</div>
                    <div class="progress-step">Step 3: H3</div>
                    <div class="progress-step">Result</div>
                </div>
                <div class="tournament-info">Round ${round} | ${fighters.length} fonts remaining</div>
                <div class="fighters">
                    <div class="fighter" onclick="chooseComboFighter(0)">
                        <div class="fighter-name">${font1.family}</div>
                        <div class="fighter-preview" style="font-family:'${font1.family}'">Heading</div>
                    </div>
                    <div class="fighter" onclick="chooseComboFighter(1)">
                        <div class="fighter-name">${font2.family}</div>
                        <div class="fighter-preview" style="font-family:'${font2.family}'">Heading</div>
                    </div>
                </div>
            </div>
        `;
    }
    
    loadComboTournamentBattle();
}

function renderComboPhase2() {
    document.getElementById('gameContent').innerHTML = `
        <div class="combo-container">
            <div class="progress-steps">
                <div class="progress-step completed">✓ H1</div>
                <div class="progress-step active">Step 2: H2</div>
                <div class="progress-step">Step 3: H3</div>
                <div class="progress-step">Result</div>
            </div>
            <div class="fixed-font">
                <div class="fixed-label">H1 (Fixed) ✓</div>
                <div style="font-weight:700;font-size:1.1em;">${comboH1Winner.family}</div>
            </div>
            <div id="comboSwipeCard" style="padding:20px;background:#fff5e6;border-radius:var(--radius-md);border-left:4px solid #ffa726;margin-bottom:15px;cursor:grab;">
                <div style="font-size:0.9em;color:#f57c00;font-weight:700;margin-bottom:10px;">H2 - Subheading (Selected: <span id="comboH2Count">${comboH2Selected.length}</span>/3)</div>
                <div class="font-name" id="comboH2Name"></div>
                <div id="comboH2Preview" style="font-size:2em;margin:15px 0;"></div>
                <div class="sample-text"><p id="comboH2Sample" style="font-family:inherit!important;font-size:0.9em;"></p></div>
            </div>
            <div class="preview-box">
                <h1 id="comboPreviewH1" style="font-family:'${comboH1Winner.family}'">Main Heading</h1>
                <h2 id="comboPreviewH2">Subheading here</h2>
            </div>
        </div>
        <div class="buttons">
            <button class="btn btn-dislike" onclick="comboH2Dislike()">✕</button>
            <button class="btn btn-like" onclick="comboH2Like()">♥</button>
        </div>
        <button class="btn-next" id="btnNextToH3" onclick="renderComboPhase3()" ${comboH2Selected.length === 0 ? 'disabled' : ''}>Next to H3 →</button>
    `;
    loadComboH2Font();
    setupComboSwipeGestures('H2');
}

function loadComboH2Font() {
    const h2Fonts = allFonts.filter(f => f.category === 'sans-serif');
    if (comboH2Index >= h2Fonts.length) comboH2Index = 0;
    
    const font = h2Fonts[comboH2Index];
    const fontFamily = `"${font.family}", sans-serif`;
    
    document.getElementById('comboH2Name').textContent = font.family;
    document.getElementById('comboH2Name').style.fontFamily = fontFamily;
    
    const preview = document.getElementById('comboH2Preview');
    preview.style.fontFamily = fontFamily;
    preview.textContent = 'Subheading';
    
    // Добавляем пример текста
    const sample = document.getElementById('comboH2Sample');
    if (sample) {
        sample.style.fontFamily = fontFamily;
        sample.innerHTML = getSampleText();
    }
    
    const previewH2 = document.getElementById('comboPreviewH2');
    if (previewH2) {
        previewH2.style.fontFamily = fontFamily;
        previewH2.textContent = 'Subheading here';
    }
}

function comboH2Like() {
    if (comboH2Selected.length >= 3) return;
    
    const h2Fonts = allFonts.filter(f => f.category === 'sans-serif');
    const font = h2Fonts[comboH2Index];
    
    if (!comboH2Selected.find(f => f.family === font.family)) {
        comboH2Selected.push(font);
    }
    
    comboH2Index++;
    
    // Автопереход если выбрано 3 шрифта
    if (comboH2Selected.length >= 3) {
        showToast('✨ 3 fonts selected! Moving to H3...', 2000);
        setTimeout(() => renderComboPhase3(), 1000);
    } else {
        renderComboPhase2();
    }
}

function comboH2Dislike() {
    comboH2Index++;
    loadComboH2Font();
}

function renderComboPhase3() {
    if (comboH2Selected.length === 0) {
        alert('Select at least 1 font for H2!');
        return;
    }
    
    currentH2CarouselIndex = 0;
    
    document.getElementById('gameContent').innerHTML = `
        <div class="combo-container">
            <div class="progress-steps">
                <div class="progress-step completed">✓ H1</div>
                <div class="progress-step completed">✓ H2</div>
                <div class="progress-step active">Step 3: H3</div>
                <div class="progress-step">Result</div>
            </div>
            <div class="fixed-font">
                <div class="fixed-label">H1 (Fixed) ✓</div>
                <div style="font-weight:700;font-size:1.1em;">${comboH1Winner.family}</div>
            </div>
            <div class="carousel">
                <div class="fixed-label">H2 (Browse selected)</div>
                <div style="font-weight:700;font-size:1.1em;margin:10px 0;" id="currentH2Display">${comboH2Selected[0].family}</div>
                <div class="carousel-controls">
                    <button class="carousel-btn" onclick="prevH2Carousel()" id="btnPrevH2">←</button>
                    <span id="h2CarouselCounter">1 / ${comboH2Selected.length}</span>
                    <button class="carousel-btn" onclick="nextH2Carousel()" id="btnNextH2">→</button>
                </div>
            </div>
            <div id="comboSwipeCard" style="padding:20px;background:#e8f5e9;border-radius:var(--radius-md);border-left:4px solid #4caf50;margin-bottom:15px;cursor:grab;">
                <div style="font-size:0.9em;color:#2e7d32;font-weight:700;margin-bottom:10px;">H3 - Body text (Selected: <span id="comboH3Count">${comboH3Selected.length}</span>/3)</div>
                <div class="font-name" id="comboH3Name"></div>
                <div id="comboH3Preview" style="font-size:1.3em;margin:15px 0;"></div>
                <div class="sample-text"><p id="comboH3Sample" style="font-family:inherit!important;font-size:0.9em;"></p></div>
            </div>
            <div class="preview-box">
                <h1 id="comboPreviewH1Final" style="font-family:'${comboH1Winner.family}'">Main Heading</h1>
                <h2 id="comboPreviewH2Final" style="font-family:'${comboH2Selected[0].family}'">Subheading here</h2>
                <h3 id="comboPreviewH3Final">Paragraph text level three</h3>
            </div>
        </div>
        <div class="buttons">
            <button class="btn btn-dislike" onclick="comboH3Dislike()">✕</button>
            <button class="btn btn-like" onclick="comboH3Like()">♥</button>
        </div>
        <button class="btn-next" id="btnShowResults" onclick="showComboResults()" ${comboH3Selected.length === 0 ? 'disabled' : ''}>Show results →</button>
    `;
    
    updateH2CarouselButtons();
    loadComboH3Font();
    setupComboSwipeGestures('H3');
}

function loadComboH3Font() {
    const h3Fonts = allFonts.filter(f => f.category === 'sans-serif');
    if (comboH3Index >= h3Fonts.length) comboH3Index = 0;
    
    const font = h3Fonts[comboH3Index];
    const fontFamily = `"${font.family}", sans-serif`;
    
    document.getElementById('comboH3Name').textContent = font.family;
    document.getElementById('comboH3Name').style.fontFamily = fontFamily;
    
    const preview = document.getElementById('comboH3Preview');
    preview.style.fontFamily = fontFamily;
    preview.textContent = 'Paragraph text';
    
    // Добавляем пример текста
    const sample = document.getElementById('comboH3Sample');
    if (sample) {
        sample.style.fontFamily = fontFamily;
        sample.innerHTML = getSampleText();
    }
    
    const previewH3 = document.getElementById('comboPreviewH3Final');
    if (previewH3) {
        previewH3.style.fontFamily = fontFamily;
        previewH3.textContent = 'Paragraph text level three';
    }
}

function comboH3Like() {
    if (comboH3Selected.length >= 3) return;
    
    const h3Fonts = allFonts.filter(f => f.category === 'sans-serif');
    const font = h3Fonts[comboH3Index];
    
    if (!comboH3Selected.find(f => f.family === font.family)) {
        comboH3Selected.push(font);
    }
    
    comboH3Index++;
    
    // Автопереход если выбрано 3 шрифта
    if (comboH3Selected.length >= 3) {
        showToast('🎉 All fonts selected! Generating combinations...', 2000);
        setTimeout(() => showComboResults(), 1000);
    } else {
        renderComboPhase3();
    }
}

function comboH3Dislike() {
    comboH3Index++;
    loadComboH3Font();
}

function prevH2Carousel() {
    if (currentH2CarouselIndex > 0) {
        currentH2CarouselIndex--;
        updateH2Carousel();
    }
}

function nextH2Carousel() {
    if (currentH2CarouselIndex < comboH2Selected.length - 1) {
        currentH2CarouselIndex++;
        updateH2Carousel();
    }
}

function updateH2Carousel() {
    const font = comboH2Selected[currentH2CarouselIndex];
    document.getElementById('currentH2Display').textContent = font.family;
    document.getElementById('h2CarouselCounter').textContent = `${currentH2CarouselIndex + 1} / ${comboH2Selected.length}`;
    document.getElementById('comboPreviewH2Final').style.fontFamily = font.family;
    updateH2CarouselButtons();
}

function updateH2CarouselButtons() {
    const btnPrev = document.getElementById('btnPrevH2');
    const btnNext = document.getElementById('btnNextH2');
    
    if (btnPrev) btnPrev.disabled = currentH2CarouselIndex === 0;
    if (btnNext) btnNext.disabled = currentH2CarouselIndex === comboH2Selected.length - 1;
}

function showComboResults() {
    if (comboH3Selected.length === 0) {
        alert('Select at least 1 font for H3!');
        return;
    }
    
    const totalCombos = comboH2Selected.length * comboH3Selected.length;
    let html = '<div class="results-grid">';
    let comboNum = 1;
    
    comboH2Selected.forEach(h2Font => {
        comboH3Selected.forEach(h3Font => {
            html += `
                <div class="result-card">
                    <h1 style="font-family:'${comboH1Winner.family}'">Main Heading</h1>
                    <h2 style="font-family:'${h2Font.family}'">Subheading here</h2>
                    <h3 style="font-family:'${h3Font.family}'">Paragraph text level three</h3>
                    <div class="result-meta">
                        <strong>Combination ${comboNum}:</strong><br>
                        H1: ${comboH1Winner.family}<br>
                        H2: ${h2Font.family}<br>
                        H3: ${h3Font.family}
                    </div>
                </div>
            `;
            comboNum++;
        });
    });
    
    html += '</div>';
    
    document.getElementById('gameContent').innerHTML = `
        <div class="combo-container">
            <div style="text-align:center;margin-bottom:30px;">
                <div style="font-size:4em;margin-bottom:20px;">🎉</div>
                <h2 style="color:var(--primary);margin-bottom:10px;font-size:2em;">Your combinations are ready!</h2>
                <p style="color:#666;font-size:1.1em;">Created ${totalCombos} unique combinations</p>
            </div>
            ${html}
            <button class="btn-next" onclick="startComboMode()">Start over</button>
        </div>
    `;
    
    document.getElementById('favoritesList').innerHTML = html;
}