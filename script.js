const API_KEY = 'SUA_CHAVE_DA_API_AQUI';
const chatBox = document.getElementById('chat-box');
const chatForm = document.getElementById('chat-form');
const userInput = document.getElementById('user-input');

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
  if (!question) return;

  addMessage('user', question);
  userInput.value = '';

  const prompt = `Você é o Prof. Newton, um professor experiente e paciente que explica ciências (física, química e biologia) para alunos do ensino médio. Responda de forma didática e clara, usando exemplos simples. Pergunta do aluno: ${question}`;

  try {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-latest:generateContent?key=${API_KEY}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ role: 'user', parts: [{ text: prompt }] }]
        })
      }
    );

    let reply = response.ok
      ? (await response.json()).candidates?.[0]?.content?.parts?.[0]?.text
      : null;

    reply = (reply || "Hmm... não consegui explicar isso agora.").replace(/\*/g, '');

    addMessage('bot', reply, true);
  } catch (error) {
    addMessage('bot', 'Erro ao acessar o professor. Tente novamente.');
    console.error(error);
  }
});

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
  speechSynthesis.cancel(); // Interrompe qualquer fala anterior

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
