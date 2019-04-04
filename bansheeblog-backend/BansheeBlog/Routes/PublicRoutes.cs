using System;
using System.Collections.Generic;
using System.Globalization;
using System.IO;
using System.Linq;
using System.Runtime.Serialization;
using System.Threading.Tasks;
using BansheeBlog.Models;
using BansheeBlog.Utility;
using Microsoft.AspNetCore.Http;
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
                    var collect = tracking.CollectInformation(req, "");
                }
                
                var templatePath = Path.Combine(config.ThemeDirectory, settings.ActiveTheme, "index.hbs");

                var articles = await db.Table<Article>()
                    .Where(article => article.Public)
                    .OrderByDescending(article => article.Created)
                    .Skip((page - 1) * 10)
                    .Take(10)
                    .ToListAsync();
                
                await res.RenderTemplate(templatePath, new FrontpageRenderParam(articles, settings));
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
                    var collect = tracking.CollectInformation(req, "article/" + slug);
                }
                var article = await db.FindAsync<Article>(a => a.Public && a.Slug == slug);
                if (article == null)
                {
                    var templatePath = Path.Combine(config.ThemeDirectory, settings.ActiveTheme, "error.hbs");
                    await res.RenderTemplate(templatePath, new ArticleNotFoundRenderParam(settings, "Article not found", $"The article with the slug '{slug}' was not found"));
                }
                else
                {
                    var htmlContent = await db.GetAsync<ArticleHtml>(article.Id);
                    article.Html = htmlContent.Content;
                    var templatePath = Path.Combine(config.ThemeDirectory, settings.ActiveTheme, "article.hbs");
                    var dateTimeFormat = req.GetDateTimeFormat();
                    await res.RenderTemplate(templatePath, new ArticleRenderParam(article, settings, dateTimeFormat));
                }
            };
        }
    }

    public abstract class RenderParam
    {
        public readonly DateTime UtcNow;
        public readonly Settings Settings;
        
        protected RenderParam(Settings settings)
        {
            UtcNow = DateTime.UtcNow;
            Settings = settings;
        }
    }

    public sealed class FrontpageRenderParam : RenderParam
    {
        public readonly List<Article> Articles;

        public FrontpageRenderParam(List<Article> articles, Settings settings) : base(settings)
        {
            var timezone = TimeZoneInfo.FindSystemTimeZoneById(settings.Timezone);
            foreach (var article in articles)
            {
                article.Created = TimeZoneInfo.ConvertTimeFromUtc(article.Created, timezone);
            }
            Articles = articles;
        }

    }

    public class ArticleRenderParam : RenderParam
    {
        public readonly Article Article;
        public readonly string FormattedCreatedDate;
        public readonly string FormattedEditedDate;

        public ArticleRenderParam(Article article, Settings settings, DateTimeFormatInfo dateTimeFormatInfo) : base(settings)
        {
            Article = article;
            var timezone = TimeZoneInfo.FindSystemTimeZoneById(settings.Timezone);
            article.Created = TimeZoneInfo.ConvertTimeFromUtc(article.Created, timezone);
            article.Edited = TimeZoneInfo.ConvertTimeFromUtc(article.Edited, timezone);
            
            FormattedCreatedDate = article.Created.ToString(dateTimeFormatInfo.FullDateTimePattern);
            FormattedEditedDate = article.Edited != article.Created
                ? article.Edited.ToString(dateTimeFormatInfo.FullDateTimePattern)
                : "";
        }

    }
    
    public class ArticleNotFoundRenderParam : RenderParam
    {
        public readonly string Title;
        public readonly string Message;

        public ArticleNotFoundRenderParam(Settings settings, string title, string message) : base(settings)
        {
            Title = title;
            Message = message;
        }
    }
}