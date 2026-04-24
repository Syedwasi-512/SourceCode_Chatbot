(function () {
  const API_URL = window.location.hostname === 'localhost' 
    ? 'http://localhost:3000/chat' 
    : '/chat';

  const style = document.createElement('style');
  style.textContent = `
    #cbot-btn {
      position: fixed; bottom: 24px; right: 24px; z-index: 9999;
      width: 54px; height: 54px; border-radius: 50%; border: none; cursor: pointer;
      background: linear-gradient(135deg, #0d4f4f, #0f766e);
      box-shadow: 0 4px 20px rgba(13,79,79,0.6);
      font-size: 24px; color: #fff; display: flex; align-items: center; justify-content: center;
      transition: transform 0.2s;
    }
    #cbot-btn:hover { transform: scale(1.1); }
    #cbot-wrap {
      position: fixed; bottom: 90px; right: 24px; z-index: 9999;
      width: 370px; height: 540px; display: none; flex-direction: column;
      background: rgba(2,34,34,0.97); backdrop-filter: blur(20px);
      border-radius: 20px; border: 1px solid rgba(255,255,255,0.12);
      box-shadow: 0 8px 60px rgba(0,0,0,0.5); overflow: hidden;
      font-family: 'Segoe UI', sans-serif;
    }
    #cbot-wrap.open { display: flex; animation: cbotPop 0.3s cubic-bezier(0.34,1.56,0.64,1); }
    @keyframes cbotPop { from { opacity:0; transform: scale(0.88) translateY(20px); } to { opacity:1; transform: scale(1) translateY(0); } }
    #cbot-header {
      padding: 14px 16px; display: flex; align-items: center; gap: 8px;
      background: rgba(255,255,255,0.05); border-bottom: 1px solid rgba(255,255,255,0.08);
      color: #fff; font-size: 14px; font-weight: 600;
    }
    #cbot-dot { width: 9px; height: 9px; background: #4ade80; border-radius: 50%; animation: cbotPulse 2s infinite; }
    @keyframes cbotPulse { 0%,100%{box-shadow:0 0 0 0 rgba(74,222,128,0.6)} 50%{box-shadow:0 0 0 6px rgba(74,222,128,0)} }
    #cbot-close { margin-left: auto; background: none; border: none; color: rgba(255,255,255,0.5); font-size: 18px; cursor: pointer; line-height: 1; }
    #cbot-close:hover { color: #fff; }
    #cbot-msgs {
      flex: 1; overflow-y: auto; padding: 16px 12px; display: flex; flex-direction: column; gap: 8px;
      scrollbar-width: thin; scrollbar-color: rgba(255,255,255,0.1) transparent;
    }
    .cbot-msg {
      max-width: 82%; padding: 9px 13px; border-radius: 14px; font-size: 13px; line-height: 1.5;
      word-wrap: break-word; animation: cbotMsg 0.3s cubic-bezier(0.34,1.56,0.64,1);
    }
    @keyframes cbotMsg { from{opacity:0;transform:translateY(10px)} to{opacity:1;transform:translateY(0)} }
    .cbot-msg.user { background: linear-gradient(135deg,#0d4f4f,#0f766e); color:#fff; align-self:flex-end; border-bottom-right-radius:4px; }
    .cbot-msg.bot  { background: rgba(255,255,255,0.1); color:#e2e8f0; align-self:flex-start; border-bottom-left-radius:4px; border:1px solid rgba(255,255,255,0.1); }
    .cbot-msg.typing { background: rgba(255,255,255,0.07); color:rgba(255,255,255,0.45); align-self:flex-start; border-bottom-left-radius:4px; border:1px solid rgba(255,255,255,0.08); }
    .cbot-dots span { display:inline-block; width:5px; height:5px; background:rgba(255,255,255,0.5); border-radius:50%; margin:0 2px; animation:cbotBounce 1.2s infinite; }
    .cbot-dots span:nth-child(2){animation-delay:.2s} .cbot-dots span:nth-child(3){animation-delay:.4s}
    @keyframes cbotBounce { 0%,80%,100%{transform:translateY(0)} 40%{transform:translateY(-5px)} }
    #cbot-input-row { display:flex; padding:12px; gap:8px; background:rgba(255,255,255,0.04); border-top:1px solid rgba(255,255,255,0.08); }
    #cbot-input {
      flex:1; padding:9px 14px; border:1px solid rgba(255,255,255,0.15); border-radius:20px;
      background:rgba(255,255,255,0.08); color:#fff; font-size:13px; outline:none;
    }
    #cbot-input::placeholder { color:rgba(255,255,255,0.35); }
    #cbot-input:focus { border-color:rgba(45,212,191,0.7); box-shadow:0 0 0 3px rgba(45,212,191,0.2); }
    #cbot-send {
      width:38px; height:38px; border-radius:50%; border:none; cursor:pointer; flex-shrink:0;
      background:linear-gradient(135deg,#0d4f4f,#0f766e); color:#fff; font-size:16px;
      display:flex; align-items:center; justify-content:center;
      box-shadow:0 4px 15px rgba(13,79,79,0.6); transition:transform 0.2s;
    }
    #cbot-send:hover { transform:scale(1.1); }
    #cbot-send:disabled { opacity:0.5; cursor:not-allowed; transform:none; }
    .cbot-msg code { background:rgba(255,255,255,0.15); padding:1px 4px; border-radius:3px; font-family:monospace; }
    .cbot-msg ul { padding-left:16px; margin:3px 0; }
  `;
  document.head.appendChild(style);

  document.body.insertAdjacentHTML('beforeend', `
    <button id="cbot-btn" title="Chat with us">💬</button>
    <div id="cbot-wrap">
      <div id="cbot-header">
        <div id="cbot-dot"></div>
        Website Assistant
        <button id="cbot-close">✕</button>
      </div>
      <div id="cbot-msgs">
        <div class="cbot-msg bot">Hi! How can I help you today? ✨</div>
      </div>
      <div id="cbot-input-row">
        <input id="cbot-input" type="text" placeholder="Type a message..." autocomplete="off"/>
        <button id="cbot-send">&#10148;</button>
      </div>
    </div>
  `);

  const sessionId = crypto.randomUUID();

  const wrap = document.getElementById('cbot-wrap');
  const msgs = document.getElementById('cbot-msgs');
  const input = document.getElementById('cbot-input');
  const send = document.getElementById('cbot-send');

  document.getElementById('cbot-btn').onclick = () => wrap.classList.toggle('open');
  document.getElementById('cbot-close').onclick = () => wrap.classList.remove('open');

  function fmt(text) {
    return text
      .replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;')
      .replace(/\*\*(.+?)\*\*/g,'<strong>$1</strong>')
      .replace(/\*(.+?)\*/g,'<em>$1</em>')
      .replace(/`(.+?)`/g,'<code>$1</code>')
      .replace(/^[-*] (.+)/gm,'<li>$1</li>')
      .replace(/(<li>.*<\/li>)/gs,'<ul>$1</ul>')
      .replace(/\n/g,'<br>');
  }

  function addMsg(text, role) {
    const d = document.createElement('div');
    d.className = `cbot-msg ${role}`;
    d.innerHTML = role === 'typing'
      ? `<span class="cbot-dots"><span></span><span></span><span></span></span>`
      : fmt(text);
    msgs.appendChild(d);
    msgs.scrollTop = msgs.scrollHeight;
    return d;
  }

  async function sendMsg() {
    const text = input.value.trim();
    if (!text) return;
    input.value = '';
    send.disabled = true;
    addMsg(text, 'user');
    const typing = addMsg('', 'typing');
    try {
      const res = await fetch(API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: text, sessionId }),
      });
      const data = await res.json();
      typing.remove();
      addMsg(data.reply, 'bot');
    } catch {
      typing.remove();
      addMsg('Error connecting to server.', 'bot');
    }
    send.disabled = false;
    input.focus();
  }

  send.onclick = sendMsg;
  input.addEventListener('keydown', e => { if (e.key === 'Enter') sendMsg(); });
})();
