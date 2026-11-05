'use client';

import { useCallback, useEffect, useState } from 'react';

export default function Home() {
  const [stats, setStats] = useState({ contatos: 0, mensagens: 0, automacoes: 0 });
  const [autos, setAutos] = useState([]);
  const [palavra, setPalavra] = useState('');
  const [resposta, setResposta] = useState('');
  const [erro, setErro] = useState('');
  const [aviso, setAviso] = useState('');
  const [salvando, setSalvando] = useState(false);

  const carregar = useCallback(async () => {
    try {
      const [s, a] = await Promise.all([
        fetch('/api/stats').then(r => r.json()),
        fetch('/api/automations').then(r => r.json())
      ]);
      if (!s.error) setStats(s);
      if (!a.error) setAutos(a.dados || []);
      if (s.error || a.error) setErro(s.error || a.error);
    } catch {
      setErro('Não foi possível carregar os dados. Confira as variáveis de ambiente e o banco.');
    }
  }, []);

  useEffect(() => { carregar(); }, [carregar]);

  async function criar(e) {
    e.preventDefault();
    setErro('');
    setAviso('');
    if (!palavra.trim() || !resposta.trim()) {
      setErro('Preencha a palavra-chave e a resposta.');
      return;
    }
    setSalvando(true);
    try {
      const r = await fetch('/api/automations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ palavra_chave: palavra.trim(), resposta: resposta.trim() })
      });
      const data = await r.json();
      if (!r.ok) throw new Error(data.error || 'Não foi possível criar a automação.');
      setPalavra('');
      setResposta('');
      setAviso('Automação criada.');
      await carregar();
    } catch (e) {
      setErro(e.message);
    } finally {
      setSalvando(false);
    }
  }

  async function excluir(id) {
    setErro('');
    try {
      const r = await fetch('/api/automations?id=' + encodeURIComponent(id), { method: 'DELETE' });
      const data = await r.json();
      if (!r.ok) throw new Error(data.error || 'Não foi possível excluir.');
      await carregar();
    } catch (e) {
      setErro(e.message);
    }
  }

  return (
    <main>
      <h1>ZapFlow</h1>
      <p className="sub">Automação de atendimento do WhatsApp Business</p>
      <div className="notice">O painel ficará conectado ao WhatsApp depois que você configurar a Meta Cloud API, o Supabase e as variáveis de ambiente na Vercel.</div>
      {erro && <p className="error">{erro}</p>}
      {aviso && <p className="success">{aviso}</p>}

      <div className="grid">
        <div className="card"><div className="num">{stats.contatos}</div><div className="lbl">Contatos registrados</div></div>
        <div className="card"><div className="num">{stats.mensagens}</div><div className="lbl">Mensagens registradas</div></div>
        <div className="card"><div className="num">{stats.automacoes}</div><div className="lbl">Automações ativas</div></div>
      </div>

      <section className="painel">
        <h2>Nova automação por palavra-chave</h2>
        <form onSubmit={criar}>
          <input aria-label="Palavra-chave" placeholder="Palavra-chave (ex.: preço)" value={palavra} onChange={e => setPalavra(e.target.value)} />
          <input aria-label="Resposta automática" placeholder="Resposta automática" value={resposta} onChange={e => setResposta(e.target.value)} />
          <button type="submit" disabled={salvando}>{salvando ? 'Salvando...' : 'Criar automação'}</button>
        </form>
        <p className="muted" style={{marginTop:12}}>A resposta será enviada quando uma mensagem recebida contiver a palavra-chave cadastrada.</p>
      </section>

      <section className="painel">
        <h2>Automações cadastradas</h2>
        {autos.length === 0 ? <p className="empty">Nenhuma automação cadastrada ainda.</p> : (
          <table>
            <thead><tr><th>Palavra-chave</th><th>Resposta</th><th>Status</th><th>Ação</th></tr></thead>
            <tbody>{autos.map(a => (
              <tr key={a.id}>
                <td>{a.palavra_chave}</td>
                <td>{a.resposta}</td>
                <td><span className="tag">Ativa</span></td>
                <td><button className="del" onClick={() => excluir(a.id)}>Excluir</button></td>
              </tr>
            ))}</tbody>
          </table>
        )}
      </section>
    </main>
  );
}
