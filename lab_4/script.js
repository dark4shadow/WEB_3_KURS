let isExportingPdf = false;

document.addEventListener('DOMContentLoaded', () => {
    const THEME_KEY = 'cv-theme';
    const THEME_MODE_KEY = 'cv-theme-mode';
    let autoThemeIntervalId = null;

    const getAutoTheme = () => {
        const hour = new Date().getHours();
        return hour >= 7 && hour < 21 ? 'light' : 'dark';
    };

    const applyTheme = (theme) => {
        const isDark = theme === 'dark';
        document.body.classList.toggle('dark-theme', isDark);
        document.getElementById('cv-container').classList.toggle('dark-theme', isDark);
    };

    const persistTheme = (theme, mode) => {
        localStorage.setItem(THEME_KEY, theme);
        localStorage.setItem(THEME_MODE_KEY, mode);
    };

    const syncThemeWithTime = () => {
        const autoTheme = getAutoTheme();
        const currentTheme = document.body.classList.contains('dark-theme') ? 'dark' : 'light';

        if (currentTheme !== autoTheme) {
            applyTheme(autoTheme);
            persistTheme(autoTheme, 'auto');
        }
    };

    const scheduleAutoThemeRefresh = () => {
        if (autoThemeIntervalId) {
            clearInterval(autoThemeIntervalId);
            autoThemeIntervalId = null;
        }

        if (localStorage.getItem(THEME_MODE_KEY) !== 'auto') {
            return;
        }

        syncThemeWithTime();
        autoThemeIntervalId = setInterval(syncThemeWithTime, 60 * 1000);
    };

    const initTheme = () => {
        const savedMode = localStorage.getItem(THEME_MODE_KEY);
        const savedTheme = localStorage.getItem(THEME_KEY);

        if (savedMode === 'manual' && (savedTheme === 'light' || savedTheme === 'dark')) {
            applyTheme(savedTheme);
            return;
        }

        const autoTheme = getAutoTheme();
        applyTheme(autoTheme);
        persistTheme(autoTheme, 'auto');
    };

    const changeTheme = (modeOverride) => {
        if (modeOverride === 'auto') {
            const autoTheme = getAutoTheme();
            applyTheme(autoTheme);
            persistTheme(autoTheme, 'auto');
            scheduleAutoThemeRefresh();
            return;
        }

        const nextTheme = document.body.classList.contains('dark-theme') ? 'light' : 'dark';
        applyTheme(nextTheme);
        persistTheme(nextTheme, 'manual');
        scheduleAutoThemeRefresh();
    };

    initTheme();
    scheduleAutoThemeRefresh();

    const themeToggle = document.getElementById('theme-toggle');
    themeToggle.title = 'Toggle theme (Shift+Click to follow local time)';
    themeToggle.addEventListener('click', (event) => {
        changeTheme(event.shiftKey ? 'auto' : undefined);
    });

    // Інформація про браузер
    const browserInfo = {
        userAgent: navigator.userAgent,
        platform: navigator.platform,
        language: navigator.language
    };
    localStorage.setItem('browserInfo', JSON.stringify(browserInfo));
    
    const footer = document.getElementById('browser-info');
    const savedBrowserInfo = JSON.parse(localStorage.getItem('browserInfo'));
    if (savedBrowserInfo) {
        footer.innerHTML = `
            User Agent: ${savedBrowserInfo.userAgent}<br>
            Platform: ${savedBrowserInfo.platform}<br>
            Language: ${savedBrowserInfo.language}
        `;
    }

    // Коментарі з API
    const variantNumber = 14;
    fetch(`https://jsonplaceholder.typicode.com/posts/${variantNumber}/comments`)
        .then(response => response.json())
        .then(comments => {
            const commentsSection = document.createElement('section');
            commentsSection.id = 'api-feedback';
            commentsSection.innerHTML = `
                <h2 class="section-header">Feedback</h2>
                <ul class="experience-list">
                    ${comments.map(comment => `
                        <li class="experience-item">
                            <strong>${comment.name}</strong><br>
                            ${comment.body}
                        </li>
                    `).join('')}
                </ul>
            `;
            document.querySelector('.right-column').appendChild(commentsSection);
        });

    // Модальне вікно
    const feedbackModal = document.getElementById('feedback-modal');
    const form = document.getElementById('feedback-form');
    
    document.getElementById('open-feedback').addEventListener('click', () => {
        feedbackModal.style.display = 'block';
    });

    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        const response = await fetch('.env');
        const envFile = await response.text();
        const endpoint = envFile.match(/FORMSPREE_ENDPOINT\s*=\s*"([^"]+)"/)[1];
        try {
            const response = await fetch(endpoint, {
                method: 'POST',
                body: new FormData(form),
                headers: { 'Accept': 'application/json' }
            });
            
            if (response.ok) {
                localStorage.setItem('formSeen', 'true');
                feedbackModal.style.display = 'none';
                alert('Повідомлення успішно відправлено!');
            }
        } catch (error) {
            alert('Помилка: ' + error.message);
        }
    });

    // Експорт PDF

    document.getElementById('export-pdf').addEventListener('click', async () => {
        if (!window.html2pdf) {
            await loadScript('https://cdnjs.cloudflare.com/ajax/libs/html2pdf.js/0.10.1/html2pdf.bundle.min.js');
        }
        await exportToPDF();
    });

    const printBtn = document.getElementById('print-cv');
    if (printBtn) {
        printBtn.addEventListener('click', () => window.print());
    }

    // GitHub
    loadGitHubProfile();
    addGithubToggle();
});

