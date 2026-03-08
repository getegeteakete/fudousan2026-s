'use client';
import { useState, useRef, useEffect, useCallback } from 'react';
import { IconAI, IconSend, IconMic, IconMicOff, IconChat, IconClose, IconSparkle } from './Icons';

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

const SUGGESTIONS = [
  '賃貸契約書を作りたい',
  '重要事項説明書の確認',
  'この物件の契約金を計算して',
  '特約事項を提案して',
  '電子署名の送り方は？',
];

const SYSTEM_PROMPT = `あなたは不動産会社のAIアシスタント「PropSign AI」です。
宅地建物取引業法・電子帳簿保存法・電子署名法の専門知識を持ち、不動産の賃貸借契約・売買契約・媒介契約・管理委託契約のすべてに精通しています。

役割：
- 契約書の作成を手順ごとにガイドする
- 重要事項説明書の確認ポイントを提示する
- 特約条項の草案を提案する
- 法的リスクを分かりやすく説明する（最終判断は宅建士に委ねる旨を添える）
- 契約金（敷金・礼金・仲介手数料）の計算を補助する
- 電子署名・電子契約の流れを案内する

応答スタイル：
- 簡潔かつ丁寧に（200字以内を目安）
- 箇条書きで手順を示す場合は番号付きリストを使う
- 重要な注意は「⚠️」マーク、完了事項は「✅」マークを使う
- 常にユーザーに寄り添い、次のアクションを提案する
- 法的判断の最終確認は「宅建士にご確認ください」と明示する

現在のシステム：PropSign 不動産電子契約システム
対応契約種別：賃貸借契約・売買契約・媒介契約・管理委託契約`;

