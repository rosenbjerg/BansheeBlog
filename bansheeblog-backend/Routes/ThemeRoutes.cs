using System;
using System.IO;
using System.IO.Compression;
using System.Linq;
using System.Threading.Tasks;
using BansheeBlog.Models;
using BansheeBlog.Utility;
using Red;

namespace BansheeBlog.Routes
{
    public static class ThemeRoutes
    {
        public static Func<Request, Response, Task> Delete(Configuration config)
        {
            return async (req, res) =>
            {
                
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