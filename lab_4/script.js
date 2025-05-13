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
    const element = document.getElementById('cv-container');
    const opt = {
        margin: [10, 10, 10, 10],
        filename: 'Anton-Martyniv_CV.pdf',
        //image: { type: 'jpeg', quality: 0.98 },
        html2canvas: { 
            scale: 2,
            useCORS: true,
            logging: false,
            letterRendering: true,
            allowTaint: true
        },
        jsPDF: { 
            unit: 'mm', 
            format: 'a4', 
            orientation: 'portrait',
            compress: true
        },
        pagebreak: { mode: ['avoid-all', 'css', 'legacy'] }
    };
    
    html2pdf().set(opt).from(element).save();
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