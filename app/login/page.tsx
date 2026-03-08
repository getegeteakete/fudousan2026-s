'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createBrowserSupabase } from '@/lib/supabase-client';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [mode, setMode] = useState<'login' | 'signup' | 'reset'>('login');
  const [done, setDone] = useState('');

  const supabase = createBrowserSupabase();

  const handleSubmit = async () => {
    setLoading(true); setError(''); setDone('');
    try {
      if (mode === 'login') {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        router.push('/dashboard');
      } else if (mode === 'signup') {
        const { error } = await supabase.auth.signUp({
          email, password,
          options: { emailRedirectTo: `${window.location.origin}/api/auth/callback` },
        });
        if (error) throw error;
        setDone('確認メールを送信しました。メールボックスをご確認ください。');
      } else {
        const { error } = await supabase.auth.resetPasswordForEmail(email, {
          redirectTo: `${window.location.origin}/login?mode=update`,
        });
        if (error) throw error;
        setDone('パスワードリセットメールを送信しました。');
      }
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      minHeight: '100vh', background: 'var(--bg)', display: 'flex', alignItems: 'center',
      justifyContent: 'center', padding: 20,
      backgroundImage: 'radial-gradient(ellipse at 50% 0%, rgba(26,37,64,0.08) 0%, transparent 70%)',
    }}>
      <div style={{ width: '100%', maxWidth: 420 }}>
        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: 36 }}>
          <div style={{
            width: 60, height: 60, borderRadius: 16,
            background: 'linear-gradient(135deg, var(--navy-deep) 0%, var(--navy-light) 100%)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            margin: '0 auto 14px',
            border: '1px solid rgba(184,148,74,0.3)',
            boxShadow: '0 8px 24px rgba(26,37,64,0.2)',
          }}>
            <svg width={28} height={28} viewBox="0 0 24 24" fill="none" stroke="var(--gold-light)" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round">
              <path d="M14 2L20 8L20 22L4 22L4 2Z" />
              <path d="M14 2L14 8L20 8" />
              <path d="M9 12L11 14L15 10" />
            </svg>
          </div>
          <div style={{ fontFamily: 'Shippori Mincho, serif', fontSize: 22, fontWeight: 700, color: 'var(--navy-deep)', letterSpacing: '0.08em' }}>PropSign</div>
          <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 3, letterSpacing: '0.1em' }}>不動産電子契約システム</div>
        </div>

        <div className="card" style={{ boxShadow: '0 4px 24px rgba(26,37,64,0.10)' }}>
          <div style={{ padding: '28px 28px 0' }}>
            <div style={{ display: 'flex', gap: 0, marginBottom: 24, borderBottom: '1px solid var(--border)' }}>
              {[{ key: 'login', label: 'ログイン' }, { key: 'signup', label: '新規登録' }].map(t => (
                <button key={t.key} onClick={() => setMode(t.key as 'login' | 'signup')} style={{
                  flex: 1, padding: '10px', border: 'none', background: 'none', cursor: 'pointer',
                  fontSize: 13, fontWeight: 700, color: mode === t.key ? 'var(--navy)' : 'var(--text-muted)',
                  borderBottom: `2px solid ${mode === t.key ? 'var(--navy)' : 'transparent'}`,
                  marginBottom: -1, transition: 'all 0.15s',
                }}>{t.label}</button>
              ))}
            </div>
          </div>

          <div style={{ padding: '0 28px 28px' }}>
            {done && <div className="alert alert-success" style={{ marginBottom: 16 }}><span>✓</span> {done}</div>}
            {error && <div className="alert alert-danger" style={{ marginBottom: 16 }}><span>⚠</span> {error}</div>}

            <div className="form-group">
              <label className="form-label">メールアドレス</label>
              <input className="form-input" type="email" placeholder="admin@example.com"
                value={email} onChange={e => setEmail(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleSubmit()} autoFocus />
            </div>

            {mode !== 'reset' && (
              <div className="form-group">
                <label className="form-label">パスワード</label>
                <input className="form-input" type="password" placeholder="8文字以上"
                  value={password} onChange={e => setPassword(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && handleSubmit()} />
              </div>
            )}

            <button className="btn btn-primary btn-lg w-full" style={{ marginTop: 8 }}
              disabled={loading || !email || (mode !== 'reset' && !password)} onClick={handleSubmit}>
              {loading ? '処理中...' : mode === 'login' ? 'ログイン' : mode === 'signup' ? 'アカウント作成' : 'リセットメール送信'}
            </button>

            {mode === 'login' && (
              <button style={{ display: 'block', width: '100%', textAlign: 'center', marginTop: 14, fontSize: 12, color: 'var(--text-muted)', background: 'none', border: 'none', cursor: 'pointer' }}
                onClick={() => setMode('reset')}>
                パスワードをお忘れですか？
              </button>
            )}
            {mode !== 'login' && (
              <button style={{ display: 'block', width: '100%', textAlign: 'center', marginTop: 14, fontSize: 12, color: 'var(--text-muted)', background: 'none', border: 'none', cursor: 'pointer' }}
                onClick={() => setMode('login')}>
                ← ログインに戻る
              </button>
            )}
          </div>
        </div>

        {/* Security badges */}
        <div style={{ display: 'flex', justifyContent: 'center', gap: 20, marginTop: 24, flexWrap: 'wrap' }}>
          {['TLS 1.3 暗号化', '宅建業法準拠', '電子帳簿保存法対応'].map(label => (
            <div key={label} style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 11, color: 'var(--text-muted)' }}>
              <svg width={10} height={10} viewBox="0 0 24 24" fill="none" stroke="var(--green)" strokeWidth={2.5}><path d="M4 12L9 17L20 6" /></svg>
              {label}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
