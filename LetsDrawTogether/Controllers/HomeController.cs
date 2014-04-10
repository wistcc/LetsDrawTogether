using System.Web.Mvc;

namespace LetsDrawTogether.Controllers
{
    public class HomeController : Controller
    {
        public ActionResult Index()
        {
            return View();
        }
    }
}