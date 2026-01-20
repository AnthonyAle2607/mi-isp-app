export interface LibreSpeedServer {
  id: number;
  name: string;
  server: string;
  dlURL: string;
  ulURL: string;
  pingURL: string;
  getIpURL: string;
  sponsorName?: string;
  sponsorURL?: string;
}

// LibreSpeed public servers - selected best ones for Americas/Europe
export const LIBRESPEED_SERVERS: LibreSpeedServer[] = [
  {
    id: 54,
    name: "Los Angeles, USA (Clouvider)",
    server: "https://la.speedtest.clouvider.net/backend",
    dlURL: "garbage.php",
    ulURL: "empty.php",
    pingURL: "empty.php",
    getIpURL: "getIP.php",
    sponsorName: "Clouvider"
  },
  {
    id: 52,
    name: "New York, USA (Clouvider)",
    server: "https://nyc.speedtest.clouvider.net/backend",
    dlURL: "garbage.php",
    ulURL: "empty.php",
    pingURL: "empty.php",
    getIpURL: "getIP.php",
    sponsorName: "Clouvider"
  },
  {
    id: 53,
    name: "Atlanta, USA (Clouvider)",
    server: "https://atl.speedtest.clouvider.net/backend",
    dlURL: "garbage.php",
    ulURL: "empty.php",
    pingURL: "empty.php",
    getIpURL: "getIP.php",
    sponsorName: "Clouvider"
  },
  {
    id: 78,
    name: "Virginia, USA (OVH)",
    server: "https://speed.riverside.rocks/",
    dlURL: "garbage.php",
    ulURL: "empty.php",
    pingURL: "empty.php",
    getIpURL: "getIP.php",
    sponsorName: "Riverside Rocks"
  },
  {
    id: 91,
    name: "Los Angeles, USA (Sharktech)",
    server: "https://laxspeed.sharktech.net",
    dlURL: "backend/garbage.php",
    ulURL: "backend/empty.php",
    pingURL: "backend/empty.php",
    getIpURL: "backend/getIP.php",
    sponsorName: "Sharktech"
  },
  {
    id: 51,
    name: "Amsterdam, Netherlands (Clouvider)",
    server: "https://ams.speedtest.clouvider.net/backend",
    dlURL: "garbage.php",
    ulURL: "empty.php",
    pingURL: "empty.php",
    getIpURL: "getIP.php",
    sponsorName: "Clouvider"
  },
  {
    id: 50,
    name: "Frankfurt, Germany (Clouvider)",
    server: "https://fra.speedtest.clouvider.net/backend",
    dlURL: "garbage.php",
    ulURL: "empty.php",
    pingURL: "empty.php",
    getIpURL: "getIP.php",
    sponsorName: "Clouvider"
  },
  {
    id: 49,
    name: "London, UK (Clouvider)",
    server: "https://lon.speedtest.clouvider.net/backend",
    dlURL: "garbage.php",
    ulURL: "empty.php",
    pingURL: "empty.php",
    getIpURL: "getIP.php",
    sponsorName: "Clouvider"
  }
];

export const getServerUrl = (server: LibreSpeedServer, endpoint: 'dl' | 'ul' | 'ping' | 'ip'): string => {
  const baseUrl = server.server.endsWith('/') ? server.server : `${server.server}/`;
  
  switch (endpoint) {
    case 'dl':
      return `${baseUrl}${server.dlURL}`;
    case 'ul':
      return `${baseUrl}${server.ulURL}`;
    case 'ping':
      return `${baseUrl}${server.pingURL}`;
    case 'ip':
      return `${baseUrl}${server.getIpURL}`;
  }
};

export const measurePingToServer = async (server: LibreSpeedServer): Promise<number> => {
  const url = getServerUrl(server, 'ping');
  const iterations = 3;
  let totalPing = 0;
  let successfulPings = 0;

  for (let i = 0; i < iterations; i++) {
    const start = performance.now();
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000);
      
      await fetch(`${url}?r=${Math.random()}`, { 
        method: 'GET',
        cache: 'no-cache',
        mode: 'cors',
        signal: controller.signal
      });
      
      clearTimeout(timeoutId);
      const end = performance.now();
      totalPing += end - start;
      successfulPings++;
    } catch {
      // Skip failed ping
    }
  }

  return successfulPings > 0 ? totalPing / successfulPings : 9999;
};

export const findBestServer = async (servers: LibreSpeedServer[]): Promise<LibreSpeedServer> => {
  const pingResults = await Promise.all(
    servers.slice(0, 4).map(async (server) => ({
      server,
      ping: await measurePingToServer(server)
    }))
  );

  pingResults.sort((a, b) => a.ping - b.ping);
  return pingResults[0]?.server || servers[0];
};