async function loadGitHubProfile() {
    const username = 'dark4shadow';
    const githubSection = document.getElementById('github-section');
    const githubInfo = document.querySelector('.github-info');
    
    try {
        // Показати спінер та приховати помилки
        githubSection.classList.remove('error');
        githubInfo.innerHTML = '<div class="loading-spinner"></div>';
        
        const [userResponse, reposResponse] = await Promise.all([
            fetch(`https://api.github.com/users/${username}`),
            fetch(`https://api.github.com/users/${username}/repos?sort=updated&per_page=5`)
        ]);
        
        if (!userResponse.ok || !reposResponse.ok) {
            throw new Error('Не вдалося завантажити дані');
        }
        
        const [userData, reposData] = await Promise.all([userResponse.json(), reposResponse.json()]);
        
        // Оновлення DOM після успішного запиту
        githubInfo.innerHTML = `
            <div class="user-info">
                <p>Public Repos: ${userData.public_repos}</p>
                <p>Followers: ${userData.followers}</p>
            </div>
            <h3>Останні репозиторії:</h3>
            <ul class="repo-list">
                ${reposData.map(repo => `
                    <li class="repo-item">
                        <a href="${repo.html_url}" target="_blank">${repo.name}</a>
                        <p>${repo.description || 'Немає опису'}</p>
                        <div class="repo-stats">
                            <span>⭐ ${repo.stargazers_count}</span>
                            <span>🔄 ${repo.forks_count}</span>
                            <span>${repo.language || 'N/A'}</span>
                        </div>
                    </li>
                `).join('')}
            </ul>
        `;
        
        // Видалити клас "loading" після завантаження
        githubSection.classList.remove('loading');
    } catch (error) {
        // Показати помилку та додати клас для стилізації
        githubSection.classList.add('error');
        githubInfo.innerHTML = `
            <p class="error-message">${error.message}</p>
            <button onclick="loadGitHubProfile()" class="retry-button">Спробувати знову</button>
        `;
    } finally {
        // Гарантовано прибрати спінер
        githubSection.classList.remove('loading');
    }
}   

async function exportToPDF() {
    if (isExportingPdf) {
        return;
    }

    isExportingPdf = true;
    const loadingOverlay = showPdfLoadingOverlay('Generating PDF...');

    try {
        // Load required libraries
        if (!window.jspdf || !window.html2canvas) {
            await Promise.all([
                loadScript('https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js'),
                loadScript('https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js')
            ]);
        }

        const { jsPDF } = window.jspdf;
        const cvContainer = document.getElementById('cv-container');
        
        // Hide elements that shouldn't be in PDF
        const hiddenElements = hideElementsForPdf([
            '#github-section', 
            '#browser-info', 
            '#feedback-modal', 
            '#api-feedback', 
            '.fixed-button'
        ]);

        // Add PDF export mode class
        cvContainer.classList.add('pdf-export-mode');
        document.body.style.background = 'white';

        // Wait for any animations/transitions to complete
        await new Promise(resolve => setTimeout(resolve, 300));

        // Create canvas from HTML
        const canvas = await html2canvas(cvContainer, {
            scale: 2,
            useCORS: true,
            logging: false,
            backgroundColor: '#ffffff',
            windowWidth: 1000,
            windowHeight: cvContainer.scrollHeight,
            onclone: (clonedDoc) => {
                const clonedContainer = clonedDoc.getElementById('cv-container');
                clonedContainer.style.boxShadow = 'none';
                clonedContainer.style.margin = '0';
                clonedContainer.style.maxWidth = '1000px';
            }
        });

        // Calculate PDF dimensions
        const imgWidth = 210; // A4 width in mm
        const pageHeight = 297; // A4 height in mm
        const imgHeight = (canvas.height * imgWidth) / canvas.width;
        
        // Create PDF
        const pdf = new jsPDF({
            orientation: 'portrait',
            unit: 'mm',
            format: 'a4',
            compress: true
        });

        let heightLeft = imgHeight;
        let position = 0;
        const imgData = canvas.toDataURL('image/jpeg', 0.95);

        // Add first page
        pdf.addImage(imgData, 'JPEG', 0, position, imgWidth, imgHeight, '', 'FAST');
        heightLeft -= pageHeight;

        // Add additional pages if needed
        while (heightLeft > 0) {
            position = heightLeft - imgHeight;
            pdf.addPage();
            pdf.addImage(imgData, 'JPEG', 0, position, imgWidth, imgHeight, '', 'FAST');
            heightLeft -= pageHeight;
        }

        // Save PDF
        pdf.save('Anton-Martyniv_CV.pdf');
        
        // Restore visibility
        cvContainer.classList.remove('pdf-export-mode');
        document.body.style.background = '';
        restoreElementsVisibility(hiddenElements);

        showNotification('PDF exported successfully!', 'success');

    } catch (error) {
        console.error('PDF generation error:', error);
        showNotification('Failed to export PDF: ' + error.message, 'error');
    } finally {
        hidePdfLoadingOverlay(loadingOverlay);
        isExportingPdf = false;
    }
}

