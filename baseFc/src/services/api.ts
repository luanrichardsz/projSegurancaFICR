export const fetchApi = async (endpoint: string, options: RequestInit = {}, token?: string | null) => {
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  // Normaliza a URL base removendo barra final desnecessária
  const rawBaseUrl = (import.meta.env.VITE_API_URL || '').replace(/\/+$/, '');
  const cleanEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
  const url = `${rawBaseUrl}/api${cleanEndpoint}`;

  let response: Response;
  try {
    response = await fetch(url, {
      ...options,
      headers: { ...headers, ...options.headers },
    });
  } catch (netErr: any) {
    throw new Error(
      `Falha na conexão com a API (${url}). Verifique sua rede ou se o serviço no Render está ativo.`
    );
  }

  let data: any = null;
  const contentType = response.headers.get('content-type') || '';
  if (contentType.includes('application/json')) {
    data = await response.json().catch(() => null);
  }

  if (!response.ok) {
    const errorMsg =
      data?.error ||
      data?.message ||
      (response.status === 404
        ? `Recurso não encontrado (${response.status}) em ${url}`
        : response.status === 502 || response.status === 503
        ? 'O servidor no Render está iniciando (Cold Start) ou temporariamente indisponível. Aguarde alguns segundos e recarregue a página.'
        : `Erro no servidor HTTP ${response.status}: ${response.statusText}`);
    throw new Error(errorMsg);
  }

  return data ?? {};
};

