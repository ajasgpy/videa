document.addEventListener('DOMContentLoaded', function() {
    const fileInput = document.getElementById('video_file');
    
    if (fileInput) {
        fileInput.addEventListener('change', handleFileChange);
    }
});

function handleFileChange(e) {
    const fileName = e.target.files[0]?.name;
    const fileNameElement = document.getElementById('fileName');
    
    if (fileName) {
        // Se o nome for muito longo, trunca
        const displayName = fileName.length > 30 
            ? fileName.substring(0, 27) + '...' 
            : fileName;
        fileNameElement.textContent = displayName;
        
        // Adiciona classe para animar a mudança
        fileNameElement.parentElement.classList.add('file-selected');
    } else {
        fileNameElement.textContent = 'Selecionar arquivo';
        fileNameElement.parentElement.classList.remove('file-selected');
    }
} 