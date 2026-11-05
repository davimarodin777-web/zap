export async function enviarTexto(para, texto) {
  const token = process.env.WHATSAPP_TOKEN;
  const phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID;
  const version = process.env.WHATSAPP_API_VERSION || 'v22.0';
  if (!token || !phoneNumberId) throw new Error('Configure as credenciais da WhatsApp Cloud API.');

  const response = await fetch(
    `https://graph.facebook.com/${version}/${phoneNumberId}/messages`,
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        messaging_product: 'whatsapp',
        recipient_type: 'individual',
        to: para,
        type: 'text',
        text: { preview_url: false, body: texto }
      })
    }
  );

  const result = await response.json().catch(() => ({}));
  if (!response.ok) {
    console.error('WhatsApp API error:', result);
    throw new Error(result.error?.message || 'Falha ao enviar mensagem pelo WhatsApp.');
  }
  return result;
}
