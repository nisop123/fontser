// ========================================
// COMBO MODE - ПОЛНЫЙ КОД
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

function setupComboCardGestures(phase) {
    const card = document.getElementById('comboCard');
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
            card.style.transition = 'transform 0.3s ease';
            card.style.transform = '';
            card.style.opacity = 1;
            return;
        }
        
        const deltaX = currentX - startX;
        
        if (Math.abs(deltaX) > 100) {
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
                card.style.transition = 'none';
                card.style.transform = '';
                card.style.opacity = 1;
            }, 400);
        } else {
            card.style.transition = 'transform 0.3s ease';
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

// PHASE 1: H1
function renderComboPhase1() {
    document.getElementById('gameContent').innerHTML = `
        <div class="combo-container">
            <div class="progress-steps">
                <div class="progress-step active">Step 1: H1</div>
                <div class="progress-step">Step 2: H2</div>
                <div class="progress-step">Step 3: H3</div>
                <div class="progress-step">Result</div>
            </div>
            
            <h3 style="text-align:center;color:var(--primary);margin-bottom:8px;">Select main heading (H1)</h3>
            <div class="combo-counter">Selected: ${comboH1Candidates.length}/7</div>
            
            <div class="card-container">
                <div class="card" id="comboCard" style="z-index:2;opacity:1;">
                    <span class="font-category" id="fontCategory">Display</span>
                    <div class="font-name" id="fontName">Loading...</div>
                    <div class="font-preview-large" id="fontPreview">AaBbCc</div>
                    <div class="sample-text"><p id="sampleText"></p></div>
                </div>
            </div>
            
            <div class="combo-live-preview">
                <div class="preview-label">📱 Preview</div>
                <div class="preview-content">
                    <h1 id="liveH1">The Future of Design</h1>
                    <p style="color:#666;line-height:1.6;">Your heading creates the first impression.</p>
                </div>
            </div>
        </div>
        
        <div class="buttons">
            <button class="btn btn-dislike" onclick="comboH1Dislike()">✕</button>
            <button class="btn btn-like" onclick="comboH1Like()">♥</button>
        </div>
        <button class="btn-next" onclick="startComboTournament()" ${comboH1Candidates.length < 2 ? 'disabled' : ''}>Tournament →</button>
    `;
    loadComboH1Font();
    setupComboCardGestures('H1');
}

function loadComboH1Font() {
    const h1Fonts = allFonts.filter(f => f.category === 'serif' || f.category === 'display');
    if (comboH1Index >= h1Fonts.length) comboH1Index = 0;
    const font = h1Fonts[comboH1Index];
    const ff = `"${font.family}", sans-serif`;
    
    loadSingleFont(font.family);
    
    document.getElementById('fontCategory').textContent = getCategoryName(font.category);
    document.getElementById('fontName').textContent = font.family;
    document.getElementById('fontPreview').textContent = 'AaBbCc';
    document.getElementById('fontPreview').style.fontFamily = ff;
    document.getElementById('sampleText').innerHTML = getSampleTextForFont(font);
    document.getElementById('sampleText').style.fontFamily = ff;
    document.getElementById('liveH1').style.fontFamily = ff;
}

function comboH1Like() {
    if (comboH1Candidates.length >= 7) return;
    const h1Fonts = allFonts.filter(f => f.category === 'serif' || f.category === 'display');
    const font = h1Fonts[comboH1Index];
    if (!comboH1Candidates.find(f => f.family === font.family)) {
        comboH1Candidates.push(font);
    }
    comboH1Index++;
    
    if (comboH1Candidates.length >= 7) {
        showToast('✨ Starting tournament...', 2000);
        setTimeout(() => startComboTournament(), 1000);
    } else {
        renderComboPhase1();
    }
}

function comboH1Dislike() {
    comboH1Index++;
    renderComboPhase1();
}

// H1 TOURNAMENT
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
        setTimeout(loadBattle, 300);
    };
    
    function loadBattle() {
        if (fighters.length === 1) {
            comboH1Winner = fighters[0];
            renderComboPhase2();
            return;
        }
        
        const f1 = fighters[0], f2 = fighters[1];
        
        document.getElementById('gameContent').innerHTML = `
            <div class="combo-container">
                <div class="tournament-info">Round ${round} | ${fighters.length} left</div>
                <div class="fighters">
                    <div class="fighter" onclick="chooseComboFighter(0)">
                        <div class="fighter-name">${f1.family}</div>
                        <h1 style="font-family:'${f1.family}';font-size:2.5em;margin:20px;">Future</h1>
                    </div>
                    <div class="fighter" onclick="chooseComboFighter(1)">
                        <div class="fighter-name">${f2.family}</div>
                        <h1 style="font-family:'${f2.family}';font-size:2.5em;margin:20px;">Future</h1>
                    </div>
                </div>
            </div>
        `;
    }
    
    loadBattle();
}

