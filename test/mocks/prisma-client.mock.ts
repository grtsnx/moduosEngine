export const mockPrismaConnect = jest.fn().mockResolvedValue(undefined);
export const mockPrismaDisconnect = jest.fn().mockResolvedValue(undefined);
export const mockPrismaQueryRaw = jest
  .fn()
  .mockResolvedValue([{ '?column?': 1 }]);

export class PrismaClient {
  $connect = mockPrismaConnect;
  $disconnect = mockPrismaDisconnect;
  $queryRaw = mockPrismaQueryRaw;
}
