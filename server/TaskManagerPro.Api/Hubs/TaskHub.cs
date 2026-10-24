using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.SignalR;

namespace TaskManagerPro.Api.Hubs;

/// <summary>
/// Real-time board updates. Authenticated via JWT passed in the access_token
/// query string parameter when negotiating the connection.
/// Server → client events:
///   task:created { task }   task:updated { task }   task:deleted { id }
///   board:sync { tasks }    (full list, sent after position-changing moves)
///   column:changed {}       user:changed { user }
/// </summary>
[Authorize]
public class TaskHub : Hub
{
    public override Task OnConnectedAsync() => base.OnConnectedAsync();
}
