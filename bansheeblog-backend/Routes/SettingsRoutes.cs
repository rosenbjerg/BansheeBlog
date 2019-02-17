using System;
using System.IO;
using System.Net;
using System.Threading.Tasks;
using BansheeBlog.Models;
using Newtonsoft.Json;
using Red;
using Red.Extensions;

namespace BansheeBlog.Routes
{
    public static class SettingsRoutes
    {
        public static Func<Request, Response, Task> Update(Settings settings)
        {
            return async (req, res) =>
            {
                var newSettings = await req.ParseBodyAsync<Settings>();
                if (newSettings == null)
                {
                    await res.SendStatus(HttpStatusCode.BadRequest);
                    return;
                }

                settings.Author = newSettings.Author;
                settings.ActiveTheme = newSettings.ActiveTheme;
                settings.BlogUrl = newSettings.BlogUrl;
                settings.BlogTitle = newSettings.BlogTitle;
                settings.BlogDescription = newSettings.BlogDescription;
                settings.GoogleAnalyticsTrackingId = newSettings.GoogleAnalyticsTrackingId;
                settings.UseServerSideTracking = newSettings.UseServerSideTracking;
                
                File.WriteAllText(Program.SettingsPath, JsonConvert.SerializeObject(settings));
                await res.SendStatus(HttpStatusCode.OK);
            };
        }

        public static Func<Request, Response, Task> Send(Settings settings)
        {
            return async (req, res) => { await res.SendJson(settings); };
        }

    }
}