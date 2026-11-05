import './globals.css';

export const metadata = {
  title: 'ZapFlow - Automação WhatsApp',
  description: 'Painel de automação para WhatsApp Business'
};

export default function RootLayout({ children }) {
  return (
    <html lang="pt-BR">
      <body>{children}</body>
    </html>
  );
}