// PHASE 2: H2
function renderComboPhase2() {
    comboH2Index = 0;
    
    document.getElementById('gameContent').innerHTML = `
        <div class="combo-container">
            <div class="progress-steps">
                <div class="progress-step completed">✓</div>
                <div class="progress-step active">H2</div>
                <div class="progress-step">H3</div>
                <div class="progress-step">Result</div>
            </div>
            
            <div class="selected-font-compact">
                <span class="selected-label">H1</span>
                <span class="selected-name" style="font-family:'${comboH1Winner.family}'">${comboH1Winner.family}</span>
            </div>
            
            <h3 style="text-align:center;color:var(--primary);margin-bottom:8px;">Select subheading (H2)</h3>
            <div class="combo-counter">Selected: ${comboH2Selected.length}/3</div>
            
            <div class="card-container">
                <div class="card" id="comboCard" style="z-index:2;opacity:1;">
                    <span class="font-category" id="fontCategory">Sans</span>
                    <div class="font-name" id="fontName">Loading...</div>
                    <div class="font-preview-large" id="fontPreview">AaBbCc</div>
                    <div class="sample-text"><p id="sampleText"></p></div>
                </div>
            </div>
            
            <div class="combo-live-preview">
                <div class="preview-label">📱 Together</div>
                <div class="preview-content">
                    <h1 style="font-family:'${comboH1Winner.family}';font-size:2em;">The Future</h1>
                    <h2 id="liveH2" style="font-size:1.4em;color:#555;">Solutions</h2>
                    <p style="color:#666;line-height:1.6;">Notice the hierarchy.</p>
                </div>
            </div>
        </div>
        
        <div class="buttons">
            <button class="btn btn-dislike" onclick="comboH2Dislike()">✕</button>
            <button class="btn btn-like" onclick="comboH2Like()">♥</button>
        </div>
        <button class="btn-next" onclick="renderComboPhase3()" ${comboH2Selected.length === 0 ? 'disabled' : ''}>Next →</button>
    `;
    
    setTimeout(() => {
        loadComboH2Font();
        setupComboCardGestures('H2');
    }, 100);
}

function loadComboH2Font() {
    const h2Fonts = allFonts.filter(f => f.category === 'sans-serif');
    if (h2Fonts.length === 0) return;
    if (comboH2Index >= h2Fonts.length) comboH2Index = 0;
    
    const font = h2Fonts[comboH2Index];
    const ff = `"${font.family}", sans-serif`;
    
    loadSingleFont(font.family);
    
    document.getElementById('fontCategory').textContent = getCategoryName(font.category);
    document.getElementById('fontName').textContent = font.family;
    document.getElementById('fontPreview').textContent = 'AaBbCc';
    document.getElementById('fontPreview').style.fontFamily = ff;
    document.getElementById('sampleText').innerHTML = getSampleTextForFont(font);
    document.getElementById('sampleText').style.fontFamily = ff;
    document.getElementById('liveH2').style.fontFamily = ff;
}

function comboH2Like() {
    if (comboH2Selected.length >= 3) return;
    const h2Fonts = allFonts.filter(f => f.category === 'sans-serif');
    const font = h2Fonts[comboH2Index];
    if (!comboH2Selected.find(f => f.family === font.family)) {
        comboH2Selected.push(font);
    }
    comboH2Index++;
    
    if (comboH2Selected.length >= 3) {
        showToast('✨ Moving to H3...', 2000);
        setTimeout(() => renderComboPhase3(), 1000);
    } else {
        renderComboPhase2();
    }
}

