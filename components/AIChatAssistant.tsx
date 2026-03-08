'use client';
import { useState, useRef, useEffect, useCallback } from 'react';
import { IconAI, IconSend, IconMic, IconMicOff, IconChat, IconClose, IconSparkle, IconAlert } from './Icons';

interface Message { role: 'user' | 'assistant'; content: string; }

const SUGGESTIONS = [
  '賃貸契約書を作りたい', '重要事項説明書の確認ポイントは？',
  '敷金・礼金の相場を教えて', '特約事項を提案して', '電子署名の流れを教えて',
];

export default function AIChatAssistant() {
  const [open, setOpen]       = useState(false);
  const [messages, setMessages] = useState<Message[]>([{
    role: 'assistant',
    content: 'こんにちは！PropSign AIです。\n\n契約書の作成・確認・電子署名のご案内など、何でもお手伝いします。\n\nどのようなご用件でしょうか？',
  }]);
  const [input, setInput]         = useState('');
  const [loading, setLoading]     = useState(false);
  const [error, setError]         = useState('');
  const [recording, setRecording] = useState(false);
  const [voiceOk, setVoiceOk]     = useState(false);
  const [lastTokens, setLastTokens] = useState<number|null>(null);
  const bottomRef    = useRef<HTMLDivElement>(null);
  const recognitionRef = useRef<unknown>(null);
  const inputRef     = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    const w = window as Window & { SpeechRecognition?: unknown; webkitSpeechRecognition?: unknown };
    setVoiceOk(!!(w.SpeechRecognition || w.webkitSpeechRecognition));
  }, []);

  useEffect(() => {
    if (open) {
      setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: 'smooth' }), 80);
    }
  }, [messages, open]);

  useEffect(() => {
    if (open) inputRef.current?.focus();
  }, [open]);

  const sendMessage = useCallback(async (text: string) => {
    if (!text.trim() || loading) return;
    setError('');
    const userMsg: Message = { role: 'user', content: text.trim() };
    const newMessages = [...messages, userMsg];
    setMessages(newMessages);
    setInput('');
    setLoading(true);

    try {
      const res = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: newMessages }),
      });

      const data = await res.json();

      if (!res.ok || data.error) {
        const errMsg = data.error ?? `HTTP ${res.status}`;
        // 503 = APIキー未設定
        if (res.status === 503) {
          setError('ANTHROPIC_API_KEY が未設定です。Vercel環境変数を確認してください。');
        } else {
          setError(errMsg.slice(0, 120));
        }
        setMessages(prev => prev.slice(0, -1)); // ユーザーメッセージを取り消し
        setInput(text); // 入力を戻す
        return;
      }

      const reply = data.text ?? '（応答なし）';
      setMessages(prev => [...prev, { role: 'assistant', content: reply }]);
      if (data.usage?.totalTokens) setLastTokens(data.usage.totalTokens);

    } catch (e) {
      setError('ネットワークエラー: ' + String(e).slice(0, 80));
      setMessages(prev => prev.slice(0, -1));
      setInput(text);
    } finally {
      setLoading(false);
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [messages, loading]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(input); }
  };

  // 音声入力
  type SRInstance = {
    lang: string; continuous: boolean; interimResults: boolean;
    onresult: (e: { results: { [k: number]: { [k: number]: { transcript: string } } } }) => void;
    onend: () => void; onerror: () => void; start: () => void; stop: () => void;
  };
  type SRConstructor = new () => SRInstance;

  const toggleVoice = () => {
    if (recording) {
      (recognitionRef.current as SRInstance | null)?.stop();
      setRecording(false);
      return;
    }
    const w = window as Window & { SpeechRecognition?: SRConstructor; webkitSpeechRecognition?: SRConstructor };
    const SR = w.SpeechRecognition || w.webkitSpeechRecognition;
    if (!SR) return;
    const rec = new SR();
    rec.lang = 'ja-JP'; rec.continuous = false; rec.interimResults = false;
    rec.onresult = (e) => setInput(prev => prev + e.results[0][0].transcript);
    rec.onend   = () => setRecording(false);
    rec.onerror = () => setRecording(false);
    recognitionRef.current = rec;
    rec.start();
    setRecording(true);
  };

  const formatText = (text: string) => text.split('\n').map((line, i, arr) => (
    <span key={i}>{line}{i < arr.length - 1 && <br />}</span>
  ));

  const resetChat = () => {
    setMessages([{ role: 'assistant', content: 'チャットをリセットしました。何でもお手伝いします！' }]);
    setError('');
    setLastTokens(null);
  };

  return (
    <>
      {open && (
        <div className="ai-chat-panel">
          {/* Header */}
          <div className="ai-chat-header">
            <div className="ai-chat-title">
              <IconSparkle size={15} color="var(--gold-light)" />
              PropSign AI
              {lastTokens && (
                <span style={{ fontSize: 9, opacity: 0.45, fontFamily: 'monospace', marginLeft: 6 }}>
                  {lastTokens.toLocaleString()} tok
                </span>
              )}
            </div>
            <div style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
              <button
                title="リセット"
                onClick={resetChat}
                style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '4px 6px', color: 'rgba(255,255,255,0.35)', borderRadius: 6, fontSize: 13 }}
              >⟳</button>
              <button
                onClick={() => setOpen(false)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 4, color: 'rgba(255,255,255,0.35)' }}
              ><IconClose size={15} /></button>
            </div>
          </div>

          {/* Messages */}
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
                <div className="msg-ai-bubble">
                  <div className="ai-typing"><span /><span /><span /></div>
                </div>
              </div>
            )}
            <div ref={bottomRef} />
          </div>

          {/* Error banner */}
          {error && (
            <div style={{
              margin: '0 10px 6px',
              padding: '8px 12px',
              background: 'rgba(155,35,53,0.15)',
              border: '1px solid rgba(155,35,53,0.4)',
              borderRadius: 8,
              fontSize: 11,
              color: '#f8a8a8',
              display: 'flex',
              alignItems: 'flex-start',
              gap: 6,
            }}>
              <IconAlert size={12} color="#f8a8a8" />
              <span>{error}</span>
              <button onClick={() => setError('')} style={{ marginLeft: 'auto', background: 'none', border: 'none', color: '#f8a8a8', cursor: 'pointer', fontSize: 12, padding: 0 }}>✕</button>
            </div>
          )}

          {/* Suggestions */}
          {messages.length <= 1 && !loading && (
            <div style={{ padding: '0 12px 8px', display: 'flex', gap: 5, flexWrap: 'wrap' }}>
              {SUGGESTIONS.map(s => (
                <button key={s} className="ai-suggestion" onClick={() => sendMessage(s)}>{s}</button>
              ))}
            </div>
          )}

          {/* Input */}
          <div className="ai-chat-input-row">
            {voiceOk && (
              <button
                className={`ai-voice-btn${recording ? ' recording' : ''}`}
                onClick={toggleVoice}
                title={recording ? '録音停止' : '音声入力（日本語）'}
              >
                {recording ? <IconMicOff size={14} /> : <IconMic size={14} />}
              </button>
            )}
            <textarea
              ref={inputRef}
              className="ai-chat-input"
              placeholder={recording ? '🎤 話しかけてください...' : 'メッセージを入力（Enterで送信）'}
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              rows={1}
              disabled={loading}
            />
            <button
              className="ai-chat-send"
              onClick={() => sendMessage(input)}
              disabled={!input.trim() || loading}
              title="送信"
            >
              <IconSend size={14} />
            </button>
          </div>
        </div>
      )}

      {/* FAB */}
      <button
        className="ai-chat-btn"
        onClick={() => setOpen(v => !v)}
        title="AIアシスタントを開く"
      >
        {open
          ? <IconClose size={22} color="var(--gold-light)" />
          : <IconChat  size={22} color="var(--gold-light)" />
        }
      </button>
    </>
  );
}
