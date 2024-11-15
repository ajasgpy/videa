document.addEventListener('DOMContentLoaded', function() {
    const uploadForm = document.getElementById('uploadForm');
    if (uploadForm) {
        uploadForm.onsubmit = function() {
            document.getElementById('progressContainer').style.display = 'block';
            checkProgress();
            return true;
        };
    }
});

function checkProgress() {
    fetch('/progress')
        .then(response => response.json())
        .then(data => {
            const progress = data.progress;
            updateProgressBar(progress);
            updateStatusMessage(progress);
            
            if (progress < 100) {
                setTimeout(checkProgress, 1000);
            }
        })
        .catch(error => {
            console.error('Erro ao verificar progresso:', error);
        });
}

function updateProgressBar(progress) {
    const progressBar = document.getElementById('progressBar');
    if (progressBar) {
        progressBar.style.width = progress + '%';
        progressBar.setAttribute('aria-valuenow', progress);
        progressBar.textContent = progress + '%';
    }
}

function updateStatusMessage(progress) {
    const statusText = document.getElementById('statusText');
    if (!statusText) return;

    let message = 'Iniciando processamento...';
    
    if (progress < 10) {
        message = 'Iniciando processamento...';
    } else if (progress < 30) {
        message = 'Fazendo upload do vídeo...';
    } else if (progress < 50) {
        message = 'Gerando narração...';
    } else if (progress < 70) {
        message = 'Processando vídeo...';
    } else if (progress < 90) {
        message = 'Ajustando formato...';
    } else if (progress < 100) {
        message = 'Finalizando...';
    } else {
        message = 'Processamento concluído!';
    }
    
    statusText.textContent = message;
} 