export default function AIChatAssistant() {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      role: 'assistant',
      content: 'こんにちは！PropSign AIです。\n\n契約書の作成・確認・電子署名のご案内など、何でもお手伝いします。\n\nどのようなご用件でしょうか？',
    },
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [recording, setRecording] = useState(false);
  const [voiceSupported, setVoiceSupported] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const recognitionRef = useRef<unknown>(null);

  useEffect(() => {
    const SpeechRecognitionAPI = (window as Window & { SpeechRecognition?: new() => { stop: () => void } }).SpeechRecognition ||
      (window as Window & { webkitSpeechRecognition?: new() => { stop: () => void } }).webkitSpeechRecognition;
    setVoiceSupported(!!SpeechRecognitionAPI);
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
      const response = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: 'claude-sonnet-4-20250514',
          max_tokens: 600,
          system: SYSTEM_PROMPT,
          messages: newMessages.map(m => ({ role: m.role, content: m.content })),
        }),
      });
      const data = await response.json();
      const reply = data.content?.[0]?.text || 'すみません、少し問題が発生しました。もう一度お試しください。';
      setMessages(prev => [...prev, { role: 'assistant', content: reply }]);
    } catch {
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: 'ネットワークエラーが発生しました。接続を確認してください。',
      }]);
    } finally {
      setLoading(false);
    }
  }, [messages, loading]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage(input);
    }
  };

  const toggleVoice = () => {
    if (recording) {
      (recognitionRef.current as { stop: () => void } | null)?.stop();
      setRecording(false);
      return;
    }
    const SpeechRecognitionAPI = (window as Window & { SpeechRecognition?: new() => { lang: string; continuous: boolean; interimResults: boolean; onresult: (e: { results: { [0]: { [0]: { transcript: string } } } }) => void; onend: () => void; onerror: () => void; start: () => void; stop: () => void; }; webkitSpeechRecognition?: new() => { lang: string; continuous: boolean; interimResults: boolean; onresult: (e: { results: { [0]: { [0]: { transcript: string } } } }) => void; onend: () => void; onerror: () => void; start: () => void; stop: () => void; } }).SpeechRecognition ||
      (window as Window & { webkitSpeechRecognition?: new() => { lang: string; continuous: boolean; interimResults: boolean; onresult: (e: { results: { [0]: { [0]: { transcript: string } } } }) => void; onend: () => void; onerror: () => void; start: () => void; stop: () => void; } }).webkitSpeechRecognition;
    if (!SpeechRecognitionAPI) return;
    const rec = new SpeechRecognitionAPI();
    rec.lang = 'ja-JP';
    rec.continuous = false;
    rec.interimResults = false;
    rec.onresult = (e: { results: { [0]: { [0]: { transcript: string } } } }) => {
      const transcript = e.results[0][0].transcript;
      setInput(prev => prev + transcript);
    };
    rec.onend = () => setRecording(false);
    rec.onerror = () => setRecording(false);
    recognitionRef.current = rec;
    rec.start();
    setRecording(true);
  };

  const formatText = (text: string) => {
    return text.split('\n').map((line, i) => (
      <span key={i}>
        {line}
        {i < text.split('\n').length - 1 && <br />}
      </span>
    ));
  };

  return (
    <>
      {/* Chat panel */}
      {open && (
        <div className="ai-chat-panel">
          {/* Header */}
          <div className="ai-chat-header">
            <div className="ai-chat-title">
              <IconSparkle size={16} color="var(--gold-light)" />
              PropSign AI アシスタント
            </div>
            <div style={{ display: 'flex', gap: 6 }}>
              <button
                className="btn btn-icon"
                style={{ color: 'rgba(255,255,255,0.5)', background: 'transparent', border: 'none', padding: 4, cursor: 'pointer' }}
                onClick={() => setMessages([{ role: 'assistant', content: 'こんにちは！PropSign AIです。\n\n何でもお手伝いします。どのようなご用件でしょうか？' }])}
                title="チャットをリセット"
              >
                <IconSparkle size={14} />
              </button>
              <button
                className="btn btn-icon"
                style={{ color: 'rgba(255,255,255,0.5)', background: 'transparent', border: 'none', padding: 4, cursor: 'pointer' }}
                onClick={() => setOpen(false)}
              >
                <IconClose size={16} />
              </button>
            </div>
          </div>

          {/* Messages */}
          <div className="ai-chat-messages">
            {messages.map((msg, i) => (
              <div key={i}>
                {msg.role === 'assistant' ? (
                  <div className="msg-ai">
                    <div className="msg-ai-avatar">
                      <IconAI size={14} color="var(--gold-light)" />
                    </div>
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
                <div className="msg-ai-avatar">
                  <IconAI size={14} color="var(--gold-light)" />
                </div>
                <div className="msg-ai-bubble">
                  <div className="ai-typing">
                    <span /><span /><span />
                  </div>
                </div>
              </div>
            )}
            <div ref={bottomRef} />
          </div>

          {/* Quick suggestions */}
          {messages.length <= 1 && (
            <div style={{ padding: '0 14px 10px', display: 'flex', gap: 6, flexWrap: 'wrap' }}>
              {SUGGESTIONS.map((s) => (
                <button key={s} className="ai-suggestion" onClick={() => sendMessage(s)}>
                  {s}
                </button>
              ))}
            </div>
          )}

          {/* Input */}
          <div className="ai-chat-input-row">
            {voiceSupported && (
              <button
                className={`ai-voice-btn ${recording ? 'recording' : ''}`}
                onClick={toggleVoice}
                title={recording ? '録音停止' : '音声入力'}
              >
                {recording ? <IconMicOff size={15} /> : <IconMic size={15} />}
              </button>
            )}
            <textarea
              ref={inputRef}
              className="ai-chat-input"
              placeholder={recording ? '🎤 聴いています...' : 'メッセージを入力（Shift+Enterで改行）'}
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
            >
              <IconSend size={14} />
            </button>
          </div>
        </div>
      )}

      {/* FAB button */}
      <button
        className="ai-chat-btn"
        onClick={() => setOpen(!open)}
        title="AIアシスタント"
      >
        {open ? <IconClose size={22} color="var(--gold-light)" /> : <IconChat size={22} color="var(--gold-light)" />}
      </button>
    </>
  );
}
