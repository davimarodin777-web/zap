import { NextResponse } from 'next/server';
import { getSupabase } from '../../../lib/supabase';
import { enviarTexto } from '../../../lib/whatsapp';

export const runtime = 'nodejs';

export async function GET(req) {
  const { searchParams } = new URL(req.url);
  const mode = searchParams.get('hub.mode');
  const token = searchParams.get('hub.verify_token');
  const challenge = searchParams.get('hub.challenge');
  if (mode === 'subscribe' && token && token === process.env.WHATSAPP_VERIFY_TOKEN) {
    return new NextResponse(challenge || '', { status: 200 });
  }
  return new NextResponse('Verificação inválida', { status: 403 });
}

export async function POST(req) {
  let payload;
  try {
    payload = await req.json();
  } catch {
    return NextResponse.json({ error: 'JSON inválido.' }, { status: 400 });
  }

  // A Meta também envia eventos que não contêm mensagens (ex.: statuses).
  const value = payload.entry?.[0]?.changes?.[0]?.value;
  const msg = value?.messages?.[0];
  if (!msg) return NextResponse.json({ ok: true });

  try {
    const db = getSupabase();
    const waId = msg.from;
    const phoneNumberId = value.metadata?.phone_number_id || process.env.WHATSAPP_PHONE_NUMBER_ID;
    const nome = value.contacts?.[0]?.profile?.name || 'Sem nome';
    const texto = msg.text?.body || `[Mensagem do tipo ${msg.type || 'desconhecido'}]`;

    // Idempotência: a Meta pode reenviar o mesmo webhook.
    const { data: jaRecebida, error: lookupError } = await db
      .from('mensagens').select('id').eq('wa_message_id', msg.id).maybeSingle();
    if (lookupError) throw lookupError;
    if (jaRecebida) return NextResponse.json({ ok: true, duplicada: true });

    const { data: existente, error: contatoLookupError } = await db
      .from('contatos').select('*').eq('wa_id', waId).eq('phone_number_id', phoneNumberId).maybeSingle();
    if (contatoLookupError) throw contatoLookupError;

    const { data: contato, error: contatoError } = await db
      .from('contatos')
      .upsert({
        wa_id: waId,
        phone_number_id: phoneNumberId,
        nome,
        ultima_msg: new Date().toISOString(),
        total_mensagens: (existente?.total_mensagens || 0) + 1
      }, { onConflict: 'phone_number_id,wa_id' })
      .select().single();
    if (contatoError) throw contatoError;

    const { error: insertError } = await db.from('mensagens').insert({
      contato_id: contato.id,
      wa_message_id: msg.id,
      direcao: 'entrada',
      conteudo: texto
    });
    if (insertError) throw insertError;

    let respostaEnviar = null;
    const textoNormalizado = (msg.text?.body || '').trim();

    if (textoNormalizado) {
      const { data: autos, error: autoError } = await db
        .from('automacoes')
        .select('palavra_chave,resposta')
        .eq('ativo', true)
        .order('criado_em', { ascending: true });
      if (autoError) throw autoError;

      const encontrada = (autos || []).find(a =>
        textoNormalizado.toLocaleLowerCase('pt-BR').includes(a.palavra_chave.toLocaleLowerCase('pt-BR'))
      );
      if (encontrada) respostaEnviar = encontrada.resposta;
    }

    if (!existente && !respostaEnviar) {
      respostaEnviar = `Olá, ${nome.split(' ')[0]}! 👋 Aqui é o atendimento automático. Como posso ajudar?`;
    }

    if (respostaEnviar) {
      await enviarTexto(waId, respostaEnviar);
      const { error: saidaError } = await db.from('mensagens').insert({
        contato_id: contato.id,
        direcao: 'saida',
        conteudo: respostaEnviar
      });
      if (saidaError) throw saidaError;
    }

    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error('Erro no webhook ZapFlow:', e);
    // Responder 500 permite que a Meta tente entregar o evento novamente.
    return NextResponse.json({ error: 'Falha ao processar webhook.' }, { status: 500 });
  }
}
