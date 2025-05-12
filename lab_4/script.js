// Зміна теми
document.addEventListener('DOMContentLoaded', () => {
    const themeToggle = document.getElementById('theme-toggle');
    
    themeToggle.addEventListener('click', () => {
        document.body.classList.toggle('dark-theme');
        document.getElementById('cv-container').classList.toggle('dark-theme');
        
        // Зберігаємо стан теми
        const isDark = document.body.classList.contains('dark-theme');
        localStorage.setItem('theme', isDark ? 'dark' : 'light');
    });

    // Відновлюємо тему при завантаженні
    const savedTheme = localStorage.getItem('theme') || 'light';
    if (savedTheme === 'dark') {
        document.body.classList.add('dark-theme');
        document.getElementById('cv-container').classList.add('dark-theme');
    }

    const currentHour = new Date().getHours();
    const isDayTime = currentHour >= 7 && currentHour < 21;
    const themeToApply = isDayTime ? 'light' : 'dark';
    //const savedTheme = localStorage.getItem('theme') || 'light';

    if ((themeToApply === 'dark' && savedTheme === 'light') || (themeToApply === 'light' && savedTheme === 'dark')) {
        document.body.classList.toggle('dark-theme');
        document.getElementById('cv-container').classList.toggle('dark-theme');
        localStorage.setItem('theme', themeToApply);
    }
});

// Збереження інформації про браузер
document.addEventListener('DOMContentLoaded', () => {
    const browserInfo = {
        userAgent: navigator.userAgent,
        platform: navigator.platform,
        language: navigator.language
    };
    localStorage.setItem('browserInfo', JSON.stringify(browserInfo));
});
// Відображення інформації з localStorage у футері
document.addEventListener('DOMContentLoaded', () => {
const footer = document.getElementById('browser-info');
const savedBrowserInfo = JSON.parse(localStorage.getItem('browserInfo'));
if (savedBrowserInfo) {
    footer.innerHTML = `
        User Agent: ${savedBrowserInfo.userAgent}<br>
        Platform: ${savedBrowserInfo.platform}<br>
        Language: ${savedBrowserInfo.language}
    `;
}});

// Отримання коментарів з JSONPlaceholder
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
                        ${comment.body}<br>
                       <!-- <em>${comment.email}</em> -->
                        
                    </li>
                `).join('')}
            </ul>
        `;
        document.querySelector('.right-column').appendChild(commentsSection);
    });

// Показ форми через 60 секунд, якщо вона ще не була закрита
setTimeout(() => {
    if (!localStorage.getItem('formSeen')) {
        document.getElementById('feedback-modal').style.display = 'block';
    }
}, 60000); // 60 секунд

// Обробка кнопок "Відправити" та "Скасувати"
document.addEventListener('DOMContentLoaded', () => {
    const feedbackModal = document.getElementById('feedback-modal');
    const form = feedbackModal.querySelector('form');
    const cancelButton = feedbackModal.querySelector('button[type="button"]');

    // При натисканні "Відправити"
    form.addEventListener('submit', () => {
        localStorage.setItem('formSeen', 'true');
    });

    // При натисканні "Скасувати"
    cancelButton.addEventListener('click', () => {
        localStorage.setItem('formSeen', 'true');
    });
});

document.addEventListener('DOMContentLoaded', () => {
    const openFeedbackButton = document.getElementById('open-feedback');
    const feedbackModal = document.getElementById('feedback-modal');

    // Відкрити форму при натисканні на кнопку
    openFeedbackButton.addEventListener('click', () => {
        feedbackModal.style.display = feedbackModal.style.display === 'block' ? 'none' : 'block';
    });
});
