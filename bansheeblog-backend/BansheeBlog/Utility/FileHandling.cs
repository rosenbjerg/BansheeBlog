using System;
using System.IO;
using System.Threading.Tasks;
using BansheeBlog.Models;
using HandlebarsDotNet;
using Microsoft.AspNetCore.Http;
using UpdateBansheeBlog;

namespace BansheeBlog.Utility
{
    public static class FileHandling
    {
        public static void RegisterPartialRenderer(string[] partials, Configuration config, Settings settings)
        {
            foreach (var partial in partials)
            {
                Handlebars.RegisterTemplate(partial, (writer, o) =>
                {
                    var path = Path.Combine(config.ThemeDirectory, settings.ActiveTheme, "partials", $"{partial}.hbs");
                    if (File.Exists(path))
                    {
                        var renderer = HandlebarsCache.Instance.GetRenderer(path);
                        renderer(writer, o);
                    }
                    else
                    {
                        writer.WriteSafeString($"<span>Partial '{partial}' not found</span>");
                        Console.WriteLine($"Partial '{partial}' not found at '{path}'");
                    }
                });
            }
        }
        public static async Task<string> SaveTempFile(Configuration config, IFormFile formFile)
        {
            var tempPath = Path.Combine(config.TempDirectory, formFile.FileName);
            using (var tempFile = File.Create(tempPath))
            {
                await formFile.CopyToAsync(tempFile);
            }

            return tempPath;
        }

        public static async Task CleanupTemporaryUpdater()
        {
            await Task.Delay(TimeSpan.FromSeconds(7));
            try
            {
                if (Directory.Exists(Updater.TemporaryUpdater))
                    Directory.Delete(Updater.TemporaryUpdater, true);
            }
            catch (Exception)
            {
                Console.WriteLine("Failed to delete temporary-updater folder");
            }
        }
    }
}