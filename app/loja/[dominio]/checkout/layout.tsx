import React from 'react';

// Layout específico para checkout - SEM header e footer da loja
// Layout vazio para checkout - sem header/footer
export default function CheckoutLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
