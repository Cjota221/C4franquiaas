const handler = async (request: Request) => {
  const url = new URL(request.url);
  
  // Se for uma rota de loja, redireciona corretamente
  if (url.pathname.startsWith('/loja/')) {
    return;
  }
  
  return;
};

export default handler;
export const config = { path: "/*" };
