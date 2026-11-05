import { NextResponse } from 'next/server';
import { getSupabase } from '../../../lib/supabase';

export const runtime = 'nodejs';

export async function GET() {
  try {
    const { data, error } = await getSupabase()
      .from('automacoes').select('*').order('criado_em', { ascending: false });
    if (error) throw error;
    return NextResponse.json({ dados: data || [] });
  } catch (e) {
    return NextResponse.json({ error: e.message || 'Erro ao listar automações.' }, { status: 500 });
  }
}

export async function POST(req) {
  try {
    const corpo = await req.json();
    const palavra = String(corpo.palavra_chave || '').trim();
    const resposta = String(corpo.resposta || '').trim();
    if (!palavra || !resposta) {
      return NextResponse.json({ error: 'Palavra-chave e resposta são obrigatórias.' }, { status: 400 });
    }
    const { data, error } = await getSupabase()
      .from('automacoes')
      .insert({ palavra_chave: palavra, resposta, ativo: true })
      .select().single();
    if (error) throw error;
    return NextResponse.json({ dados: data }, { status: 201 });
  } catch (e) {
    return NextResponse.json({ error: e.message || 'Erro ao criar automação.' }, { status: 500 });
  }
}

export async function DELETE(req) {
  try {
    const id = new URL(req.url).searchParams.get('id');
    if (!id) return NextResponse.json({ error: 'ID obrigatório.' }, { status: 400 });
    const { error } = await getSupabase().from('automacoes').delete().eq('id', id);
    if (error) throw error;
    return NextResponse.json({ ok: true });
  } catch (e) {
    return NextResponse.json({ error: e.message || 'Erro ao excluir automação.' }, { status: 500 });
  }
}
