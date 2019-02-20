using System;
using System.IO;
using System.IO.Compression;
using System.Linq;
using System.Net;
using System.Threading.Tasks;
using BansheeBlog.Models;
using BansheeBlog.Utility;
using Red;
using Red.Extensions;

namespace BansheeBlog.Routes
{
    public static class ThemeRoutes
    {
        public static Func<Request, Response, Task> Remove(Configuration config)
        {
            return async (req, res) =>
            {
                var themeName = await req.ParseBodyAsync<string>();
                var themePath = Path.GetFullPath(Path.Combine(config.ThemeDirectory, themeName));
                if (!themePath.StartsWith(config.ThemeDirectory) || !Directory.Exists(themePath))
                {
                    await res.SendStatus(HttpStatusCode.NotFound);
                }
                else
                {
                    Directory.Delete(themePath, true);
                    await res.SendStatus(HttpStatusCode.OK);
                }
            };
        }

        public static Func<Request, Response, Task> Upload(Configuration config)
        {
            return async (req, res) =>
            {
                try
                {
                    var form = await req.GetFormDataAsync();
                    var formFile = form.Files.FirstOrDefault();
                    var tempPath = await FileHandling.SaveTempFile(config, formFile);
                
                    await Task.Run(() => ZipFile.ExtractToDirectory(tempPath, config.ThemeDirectory));
                    var themeDirs = Directory.EnumerateDirectories(config.ThemeDirectory).Select(Path.GetFileName);
                    File.Delete(tempPath);
                    await res.SendJson(themeDirs);
                }
                catch (Exception e)
                {
                    Console.WriteLine(e);
                    throw;
                }
            };
        }

        public static Func<Request, Response, Task> FetchList(Configuration config)
        {
            return async (req, res) =>
            {
                var themeDirs = Directory.EnumerateDirectories(config.ThemeDirectory).Select(Path.GetFileName);
                await res.SendJson(themeDirs);
            };
        }
    }
}