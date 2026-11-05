import { NextResponse } from 'next/server';
import { getSupabase } from '../../../lib/supabase';

export const runtime = 'nodejs';

export async function GET() {
  try {
    const db = getSupabase();
    const [contatos, mensagens, automacoes] = await Promise.all([
      db.from('contatos').select('*', { count: 'exact', head: true }),
      db.from('mensagens').select('*', { count: 'exact', head: true }),
      db.from('automacoes').select('*', { count: 'exact', head: true }).eq('ativo', true)
    ]);
    const error = contatos.error || mensagens.error || automacoes.error;
    if (error) throw error;
    return NextResponse.json({
      contatos: contatos.count || 0,
      mensagens: mensagens.count || 0,
      automacoes: automacoes.count || 0
    });
  } catch (e) {
    return NextResponse.json({ error: e.message || 'Erro ao consultar estatísticas.' }, { status: 500 });
  }
}
