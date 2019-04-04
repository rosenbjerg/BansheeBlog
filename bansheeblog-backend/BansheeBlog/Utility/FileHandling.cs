using System;
using System.IO;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using BansheeBlog.Models;
using HandlebarsDotNet;
using Microsoft.AspNetCore.Http;
using SQLite;
using UpdateBansheeBlog;

namespace BansheeBlog.Utility
{
    public static class FileHandling
    {
        public static void RegisterPartialRenderer(string[] partials, Configuration config, Settings settings)
        {
            var cache = new HandlebarsCache();
            foreach (var partial in partials)
            {
                Handlebars.RegisterTemplate(partial, (writer, o) =>
                {
                    var path = Path.Combine(config.ThemeDirectory, settings.ActiveTheme, "partials", $"{partial}.hbs");
                    if (File.Exists(path))
                    {
                        var renderer = cache.GetRenderer(path);
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

        public static void UpdateIndexingFiles(SQLiteAsyncConnection db, Settings settings, Configuration config)
        {
            Task.Run(async () =>
            {
                var articles = await db.Table<Article>().ToListAsync();
                var slugs = articles.Select(article => (article.Slug, article.Edited)).ToArray();
                articles.Clear();
                UpdateRobotsTxt(config.PublicDirectory, settings.BlogUrl, slugs);
                UpdateSitemap(config.PublicDirectory, settings.BlogUrl, slugs);
            });
        }
        
        public static void UpdateSitemap(string publicDir, string host, (string Slug, DateTime Edited)[] articleTuples)
        {
            host = host.TrimEnd('/');
            var sitemapBuilder = new StringBuilder();
            sitemapBuilder.AppendLine("<?xml version=\"1.0\" encoding=\"UTF-8\"?>");
            sitemapBuilder.AppendLine("<urlset xmlns=\"http://www.sitemaps.org/schemas/sitemap/0.9\">");
            var mainLoc = $"<loc>{host}/</loc>";
            var mainLastmod = $"<lastmod>{articleTuples.Max(a => a.Edited):yyyy-MM-ddTHH:mmzzz}</lastmod>";
            sitemapBuilder.AppendLine($"\t<url>\n\t\t{mainLoc}\n\t\t{mainLastmod}\n\t</url>");
            foreach (var tuple in articleTuples)
            {
                var loc = $"<loc>{host}/{tuple.Slug}</loc>";
                var lastmod = $"<lastmod>{tuple.Edited:yyyy-MM-ddTHH:mmzzz}</lastmod>";
                sitemapBuilder.AppendLine($"\t<url>\n\t\t{loc}\n\t\t{lastmod}\n\t</url>");
            }
            sitemapBuilder.AppendLine("</urlset>");
            
            try
            {
                File.WriteAllText(Path.Combine(publicDir, "sitemap.xml"), sitemapBuilder.ToString());
            }
            catch (IOException e)
            {
                Console.WriteLine("Could not update sitemap.xml: " + e.Message);
            }
        }

        public static void UpdateRobotsTxt(string publicDir, string host, (string Slug, DateTime Edited)[] slugs)
        {
            var robotsBuilder = new StringBuilder();
            robotsBuilder.AppendLine("User-agent: *");
            robotsBuilder.AppendLine("Disallow: /admin/");
            robotsBuilder.AppendLine("Disallow: /static/");
            robotsBuilder.AppendLine("Allow: /");
            foreach (var articleTuples in slugs) robotsBuilder.AppendLine($"Allow: /{articleTuples.Slug}");
            robotsBuilder.AppendLine($"Sitemap: {host.TrimEnd('/')}/sitemap.xml");

            try
            {
                File.WriteAllText(Path.Combine(publicDir, "robots.txt"), robotsBuilder.ToString());
            }
            catch (IOException e)
            {
                Console.WriteLine("Could not update robots.txt: " + e.Message);
            }
        }
    }
}