using System.Threading.Tasks;
using LetsDrawTogether.Enumarations;
using Microsoft.AspNet.SignalR;

namespace LetsDrawTogether
{
    public class HubController : Hub
    {
        public async Task JoinGroup(string groupId)
        {
            await Groups.Add(Context.ConnectionId, "Group" + groupId);
        }
        public async Task JoinToSpecificGroup(string groupId, string actualGroupId)
        {
            await Groups.Remove(Context.ConnectionId, "Group" + actualGroupId);
            await Groups.Add(Context.ConnectionId, "Group" + groupId);
            Clients.Client(Context.ConnectionId).newGroup(groupId);
        }

        public void DrawTogether(string res, int clientX, int clientY, int fromLeft, int fromTop, int fromBottom, int fromRight, string groupId, MouseOrTouchType mouseOrTouchType, int resizer, bool canDraw)
        {
            Clients.OthersInGroup("Group" + groupId).drawTogether(res, clientX, clientY, fromLeft, fromTop, fromBottom, fromRight, mouseOrTouchType, resizer, canDraw);
        }
        public void ChangeColor(string color, string groupId)
        {
            Clients.OthersInGroup("Group" + groupId).changeColor(color);
        }
        public void AddImage(string imgUrl, string groupId)
        {
            Clients.OthersInGroup("Group" + groupId).addImage(imgUrl);
        }
        public void Clear(string btnId, string groupId)
        {
            Clients.OthersInGroup("Group" + groupId).clear(btnId);
        }
    }
}