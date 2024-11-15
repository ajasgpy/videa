from flask import Flask, render_template, request, jsonify, send_from_directory
from transformers import pipeline
from gtts import gTTS
import os
import logging
import re
import subprocess

app = Flask(__name__)

UPLOAD_FOLDER = 'uploads'
STATIC_FOLDER = 'static'

# Criar pastas se não existirem
for folder in [UPLOAD_FOLDER, STATIC_FOLDER]:
    if not os.path.exists(folder):
        os.makedirs(folder)

app.config['UPLOAD_FOLDER'] = UPLOAD_FOLDER
app.config['STATIC_FOLDER'] = STATIC_FOLDER

# Inicializar o modelo do HuggingFace
text_generator = pipeline('text2text-generation', model='google/flan-t5-base')

# Variável global para armazenar o progresso
progress = 0

# Configure o logger
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger('moviepy')

# Classe para log do MoviePy
class MoviepyLogger:
    def __init__(self):
        self.last_progress = 0
        
    def callback(self, message):
        global progress
        if "t:" in message:
            try:
                match = re.search(r't:(\s+)?([0-9]+)', message)
                if match:
                    current_frame = int(match.group(2))
                    # Ajusta o progresso entre 90 e 100
                    current_progress = 90 + (current_frame / total_frames) * 10
                    if current_progress > self.last_progress + 1:  # Atualiza a cada 1%
                        progress = min(99, int(current_progress))
                        self.last_progress = current_progress
                        logger.info(f"Progresso atual: {progress}%")
            except Exception as e:
                logger.error(f"Erro no callback: {str(e)}")
        logger.info(message)

@app.route('/progress')
def get_progress():
    return jsonify({'progress': progress})

@app.route('/get_suggestions', methods=['POST'])
def get_suggestions():
    try:
        title = request.form.get('title', '')
        description = request.form.get('description', '')
        style = request.form.get('style', 'profissional')
        
        # Usar uma solução mais simples primeiro para testar
        suggestions = f"""
        Sugestão 1:
        - Título: Versão Profissional: {title}
        - Descrição: Abordagem detalhada sobre {description}

        Sugestão 2:
        - Título: Guia Completo: {title}
        - Descrição: Tudo que você precisa saber sobre {description}

        Sugestão 3:
        - Título: Masterclass: {title}
        - Descrição: Uma análise profunda sobre {description}
        """
        
        print("Sugestões geradas:", suggestions)  # Debug
        
        return jsonify({
            'success': True,
            'suggestions': suggestions
        })
        
    except Exception as e:
        print("Erro:", str(e))  # Debug
        return jsonify({
            'success': False,
            'error': str(e)
        })

@app.route('/', methods=['GET', 'POST'])
def index():
    if request.method == 'POST':
        global progress
        progress = 0
        
        try:
            print("Iniciando processamento do vídeo...")
            
            # Capturar dados do formulário
            video_file = request.files['video_file']
            title = request.form['title']
            description = request.form['description']
            language = request.form['language']
            format_type = request.form['format_type']
            
            print(f"Dados recebidos: título={title}, formato={format_type}, idioma={language}")
            
            # Atualizar progresso - Upload
            progress = 10
            video_path = os.path.join(app.config['UPLOAD_FOLDER'], video_file.filename)
            video_file.save(video_path)
            print(f"Vídeo salvo em: {video_path}")
            
            # Gerar narração
            progress = 30
            narration_text = f"{title}. {description}"
            print("Gerando narração...")
            tts = gTTS(narration_text, lang=language)
            audio_path = os.path.join(app.config['UPLOAD_FOLDER'], "narration.mp3")
            tts.save(audio_path)
            print("Narração gerada com sucesso")
            
            # Processar vídeo usando ffmpeg
            progress = 50
            output_filename = "output_video.mp4"
            output_path = os.path.join(app.config['UPLOAD_FOLDER'], output_filename)
            
            print("Iniciando processamento com ffmpeg...")
            
            # Comando ffmpeg
            command = [
                'ffmpeg',
                '-i', video_path,
                '-i', audio_path,
                '-c:v', 'copy',  # Mantém o codec de vídeo original
                '-c:a', 'aac',
                '-strict', 'experimental',
                '-map', '0:v:0',
                '-map', '1:a:0',
                '-shortest',
                output_path
            ]
            
            print("Executando comando:", ' '.join(command))
            
            # Executar ffmpeg
            process = subprocess.Popen(
                command,
                stdout=subprocess.PIPE,
                stderr=subprocess.PIPE,
                universal_newlines=True
            )
            
            # Capturar output em tempo real
            while True:
                output = process.stderr.readline()
                if output == '' and process.poll() is not None:
                    break
                if output:
                    print("ffmpeg:", output.strip())
            
            progress = 90
            
            # Verificar resultado
            if process.returncode != 0:
                raise Exception("Erro no processamento do ffmpeg")
            
            # Verificar se o arquivo foi gerado
            if not os.path.exists(output_path):
                raise Exception("Arquivo de saída não foi gerado")
            
            print(f"Arquivo gerado: {output_path}")
            print(f"Tamanho do arquivo: {os.path.getsize(output_path)} bytes")
            
            progress = 100
            print("Processamento concluído com sucesso!")
            print(f"Redirecionando para result.html com video_filename={output_filename}")
            
            return render_template('result.html',
                                video_filename=output_filename,
                                title=title,
                                description=description)
                
        except Exception as e:
            progress = 0
            print(f"Erro detalhado durante o processamento: {str(e)}")
            import traceback
            print(traceback.format_exc())
            return render_template('result.html', error=str(e))
        finally:
            # Limpar arquivos temporários se necessário
            try:
                if os.path.exists(audio_path):
                    os.remove(audio_path)
            except Exception as e:
                print(f"Erro ao limpar arquivos temporários: {str(e)}")

    return render_template('index.html')

# Rota específica para arquivos de upload
@app.route('/uploads/<path:filename>')
def uploaded_file(filename):
    return send_from_directory(app.config['UPLOAD_FOLDER'], filename, as_attachment=True)

# Rota para arquivos estáticos (caso necessário)
@app.route('/static/<path:filename>')
def serve_static(filename):
    return send_from_directory(app.static_folder, filename)

if __name__ == '__main__':
    app.run(debug=True)
    
