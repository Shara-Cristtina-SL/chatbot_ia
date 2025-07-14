const API_KEY = 'SUA_CHAVE_DA_API_AQUI'; // Substitua pela sua chave da API Gemini

const chatBox = document.getElementById('chat-box');
const chatForm = document.getElementById('chat-form');
const userInput = document.getElementById('user-input');
const imageInput = document.getElementById('image-input');

// Cria botão de parar fala global
const stopButton = document.createElement('button');
stopButton.textContent = '⏹️ Parar fala';
stopButton.style.marginTop = '10px';
stopButton.style.display = 'none';
stopButton.onclick = () => speechSynthesis.cancel();
chatBox.after(stopButton);

chatForm.addEventListener('submit', async (e) => {
  e.preventDefault();

  const question = userInput.value.trim();
  const imageFile = imageInput.files[0];

  if (!question && !imageFile) return;

  addMessage('user', question || '[Imagem enviada]');
  userInput.value = '';
  imageInput.value = '';

  let parts = [];
  if (question) {
    parts.push({ text: `Você é o Prof. Newton, um professor de ciências. Pergunta: ${question}` });
  }

  if (imageFile) {
    const base64 = await toBase64(imageFile);
    parts.push({
      inlineData: {
        mimeType: imageFile.type,
        data: base64.split(',')[1]
      }
    });
  }

  try {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-pro-vision:generateContent?key=${API_KEY}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ contents: [{ role: 'user', parts }] })
      }
    );

    let reply = response.ok
      ? (await response.json()).candidates?.[0]?.content?.parts?.[0]?.text
      : null;

    reply = (reply || "Hmm... não consegui analisar isso agora.").replace(/\*/g, '');

    addMessage('bot', reply, true);
  } catch (error) {
    addMessage('bot', 'Erro ao acessar o professor. Tente novamente.');
    console.error(error);
  }
});

function toBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

function addMessage(role, text, speakable = false) {
  const div = document.createElement('div');
  div.className = `message ${role}`;

  if (role === 'bot' && speakable) {
    const span = document.createElement('span');
    span.textContent = text;

    const button = document.createElement('button');
    button.textContent = '🔊 Ouvir resposta';
    button.style.marginLeft = '10px';
    button.style.fontSize = '14px';
    button.onclick = () => {
      speak(text);
    };

    div.appendChild(span);
    div.appendChild(button);
  } else {
    div.textContent = text;
  }

  chatBox.appendChild(div);
  chatBox.scrollTop = chatBox.scrollHeight;
}

function speak(text) {
  speechSynthesis.cancel();

  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = 'pt-BR';
  utterance.rate = 1;
  utterance.pitch = 1.1;
  utterance.volume = 1;

  const voices = speechSynthesis.getVoices();
  const ptVoice = voices.find(v => v.lang === 'pt-BR') || voices.find(v => v.lang.startsWith('pt'));
  if (ptVoice) utterance.voice = ptVoice;

  speechSynthesis.speak(utterance);
  stopButton.style.display = 'inline-block';

  utterance.onend = () => {
    stopButton.style.display = 'none';
  };
  utterance.onerror = () => {
    stopButton.style.display = 'none';
  };
}
