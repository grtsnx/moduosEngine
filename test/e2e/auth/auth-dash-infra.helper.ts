import { createHash, generateKeyPairSync } from 'node:crypto';
import { createServer, type Server } from 'node:http';

export interface DashInfraMockServer {
  apiUrl: string;
  issueDashToken(overrides?: Record<string, unknown>): Promise<string>;
  close(): Promise<void>;
}

function sha256Hex(value: string): string {
  return createHash('sha256').update(value).digest('hex');
}

function createJsonResponseBody(data: unknown): string {
  return JSON.stringify(data);
}

function setJsonResponseHeaders(body: string): Record<string, string> {
  return {
    'content-type': 'application/json',
    'content-length': Buffer.byteLength(body).toString(),
  };
}

async function startServer(server: Server): Promise<number> {
  return new Promise((resolve, reject) => {
    server.once('error', reject);
    server.listen(0, '127.0.0.1', () => {
      const address = server.address();
      if (!address || typeof address === 'string') {
        reject(new Error('Failed to resolve dash mock server port'));
        return;
      }

      resolve(address.port);
    });
  });
}

async function stopServer(server: Server): Promise<void> {
  await new Promise<void>((resolve, reject) => {
    server.close((error) => {
      if (error) {
        reject(error);
        return;
      }

      resolve();
    });
  });
}

export async function createDashInfraMockServer(
  apiKey: string,
): Promise<DashInfraMockServer> {
  const { SignJWT, exportJWK } = await import('jose');
  const { publicKey, privateKey } = generateKeyPairSync('rsa', {
    modulusLength: 2048,
  });

  const publicJwk = await exportJWK(publicKey);
  const keyId = `dash-test-key-${Date.now()}`;

  publicJwk.kid = keyId;
  publicJwk.alg = 'RS256';
  publicJwk.use = 'sig';

  const server = createServer((req, res) => {
    const url = new URL(req.url ?? '/', 'http://127.0.0.1');

    if (req.method === 'GET' && url.pathname === '/api/auth/jwks') {
      const body = createJsonResponseBody({ keys: [publicJwk] });
      res.writeHead(200, setJsonResponseHeaders(body));
      res.end(body);
      return;
    }

    if (req.method === 'POST' && url.pathname === '/api/auth/check-jti') {
      const body = createJsonResponseBody({ valid: true });
      res.writeHead(200, setJsonResponseHeaders(body));
      res.end(body);
      return;
    }

    const body = createJsonResponseBody({ message: 'Not Found' });
    res.writeHead(404, setJsonResponseHeaders(body));
    res.end(body);
  });

  const port = await startServer(server);
  const apiUrl = `http://127.0.0.1:${port}`;

  async function issueDashToken(
    overrides: Record<string, unknown> = {},
  ): Promise<string> {
    const nowInSeconds = Math.floor(Date.now() / 1000);
    const payload = {
      apiKeyHash: sha256Hex(apiKey),
      ...overrides,
    };

    return new SignJWT(payload)
      .setProtectedHeader({ alg: 'RS256', kid: keyId, typ: 'JWT' })
      .setIssuedAt(nowInSeconds)
      .setExpirationTime(nowInSeconds + 60 * 5)
      .setJti(
        `dash-test-jti-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`,
      )
      .sign(privateKey);
  }

  return {
    apiUrl,
    issueDashToken,
    close: async () => {
      await stopServer(server);
    },
  };
}
