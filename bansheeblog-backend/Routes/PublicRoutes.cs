using System;
using System.IO;
using System.Threading.Tasks;
using BansheeBlog.Models;
using BansheeBlog.Utility;
using Red;
using Red.HandlebarsRenderer;
using SQLite;

namespace BansheeBlog.Routes
{
    public static class PublicRoutes
    {
        public static Func<Request, Response, Task> SendFrontpage(Settings settings, Tracking tracking, SQLiteAsyncConnection db, Configuration config)
        {
            return async (req, res) =>
            {
                var query = req.Queries["p"];
                if (string.IsNullOrWhiteSpace(query))
                    query = "1";
                var page = Math.Max(int.Parse(query), 1);
                
                if (settings.UseServerSideTracking)
                {
                    tracking.CollectInformation(req, "", db);
                }
                
                var templatePath = Path.Combine(config.ThemeDirectory, settings.ActiveTheme, "index.hbs");

                var articles = await db.Table<Article>()
                    .Where(article => article.Public)
                    .OrderByDescending(article => article.Created)
                    .Skip((page - 1) * 5)
                    .Take(5)
                    .ToListAsync();

                await res.RenderTemplate(templatePath, new
                {
                    Now = DateTime.UtcNow,
                    Articles = articles,
                    Settings = settings
                });
            };
        }

        public static Func<Request, Response, Task> SendFavicon()
        {
            return async (req, res) => await res.SendFile("public/favicon.ico");
        }

        public static Func<Request, Response, Task> FindFromSlug(Settings settings, Tracking tracking, SQLiteAsyncConnection db, Configuration config)
        {
            return async (req, res) =>
            {
                var slug = req.Parameters["slug"];
                if (settings.UseServerSideTracking)
                {
                    tracking.CollectInformation(req, slug, db);
                }
                var article = await db.FindAsync<Article>(a => a.Public && a.Slug == slug);
                if (article == null)
                {
                    var templatePath = Path.Combine(config.ThemeDirectory, settings.ActiveTheme, "error.hbs");
                    await res.RenderTemplate(templatePath, new
                    {
                        Now = DateTime.UtcNow,
                        Settings = settings,
                        title = "Article not found",
                        message = $"The article with the slug '{slug}' was not found"
                    });
                }
                else
                {
                    var htmlContent = await db.GetAsync<ArticleHtml>(article.Id);
                    article.Html = htmlContent.Content;
                    var templatePath = Path.Combine(config.ThemeDirectory, settings.ActiveTheme, "article.hbs");
                    await res.RenderTemplate(templatePath, new
                    {
                        Now = DateTime.UtcNow,
                        Article = article,
                        Settings = settings
                    });
                }
            };
        }

    }
}