'use client';
import { useState, useRef, useEffect, useCallback } from 'react';
import { IconAI, IconSend, IconMic, IconMicOff, IconChat, IconClose, IconSparkle } from './Icons';

interface Message { role: 'user' | 'assistant'; content: string; }

const SUGGESTIONS = [
  '賃貸契約書を作りたい', '重要事項説明書の確認',
  'この物件の契約金を計算して', '特約事項を提案して', '電子署名の送り方は？',
];

export default function AIChatAssistant() {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([{
    role: 'assistant',
    content: 'こんにちは！PropSign AIです。\n\n契約書の作成・確認・電子署名のご案内など、何でもお手伝いします。\n\nどのようなご用件でしょうか？',
  }]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [recording, setRecording] = useState(false);
  const [voiceSupported, setVoiceSupported] = useState(false);
  const [lastTokens, setLastTokens] = useState<number | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const recognitionRef = useRef<unknown>(null);

  useEffect(() => {
    const w = window as Window & { SpeechRecognition?: unknown; webkitSpeechRecognition?: unknown };
    setVoiceSupported(!!(w.SpeechRecognition || w.webkitSpeechRecognition));
  }, []);

  useEffect(() => {
    if (open) bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, open]);

  const sendMessage = useCallback(async (text: string) => {
    if (!text.trim() || loading) return;
    const userMsg: Message = { role: 'user', content: text.trim() };
    const newMessages = [...messages, userMsg];
    setMessages(newMessages);
    setInput('');
    setLoading(true);

    try {
      // API Route経由（トークン追跡付き）
      const res = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: newMessages }),
      });

      if (!res.ok) {
        // API未設定時はフォールバック
        const fallback = await directAnthropicCall(newMessages);
        setMessages(prev => [...prev, { role: 'assistant', content: fallback }]);
        return;
      }

      const data = await res.json();
      const reply = data.text ?? 'エラーが発生しました。';
      setMessages(prev => [...prev, { role: 'assistant', content: reply }]);
      if (data.usage?.totalTokens) setLastTokens(data.usage.totalTokens);
    } catch {
      try {
        const fallback = await directAnthropicCall(newMessages);
        setMessages(prev => [...prev, { role: 'assistant', content: fallback }]);
      } catch {
        setMessages(prev => [...prev, { role: 'assistant', content: 'ネットワークエラーが発生しました。接続を確認してください。' }]);
      }
    } finally {
      setLoading(false);
    }
  }, [messages, loading]);

  // フォールバック直接API呼び出し
  const directAnthropicCall = async (msgs: Message[]) => {
    const res = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 600,
        system: 'あなたは不動産契約の専門AIアシスタント「PropSign AI」です。宅建業法に準拠した契約支援を行います。',
        messages: msgs,
      }),
    });
    const data = await res.json();
    return data.content?.[0]?.text ?? 'エラーが発生しました。';
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(input); }
  };

  const toggleVoice = () => {
    if (recording) {
      (recognitionRef.current as { stop: () => void } | null)?.stop();
      setRecording(false);
      return;
    }
    const w = window as Window & { SpeechRecognition?: new() => { lang: string; continuous: boolean; interimResults: boolean; onresult: (e: { results: { [0]: { [0]: { transcript: string } } } }) => void; onend: () => void; onerror: () => void; start: () => void; stop: () => void; }; webkitSpeechRecognition?: new() => { lang: string; continuous: boolean; interimResults: boolean; onresult: (e: { results: { [0]: { [0]: { transcript: string } } } }) => void; onend: () => void; onerror: () => void; start: () => void; stop: () => void; } };
    const SR = w.SpeechRecognition || w.webkitSpeechRecognition;
    if (!SR) return;
    const rec = new SR();
    rec.lang = 'ja-JP'; rec.continuous = false; rec.interimResults = false;
    rec.onresult = (e: { results: { [0]: { [0]: { transcript: string } } } }) => setInput(prev => prev + e.results[0][0].transcript);
    rec.onend = () => setRecording(false);
    rec.onerror = () => setRecording(false);
    recognitionRef.current = rec;
    rec.start();
    setRecording(true);
  };

  const formatText = (text: string) => text.split('\n').map((line, i, arr) => (
    <span key={i}>{line}{i < arr.length - 1 && <br />}</span>
  ));

  return (
    <>
      {open && (
        <div className="ai-chat-panel">
          <div className="ai-chat-header">
            <div className="ai-chat-title">
              <IconSparkle size={16} color="var(--gold-light)" />
              PropSign AI
              {lastTokens && <span style={{ fontSize: 9, opacity: 0.5, fontFamily: 'monospace', marginLeft: 4 }}>{lastTokens}tok</span>}
            </div>
            <div style={{ display: 'flex', gap: 6 }}>
              <button style={{ color: 'rgba(255,255,255,0.4)', background: 'none', border: 'none', cursor: 'pointer', padding: 4 }}
                onClick={() => setMessages([{ role: 'assistant', content: 'チャットをリセットしました。何でもお手伝いします！' }])}>
                <IconSparkle size={13} />
              </button>
              <button style={{ color: 'rgba(255,255,255,0.4)', background: 'none', border: 'none', cursor: 'pointer', padding: 4 }}
                onClick={() => setOpen(false)}>
                <IconClose size={16} />
              </button>
            </div>
          </div>

          <div className="ai-chat-messages">
            {messages.map((msg, i) => (
              <div key={i}>
                {msg.role === 'assistant' ? (
                  <div className="msg-ai">
                    <div className="msg-ai-avatar"><IconAI size={14} color="var(--gold-light)" /></div>
                    <div className="msg-ai-bubble">{formatText(msg.content)}</div>
                  </div>
                ) : (
                  <div className="msg-user">
                    <div className="msg-user-bubble">{formatText(msg.content)}</div>
                  </div>
                )}
              </div>
            ))}
            {loading && (
              <div className="msg-ai">
                <div className="msg-ai-avatar"><IconAI size={14} color="var(--gold-light)" /></div>
                <div className="msg-ai-bubble"><div className="ai-typing"><span /><span /><span /></div></div>
              </div>
            )}
            <div ref={bottomRef} />
          </div>

          {messages.length <= 1 && (
            <div style={{ padding: '0 14px 10px', display: 'flex', gap: 6, flexWrap: 'wrap' }}>
              {SUGGESTIONS.map((s) => (
                <button key={s} className="ai-suggestion" onClick={() => sendMessage(s)}>{s}</button>
              ))}
            </div>
          )}

          <div className="ai-chat-input-row">
            {voiceSupported && (
              <button className={`ai-voice-btn ${recording ? 'recording' : ''}`} onClick={toggleVoice} title={recording ? '録音停止' : '音声入力'}>
                {recording ? <IconMicOff size={15} /> : <IconMic size={15} />}
              </button>
            )}
            <textarea
              className="ai-chat-input"
              placeholder={recording ? '🎤 聴いています...' : 'メッセージを入力（Shift+Enterで改行）'}
              value={input} onChange={e => setInput(e.target.value)}
              onKeyDown={handleKeyDown} rows={1} disabled={loading}
            />
            <button className="ai-chat-send" onClick={() => sendMessage(input)} disabled={!input.trim() || loading}>
              <IconSend size={14} />
            </button>
          </div>
        </div>
      )}

      <button className="ai-chat-btn" onClick={() => setOpen(!open)} title="AIアシスタント">
        {open ? <IconClose size={22} color="var(--gold-light)" /> : <IconChat size={22} color="var(--gold-light)" />}
      </button>
    </>
  );
}
