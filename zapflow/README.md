# ZapFlow

Projeto Next.js para painel de automações de atendimento via WhatsApp Business Cloud API, com Supabase como banco de dados.

## O que está incluído
- Dashboard com contadores.
- Cadastro e exclusão de automações por palavra-chave.
- Webhook GET para verificação da Meta e POST para receber mensagens.
- Registro de contatos e histórico de mensagens.
- Resposta automática por palavra-chave e saudação no primeiro contato.
- SQL do banco em `supabase/schema.sql`.

## Antes de publicar
Este repositório é uma base funcional, mas depende das suas credenciais e da configuração externa da Meta e do Supabase. Não coloque credenciais reais no código nem no GitHub.

### 1. Supabase
1. Crie um projeto no Supabase.
2. Abra SQL Editor e execute `supabase/schema.sql`.
3. Copie Project URL e `service_role` key em Project Settings > API.
4. Cadastre `SUPABASE_URL` e `SUPABASE_SERVICE_ROLE_KEY` nas variáveis de ambiente da Vercel.

A chave `service_role` dá acesso elevado ao banco. Ela é usada somente em rotas server-side e nunca deve ser exposta no navegador.

### 2. Meta WhatsApp Cloud API
1. Configure um aplicativo em Meta for Developers e adicione WhatsApp.
2. Configure o número e obtenha o Phone Number ID e um token de acesso adequado.
3. Na configuração de Webhooks, use:
   `https://SEU-DOMINIO.vercel.app/api/webhook`
4. Use o mesmo valor de `WHATSAPP_VERIFY_TOKEN` no painel da Meta.
5. Assine o campo `messages`.
6. Configure `WHATSAPP_TOKEN`, `WHATSAPP_PHONE_NUMBER_ID` e `WHATSAPP_API_VERSION` na Vercel.

A Meta aplica regras próprias para mensagens iniciadas pela empresa, modelos aprovados e janela de atendimento. O sistema responde a mensagens recebidas; não é uma ferramenta para disparo indiscriminado.

### 3. Vercel
1. Envie a pasta para um repositório GitHub.
2. Importe o repositório em Vercel.
3. Adicione todas as variáveis do `.env.example` em Project Settings > Environment Variables.
4. Faça Deploy.

## Desenvolvimento local
```bash
npm install
cp .env.example .env.local
npm run dev
```

## Observações importantes
- O endpoint de administração deste MVP não possui login. Antes de usar em produção com dados reais, implemente autenticação e autorização.
- Configure e valide a assinatura `X-Hub-Signature-256` da Meta com `META_APP_SECRET` antes de considerar o webhook endurecido para produção.
- A Meta pode reenviar eventos. O código registra o ID da mensagem e ignora duplicatas.
- Mensagens de texto recebidas são processadas. Outros tipos de mídia são registrados com uma descrição genérica.
- A saudação inicial é enviada somente quando não existe contato anterior no banco. A lógica usa a tabela `contatos`.
