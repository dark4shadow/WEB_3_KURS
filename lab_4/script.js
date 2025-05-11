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
});