function comboH2Dislike() {
    comboH2Index++;
    renderComboPhase2();
}

// PHASE 3: H3
function renderComboPhase3() {
    if (comboH2Selected.length === 0) return;
    currentH2CarouselIndex = 0;
    
    document.getElementById('gameContent').innerHTML = `
        <div class="combo-container">
            <div class="progress-steps">
                <div class="progress-step completed">✓</div>
                <div class="progress-step completed">✓</div>
                <div class="progress-step active">H3</div>
                <div class="progress-step">Result</div>
            </div>
            
            <div class="selected-fonts-row">
                <div class="selected-font-compact">
                    <span class="selected-label">H1</span>
                    <span class="selected-name" style="font-family:'${comboH1Winner.family}'">${comboH1Winner.family}</span>
                </div>
                
                <div class="selected-font-compact with-arrows">
                    <button class="arrow-btn" onclick="prevH2Carousel()" id="btnPrev">←</button>
                    <div class="selected-content">
                        <span class="selected-label">H2</span>
                        <span class="selected-name" id="currentH2" style="font-family:'${comboH2Selected[0].family}'">${comboH2Selected[0].family}</span>
                        <span class="selected-counter" id="h2Counter">1/${comboH2Selected.length}</span>
                    </div>
                    <button class="arrow-btn" onclick="nextH2Carousel()" id="btnNext">→</button>
                </div>
            </div>
            
            <h3 style="text-align:center;color:var(--primary);margin-bottom:8px;">Select body text (H3)</h3>
            <div class="combo-counter">Selected: ${comboH3Selected.length}/3</div>
            
            <div class="card-container">
                <div class="card" id="comboCard" style="z-index:2;opacity:1;">
                    <span class="font-category" id="fontCategory">Sans</span>
                    <div class="font-name" id="fontName">Loading...</div>
                    <div class="font-preview-large" id="fontPreview">AaBbCc</div>
                    <div class="sample-text"><p id="sampleText"></p></div>
                </div>
            </div>
            
            <div class="combo-live-preview">
                <div class="preview-label">📱 Complete System</div>
                <div class="preview-content">
                    <h1 style="font-family:'${comboH1Winner.family}';font-size:2em;">Future</h1>
                    <h2 id="liveFullH2" style="font-family:'${comboH2Selected[0].family}';font-size:1.4em;color:#555;">Solutions</h2>
                    <p id="liveFullH3" style="line-height:1.7;color:#666;">Body text should be readable and work harmoniously with headings.</p>
                </div>
            </div>
        </div>
        
        <div class="buttons">
            <button class="btn btn-dislike" onclick="comboH3Dislike()">✕</button>
            <button class="btn btn-like" onclick="comboH3Like()">♥</button>
        </div>
        <button class="btn-next" onclick="showComboResults()" ${comboH3Selected.length === 0 ? 'disabled' : ''}>Results →</button>
    `;
    
    updateH2CarouselButtons();
    loadComboH3Font();
    setupComboCardGestures('H3');
}

function loadComboH3Font() {
    const h3Fonts = allFonts.filter(f => f.category === 'sans-serif');
    if (comboH3Index >= h3Fonts.length) comboH3Index = 0;
    const font = h3Fonts[comboH3Index];
    const ff = `"${font.family}", sans-serif`;
    
    loadSingleFont(font.family);
    
    document.getElementById('fontCategory').textContent = getCategoryName(font.category);
    document.getElementById('fontName').textContent = font.family;
    document.getElementById('fontPreview').textContent = 'AaBbCc';
    document.getElementById('fontPreview').style.fontFamily = ff;
    document.getElementById('sampleText').innerHTML = getSampleTextForFont(font);
    document.getElementById('sampleText').style.fontFamily = ff;
    document.getElementById('liveFullH3').style.fontFamily = ff;
}

