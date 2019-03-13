using System;
using System.Collections.Generic;
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
    public static class StaticFileRoutes
    {
        public static Func<Request, Response, Task> Upload(Configuration config)
        {
            return async (req, res) =>
            {
                var form = await req.GetFormDataAsync();
                var unzip = form["unzip"] == "true";
                var savePath = Path.Combine(config.PublicDirectory, "static");
                
                foreach (var formFile in form.Files)
                {
                    if (unzip && formFile.FileName.ToLowerInvariant().EndsWith(".zip"))
                    {
                        var tempPath = await FileHandling.SaveTempFile(config, formFile);
                        await Task.Run(() => ZipFile.ExtractToDirectory(tempPath, savePath));
                        File.Delete(tempPath);
                    }
                    else
                    {
                        using (var publicFile = File.Create(Path.Combine(savePath, formFile.FileName)))
                        {
                            await formFile.CopyToAsync(publicFile);
                        }
                    }
                    
                }
                await res.SendJson(GetPublicFiles(config));
            };
        }

        public static Func<Request, Response, Task> FetchList(Configuration config)
        {
            return async (req, res) =>
            {
                await res.SendJson(GetPublicFiles(config));
            };
        }
       
        private static List<string> GetPublicFiles(Configuration config)
        {
            var staticFileFolder = Path.Combine(config.PublicDirectory, "static");
            var files = Directory.EnumerateFiles(staticFileFolder, "*", SearchOption.AllDirectories);
            var fileNames = files.Select(path => path
                    .Replace(staticFileFolder, "")
                    .Replace("\\", "/")
                    .Trim('/'))
                .ToList();
            return fileNames;
        }

        public static Func<Request, Response, Task> Remove(Configuration config)
        {
            return async (req, res) =>
            {
                var staticFiles = Path.Combine(config.PublicDirectory, "static");
                var filename = await req.ParseBodyAsync<string>();
                filename = filename
                    .Replace('/', Path.PathSeparator)
                    .Replace('\\', Path.PathSeparator);
                
                var filepath = Path.GetFullPath(Path.Combine(staticFiles, filename));
                if (!filepath.StartsWith(staticFiles) || !File.Exists(filepath))
                {
                    await res.SendStatus(HttpStatusCode.NotFound);
                }
                else
                {
                    File.Delete(filepath);
                    await res.SendStatus(HttpStatusCode.OK);
                }
            };
        }
    }
}