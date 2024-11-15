document.addEventListener('DOMContentLoaded', function() {
    const getSuggestionsBtn = document.getElementById('getSuggestions');
    
    if (getSuggestionsBtn) {
        getSuggestionsBtn.addEventListener('click', handleSuggestions);
    }
});

async function handleSuggestions() {
    const titleInput = document.getElementById('title');
    const descriptionInput = document.getElementById('description');
    const styleSelect = document.getElementById('style');
    
    if (!titleInput || !descriptionInput) {
        console.error('Elementos do formulário não encontrados');
        return;
    }
    
    const title = titleInput.value;
    const description = descriptionInput.value;
    const style = styleSelect ? styleSelect.value : 'profissional';
    
    if (!title && !description) {
        alert('Por favor, preencha pelo menos o título ou a descrição.');
        return;
    }
    
    const modal = new bootstrap.Modal(document.getElementById('suggestionsModal'));
    modal.show();
    
    document.getElementById('loadingSuggestions').classList.remove('d-none');
    document.getElementById('suggestionsContent').innerHTML = '';
    
    try {
        const formData = new FormData();
        formData.append('title', title);
        formData.append('description', description);
        formData.append('style', style);
        
        const response = await fetch('/get_suggestions', {
            method: 'POST',
            body: formData
        });
        
        const data = await response.json();
        
        if (data.success) {
            const suggestionsHtml = `
                <div class="suggestions-container">
                    ${data.suggestions.split('\n').map(line => {
                        if (!line.trim()) return '';
                        if (line.startsWith('Sugestão')) {
                            return `<h6 class="mt-3 text-primary">${line}</h6>`;
                        }
                        return `<p class="suggestion-line" onclick="selectSuggestion(this)">${line}</p>`;
                    }).join('')}
                </div>
            `;
            
            document.getElementById('suggestionsContent').innerHTML = suggestionsHtml;
        } else {
            throw new Error(data.error || 'Erro ao gerar sugestões');
        }
    } catch (error) {
        console.error('Erro:', error);
        document.getElementById('suggestionsContent').innerHTML = `
            <div class="alert alert-danger">
                Erro ao gerar sugestões: ${error.message}
            </div>
        `;
    } finally {
        document.getElementById('loadingSuggestions').classList.add('d-none');
    }
}

function selectSuggestion(element) {
    const text = element.textContent;
    const type = text.includes('Título:') ? 'titulo' : 'descricao';
    
    // Remover seleção anterior
    document.querySelectorAll('.suggestion-line').forEach(el => {
        if ((type === 'titulo' && el.textContent.includes('Título:')) ||
            (type === 'descricao' && el.textContent.includes('Descrição:'))) {
            el.classList.remove('selected');
        }
    });
    
    // Adicionar seleção atual
    element.classList.add('selected');
    
    // Atualizar input
    if (type === 'titulo') {
        document.getElementById('title').value = text.replace('Título:', '').trim();
    } else {
        document.getElementById('description').value = text.replace('Descrição:', '').trim();
    }
} 