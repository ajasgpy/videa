document.addEventListener('DOMContentLoaded', function() {
    const themeToggle = document.getElementById('themeToggle');
    const themeIcon = document.getElementById('themeIcon');
    const html = document.documentElement;

    // Função para atualizar a aparência
    const updateThemeAppearance = (theme) => {
        html.setAttribute('data-bs-theme', theme);
        localStorage.setItem('theme', theme);
        
        if (theme === 'dark') {
            themeIcon.className = 'bi bi-moon-fill';
            themeToggle.classList.remove('btn-light');
            themeToggle.classList.add('btn-dark');
        } else {
            themeIcon.className = 'bi bi-sun-fill';
            themeToggle.classList.remove('btn-dark');
            themeToggle.classList.add('btn-light');
        }
    };

    // Verificar tema salvo
    const savedTheme = localStorage.getItem('theme');
    const initialTheme = savedTheme || 'light';
    
    // Aplicar tema
    updateThemeAppearance(initialTheme);

    // Alternar tema
    themeToggle.addEventListener('click', () => {
        const newTheme = html.getAttribute('data-bs-theme') === 'dark' ? 'light' : 'dark';
        updateThemeAppearance(newTheme);
    });
}); 