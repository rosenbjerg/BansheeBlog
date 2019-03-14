using System;
using System.IO;
using System.Reflection;
using System.Threading.Tasks;
using BansheeBlog.Models;
using Red;
using UpdateBansheeBlog;

namespace BansheeBlog.Routes
{
    public static class UpdatingRoutes
    {
        public static Func<Request, Response, Task> FetchAvailability()
        {
            return async (req, res) =>
            {
                var availability = await Updater.CheckForUpdates(Program.Version);
                await res.SendJson(availability);
            };
        }

        public static Func<Request, Response, Task> InitiateUpdate(Configuration config)
        {
            return async (req, res) =>
            {
                var backendDir = Path.GetDirectoryName(new Uri(Assembly.GetExecutingAssembly().CodeBase).LocalPath);
                var willUpdate = await Updater.InstallUpdates(backendDir, config.PublicDirectory, config.TempDirectory);
                await res.SendString(willUpdate ? "Installing updates... Server will restart soon" : "Server is fully updated!");
                
                if (willUpdate)
                {
                    Environment.Exit(0);
                }
            };
        }
    }
}