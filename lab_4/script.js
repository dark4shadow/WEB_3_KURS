document.addEventListener('DOMContentLoaded', () => {
    // Загальні утиліти
    const toggleTheme = () => {
        document.body.classList.toggle('dark-theme');
        document.getElementById('cv-container').classList.toggle('dark-theme');
        localStorage.setItem('theme', document.body.classList.contains('dark-theme') ? 'dark' : 'light');
    };

    // Темна тема
    const themeToggle = document.getElementById('theme-toggle');
    themeToggle.addEventListener('click', toggleTheme);

    const savedTheme = localStorage.getItem('theme') || 'light';
    const currentHour = new Date().getHours();
    const themeToApply = (currentHour >= 7 && currentHour < 21) ? 'light' : 'dark';
    
    if ((themeToApply === 'dark' && savedTheme === 'light') || (themeToApply === 'light' && savedTheme === 'dark')) {
        toggleTheme();
    }

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
        exportToPDF();
    });

    // Друк
    document.getElementById('print-cv').addEventListener('click', () => window.print());

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

function exportToPDF() {
    // Store references to sections we want to hide
    const githubSection = document.getElementById('github-section');
    const feedbackSections = document.querySelectorAll('.right-column section');
    const browserInfoFooter = document.getElementById('browser-info');
    const fixedButtons = document.querySelectorAll('.fixed-button');
    
    // Find feedback section by checking content
    let feedbackSection = null;
    feedbackSections.forEach(section => {
        const header = section.querySelector('h2');
        if (header && header.textContent.includes('Feedback')) {
            feedbackSection = section;
        }
    });
    
    // Store original display states
    const originalStates = {
        github: githubSection ? githubSection.style.display : null,
        feedback: feedbackSection ? feedbackSection.style.display : null,
        footer: browserInfoFooter ? browserInfoFooter.style.display : null,
        buttons: []
    };
    
    // Temporarily hide non-essential sections
    try {
        // Hide sections
        if (githubSection) githubSection.style.display = 'none';
        if (feedbackSection) feedbackSection.style.display = 'none';
        if (browserInfoFooter) browserInfoFooter.style.display = 'none';
        
        // Hide fixed buttons
        fixedButtons.forEach((button, index) => {
            originalStates.buttons[index] = button.style.display;
            button.style.display = 'none';
        });
        
        // Get the CV container and apply "print mode" class
        const element = document.getElementById('cv-container');
        element.classList.add('pdf-export-mode');
        
        // Configure PDF generation options for better quality
        const opt = {
            margin: [10, 10, 10, 10],
            filename: 'Anton-Martyniv_CV.pdf',
            image: { 
                type: 'jpeg', 
                quality: 0.98,
                enablePrintMediaType: true
            },
            html2canvas: { 
                scale: 3, // Higher scale for better quality
                useCORS: true,
                letterRendering: true,
                allowTaint: true,
                backgroundColor: '#ffffff',
                removeContainer: false,
                async: true,
                foreignObjectRendering: true,
                imageTimeout: 15000,
                logging: false,
                onclone: function(clonedDoc) {
                    // Ensure fonts are loaded in cloned document
                    const clonedElement = clonedDoc.getElementById('cv-container');
                    if (clonedElement) {
                        clonedElement.style.fontFamily = 'Arial, sans-serif';
                        clonedElement.style.fontSize = '12px';
                        clonedElement.style.lineHeight = '1.4';
                    }
                }
            },
            jsPDF: { 
                unit: 'mm', 
                format: 'a4', 
                orientation: 'portrait',
                compress: false, // Better quality
                precision: 16,
                userUnit: 1.0,
                hotfixes: ["px_scaling"]
            },
            pagebreak: { 
                mode: ['avoid-all', 'css'],
                before: '.page-break-before',
                after: '.page-break-after',
                avoid: ['.left-column', '.right-column', '.experience-item', '.education-item', 'section']
            }
        };
        
        // Show loading indicator
        const loadingDiv = document.createElement('div');
        loadingDiv.id = 'pdf-loading';
        loadingDiv.innerHTML = `
            <div style="position: fixed; top: 50%; left: 50%; transform: translate(-50%, -50%); 
                        background: rgba(0,0,0,0.8); color: white; padding: 20px; 
                        border-radius: 8px; z-index: 10000; text-align: center;">
                <div class="loading-spinner" style="margin: 0 auto 10px; width: 30px; height: 30px;"></div>
                <p>Generating PDF...</p>
            </div>
        `;
        document.body.appendChild(loadingDiv);
        
        // Generate PDF with improved settings
        html2pdf().set(opt).from(element).toPdf().get('pdf').then(function (pdf) {
            // Add metadata
            pdf.setProperties({
                title: 'Anton Martyniv - CV',
                subject: 'Curriculum Vitae',
                author: 'Anton Martyniv',
                creator: 'CV Generator',
                producer: 'html2pdf.js'
            });
            
            return pdf;
        }).save().then(() => {
            // Remove loading indicator and restore state
            document.body.removeChild(loadingDiv);
            restoreOriginalState();
            element.classList.remove('pdf-export-mode');
            
            // Show success message
            showNotification('PDF exported successfully!', 'success');
        }).catch(error => {
            console.error('Error generating PDF:', error);
            document.body.removeChild(loadingDiv);
            restoreOriginalState();
            element.classList.remove('pdf-export-mode');
            showNotification('Failed to export PDF. Please try again.', 'error');
        });
            
    } catch (error) {
        console.error('Error in PDF export preparation:', error);
        restoreOriginalState();
        showNotification('Failed to prepare PDF export. Please try again.', 'error');
    }
    
    // Helper function to restore original display states
    function restoreOriginalState() {
        if (githubSection && originalStates.github !== null) 
            githubSection.style.display = originalStates.github;
            
        if (feedbackSection && originalStates.feedback !== null) 
            feedbackSection.style.display = originalStates.feedback;
            
        if (browserInfoFooter && originalStates.footer !== null) 
            browserInfoFooter.style.display = originalStates.footer;
            
        fixedButtons.forEach((button, index) => {
            if (originalStates.buttons[index] !== undefined) {
                button.style.display = originalStates.buttons[index];
            } else {
                button.style.display = '';
            }
        });
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