function comboH3Like() {
    if (comboH3Selected.length >= 3) return;
    const h3Fonts = allFonts.filter(f => f.category === 'sans-serif');
    const font = h3Fonts[comboH3Index];
    if (!comboH3Selected.find(f => f.family === font.family)) {
        comboH3Selected.push(font);
    }
    comboH3Index++;
    
    if (comboH3Selected.length >= 3) {
        showToast('🎉 Generating...', 2000);
        setTimeout(() => showComboResults(), 1000);
    } else {
        renderComboPhase3();
    }
}

function comboH3Dislike() {
    comboH3Index++;
    renderComboPhase3();
}

// CAROUSEL
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
    const display = document.getElementById('currentH2');
    if (display) {
        display.textContent = font.family;
        display.style.fontFamily = `"${font.family}", sans-serif`;
    }
    const counter = document.getElementById('h2Counter');
    if (counter) {
        counter.textContent = `${currentH2CarouselIndex + 1}/${comboH2Selected.length}`;
    }
    const liveH2 = document.getElementById('liveFullH2');
    if (liveH2) {
        liveH2.style.fontFamily = `"${font.family}", sans-serif`;
    }
    updateH2CarouselButtons();
}

function updateH2CarouselButtons() {
    const btnPrev = document.getElementById('btnPrev');
    const btnNext = document.getElementById('btnNext');
    if (btnPrev) btnPrev.disabled = currentH2CarouselIndex === 0;
    if (btnNext) btnNext.disabled = currentH2CarouselIndex === comboH2Selected.length - 1;
}

// RESULTS
function showComboResults() {
    if (comboH3Selected.length === 0) {
        alert('Select at least 1 font!');
        return;
    }
    
    const total = comboH2Selected.length * comboH3Selected.length;
    let html = '<div class="results-grid-rich">';
    let num = 1;
    
    comboH2Selected.forEach(h2 => {
        comboH3Selected.forEach(h3 => {
            const h1f = `"${comboH1Winner.family}", serif`;
            const h2f = `"${h2.family}", sans-serif`;
            const h3f = `"${h3.family}", sans-serif`;
            
            html += `
                <div class="result-card-rich">
                    <div class="result-number">Combo ${num}</div>
                    <article class="result-article">
                        <h1 style="font-family:${h1f};font-size:2.5em;margin-bottom:16px;line-height:1.2;">
                            The Future of Design
                        </h1>
                        <h2 style="font-family:${h2f};font-size:1.5em;margin-bottom:20px;color:#555;">
                            Innovative Solutions
                        </h2>
                        <p style="font-family:${h3f};line-height:1.8;color:#444;margin-bottom:16px;">
                            Typography plays a crucial role in user experience. The right combination makes all the difference.
                        </p>
                        <blockquote style="font-family:${h3f};font-style:italic;border-left:4px solid var(--primary);padding-left:20px;margin:24px 0;color:#666;">
                            "Good typography is invisible."
                        </blockquote>
                    </article>
                    <div class="result-meta-rich">
                        <div class="meta-item">
                            <span>H1:</span>
                            <strong style="font-family:${h1f}">${comboH1Winner.family}</strong>
                        </div>
                        <div class="meta-item">
                            <span>H2:</span>
                            <strong style="font-family:${h2f}">${h2.family}</strong>
                        </div>
                        <div class="meta-item">
                            <span>H3:</span>
                            <strong style="font-family:${h3f}">${h3.family}</strong>
                        </div>
                    </div>
                </div>
            `;
            num++;
        });
    });
    
    html += '</div>';
    
    document.getElementById('gameContent').innerHTML = `
        <div class="combo-container">
            <div style="text-align:center;margin-bottom:30px;">
                <div style="font-size:4em;margin-bottom:20px;">🎉</div>
                <h2 style="color:var(--primary);margin-bottom:10px;font-size:2em;">Your Combinations!</h2>
                <p style="color:#666;">Created ${total} unique combinations</p>
            </div>
            ${html}
            <button class="btn-next" onclick="startComboMode()" style="margin-top:40px;">Start Over</button>
        </div>
    `;
    
    document.getElementById('favoritesList').innerHTML = html;
}