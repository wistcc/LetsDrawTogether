using System.Threading.Tasks;
using Microsoft.AspNet.SignalR;

namespace LetsDrawTogether
{
    public class HubController : Hub
    {
        public async Task JoinGroup(string groupId = "1")
        {
            await Groups.Add(Context.ConnectionId, "Group" + groupId);
        }

        public void DrawTogether(string res, int clientX, int clientY, string groupId = "1")
        {
            Clients.OthersInGroup("Group" + groupId).drawTogether(res,clientX, clientY);
        }
        public void ChangeColor(string color, string groupId = "1")
        {
            Clients.OthersInGroup("Group" + groupId).changeColor(color);
        }
        public void ClearOrSave(string btnId, string groupId = "1")
        {
            Clients.OthersInGroup("Group" + groupId).clearOrSave(btnId);
        }
    }
}