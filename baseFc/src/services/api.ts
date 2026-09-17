export const fetchApi = async (endpoint: string, options: RequestInit = {}, token?: string | null) => {
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(`/api${endpoint}`, {
    ...options,
    headers: { ...headers, ...options.headers },
  });

  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.error || 'Erro na requisição');
  }

  return data;
};
