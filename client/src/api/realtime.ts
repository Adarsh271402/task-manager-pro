import { HubConnectionBuilder, HttpTransportType, LogLevel } from '@microsoft/signalr'
import { TOKEN_KEY } from './client'

export function createBoardConnection() {
  const token = localStorage.getItem(TOKEN_KEY) ?? ''
  return new HubConnectionBuilder()
    .withUrl('/hubs/tasks', {
      accessTokenFactory: () => token,
      transport: HttpTransportType.WebSockets | HttpTransportType.ServerSentEvents | HttpTransportType.LongPolling
    })
    .withAutomaticReconnect([0, 2000, 5000, 10000, 30000])
    .configureLogging(LogLevel.Warning)
    .build()
}