// Helper function to show notifications
function showNotification(message, type = 'info') {
    const notification = document.createElement('div');
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: ${type === 'success' ? '#4CAF50' : type === 'error' ? '#f44336' : '#2196F3'};
        color: white;
        padding: 12px 20px;
        border-radius: 4px;
        z-index: 10000;
        font-size: 14px;
        box-shadow: 0 2px 10px rgba(0,0,0,0.2);
        transition: all 0.3s ease;
    `;
    notification.textContent = message;
    
    document.body.appendChild(notification);
    
    // Auto remove after 3 seconds
    setTimeout(() => {
        notification.style.opacity = '0';
        notification.style.transform = 'translateX(100%)';
        setTimeout(() => {
            if (notification.parentNode) {
                document.body.removeChild(notification);
            }
        }, 300);
    }, 3000);
}

async function loadScript(src) {
    return new Promise((resolve, reject) => {
        const script = document.createElement('script');
        script.src = src;
        script.onload = resolve;
        script.onerror = reject;
        document.head.appendChild(script);
    });
}

function addGithubToggle() {
    const githubSection = document.getElementById('github-section');
    const toggleHeader = githubSection.querySelector('.toggle-header');
    
    const toggleBtn = document.createElement('span');
    toggleBtn.className = 'toggle-github';
    toggleBtn.textContent = 'Show/Hide GitHub Activity';
    toggleBtn.title = 'Toggle GitHub section';
    
    toggleBtn.addEventListener('click', () => {
        // Знаходимо список репозиторіїв після його створення
        const repoList = githubSection.querySelector('.repo-list');
        if (repoList) {
            toggleBtn.classList.toggle('collapsed');
            repoList.classList.toggle('collapsed');
            localStorage.setItem('githubSectionCollapsed', repoList.classList.contains('collapsed'));
        }
    });
    
    // Відновлюємо попередній стан кнопки
    const isCollapsed = localStorage.getItem('githubSectionCollapsed') === 'true';
    if (isCollapsed) {
        toggleBtn.classList.add('collapsed');
    }
    
    toggleHeader.appendChild(toggleBtn);
}

function showPdfLoadingOverlay(message) {
    const overlay = document.createElement('div');
    overlay.id = 'pdf-loading';
    overlay.innerHTML = `
        <div style="position: fixed; top: 50%; left: 50%; transform: translate(-50%, -50%);
                    background: rgba(0,0,0,0.8); color: white; padding: 20px;
                    border-radius: 8px; z-index: 10000; text-align: center;">
            <div class="loading-spinner" style="margin: 0 auto 10px; width: 30px; height: 30px;"></div>
            <p>${message}</p>
        </div>
    `;
    document.body.appendChild(overlay);
    return overlay;
}

function hidePdfLoadingOverlay(overlay) {
    if (overlay && overlay.parentNode) {
        overlay.parentNode.removeChild(overlay);
    }
}

function hideElementsForPdf(selectors) {
    const affected = [];
    selectors.forEach(selector => {
        document.querySelectorAll(selector).forEach(element => {
            affected.push({ element, inlineStyle: element.getAttribute('style') });
            element.style.display = 'none';
        });
    });
    return affected;
}

function restoreElementsVisibility(affected) {
    affected.forEach(({ element, inlineStyle }) => {
        if (inlineStyle === null) {
            element.removeAttribute('style');
        } else {
            element.setAttribute('style', inlineStyle);
        }
    });
}