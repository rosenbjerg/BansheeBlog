using System;
using System.Collections.Generic;
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
                    tracking.CollectInformation(req, "");
                }
                
                var templatePath = Path.Combine(config.ThemeDirectory, settings.ActiveTheme, "index.hbs");

                var articles = await db.Table<Article>()
                    .Where(article => article.Public)
                    .OrderByDescending(article => article.Created)
                    .Skip((page - 1) * 5)
                    .Take(5)
                    .ToListAsync();

                await res.RenderTemplate(templatePath, new FrontpageRenderParam(DateTime.UtcNow, articles, settings));
            };
        }

        public static Func<Request, Response, Task> SendAdminPWA(Configuration config)
        {
            return async (req, res) => await res.SendFile(Path.Combine(config.PublicDirectory, "admin", "index.html"));
        }


        public static Func<Request, Response, Task> FindFromSlug(Settings settings, Tracking tracking, SQLiteAsyncConnection db, Configuration config)
        {
            return async (req, res) =>
            {
                var slug = req.Parameters["slug"];
                if (settings.UseServerSideTracking)
                {
                    tracking.CollectInformation(req, "article/" + slug);
                }
                var article = await db.FindAsync<Article>(a => a.Public && a.Slug == slug);
                if (article == null)
                {
                    var templatePath = Path.Combine(config.ThemeDirectory, settings.ActiveTheme, "error.hbs");
                    await res.RenderTemplate(templatePath, new ArticleNotFoundRenderParam(DateTime.UtcNow, settings, "Article not found", $"The article with the slug '{slug}' was not found"));
                }
                else
                {
                    var htmlContent = await db.GetAsync<ArticleHtml>(article.Id);
                    article.Html = htmlContent.Content;
                    var templatePath = Path.Combine(config.ThemeDirectory, settings.ActiveTheme, "article.hbs");
                    await res.RenderTemplate(templatePath, new ArticleRenderParam(DateTime.UtcNow, article, settings));
                }
            };
        }
    }
    public class FrontpageRenderParam
    {
        public DateTime Now { get; }
        public List<Article> Articles { get; }
        public Settings Settings { get; }

        public FrontpageRenderParam(DateTime now, List<Article> articles, Settings settings)
        {
            Now = now;
            Articles = articles;
            Settings = settings;
        }
    }

    public class ArticleRenderParam
    {
        public DateTime Now { get; }
        public Article Article { get; }
        public Settings Settings { get; }

        public ArticleRenderParam(DateTime now, Article article, Settings settings)
        {
            Now = now;
            Article = article;
            Settings = settings;
        }
    }
    
    public class ArticleNotFoundRenderParam
    {
        public DateTime Now { get; }
        public Settings Settings { get; }
        public string Title { get; }
        public string Message { get; }

        public ArticleNotFoundRenderParam(DateTime now, Settings settings, string title, string message)
        {
            Now = now;
            Settings = settings;
            Title = title;
            Message = message;
        }
    }
}