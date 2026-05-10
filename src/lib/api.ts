export const BACKEND_URL =
  (import.meta.env.VITE_BACKEND_URL as string | undefined) ?? 'http://127.0.0.1:5000';
const API_KEY = import.meta.env.VITE_API_KEY as string | undefined;

export async function fetchApi(endpoint: string, options: RequestInit = {}) {
  const url = `${BACKEND_URL}${endpoint}`;
  const response = await fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(API_KEY ? { 'X-API-Key': API_KEY } : {}),
      ...options.headers,
    },
  });
  if (!response.ok) {
    throw new Error(`API error: ${response.statusText}`);
  }
  return response.json();
}

export const api = {
  getHealth: () => fetchApi('/api/health'),
  getStats: () => fetchApi('/api/stats'),
  getDevice: () => fetchApi('/api/device'),
  getConnections: (limit = 100) => fetchApi(`/api/connections?limit=${limit}`),
  getInterfaces: () => fetchApi('/api/capture/interfaces'),
  startCapture: (iface: string | null, useWsl = false) => 
    fetchApi('/api/capture/start', { method: 'POST', body: JSON.stringify({ iface, use_wsl: useWsl }) }),
  stopCapture: () => fetchApi('/api/capture/stop', { method: 'POST' }),
  getPackets: (since = 0) => fetchApi(`/api/capture/packets?since=${since}`),
  controlMonitor: (action: 'start' | 'stop') => 
    fetchApi('/api/control', { method: 'POST', body: JSON.stringify({ action }) }),
  scanBluetooth: () => fetchApi('/api/bluetooth/scan'),
  scanWifi: () => fetchApi('/api/wifi/scan'),
  lookupMac: (mac: string) => fetchApi(`/api/mac/lookup?mac=${encodeURIComponent(mac)}`),
  scanIp: (ip: string) => fetchApi(`/api/scan/ip?ip=${encodeURIComponent(ip)}`),
  scanFile: (formData: FormData) => fetch( `${BACKEND_URL}/api/scan/file`, { method: 'POST', body: formData }).then(r => r.json()),
  scanPhone: () => fetchApi('/api/phone/scan'),
  phoneDeepScan: (path: string) => fetchApi('/api/phone/deep-scan', { method: 'POST', body: JSON.stringify({ path }) }),
  phoneVtCheck: (packages: string[]) => fetchApi('/api/phone/vt-check', { method: 'POST', body: JSON.stringify({ packages }) }),
  getMalwareLib: () => fetchApi('/api/malware/library'),
  deployMalware: (sample_id: number, channel: string, target: string) => 
    fetchApi('/api/malware/deploy', { method: 'POST', body: JSON.stringify({ sample_id, channel, target }) }),
  chat: (message: string, history: any[]) => 
    fetchApi('/api/chat', { method: 'POST', body: JSON.stringify({ message, history }) }),
};
