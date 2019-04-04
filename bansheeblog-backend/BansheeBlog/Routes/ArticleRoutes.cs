using System;
using System.Net;
using System.Threading.Tasks;
using BansheeBlog.Models;
using BansheeBlog.Utility;
using CommonMark;
using Red;
using Red.CookieSessions;
using Red.Extensions;
using SQLite;

namespace BansheeBlog.Routes
{
    public static class ArticleRoutes
    {
        public static Func<Request, Response, Task> FetchOneMarkdown(SQLiteAsyncConnection db)
        {
            return async (req, res) =>
            {
                var articleId = Guid.Parse(req.Parameters["id"]);
                var articleMarkup = await db.GetAsync<ArticleMarkdown>(articleId);
                if (articleMarkup != null)
                {
                    await res.SendJson(articleMarkup);
                }
                else
                {
                    await res.SendStatus(HttpStatusCode.NotFound);
                }
            };
        }

        public static Func<Request, Response, Task> FetchOne(SQLiteAsyncConnection db)
        {
            return async (req, res) =>
            {
                var articleId = Guid.Parse(req.Parameters["id"]);
                var article = await db.GetAsync<Article>(articleId);
                if (article != null)
                {
                    await res.SendJson(article);
                }
                else
                {
                    await res.SendStatus(HttpStatusCode.NotFound);
                }
            };
        }

        public static Func<Request, Response, Task> FetchList(SQLiteAsyncConnection db)
        {
            return async (req, res) =>
            {
                var articles = await db.Table<Article>().ToListAsync();
                await res.SendJson(articles);
            };
        }
        
        public static Func<Request, Response, Task> Remove(SQLiteAsyncConnection db)
        {
            return async (req, res) =>
            {
                var article = await req.ParseBodyAsync<Article>();
                var articleHtml = new ArticleHtml {Id = article.Id};
                var articleMarkdown = new ArticleMarkdown {Id = article.Id};

                var deleted = await db.DeleteAsync(article);
                await Task.WhenAll(db.DeleteAsync(articleHtml), db.DeleteAsync(articleMarkdown));
                await res.SendStatus(deleted == 1 ? HttpStatusCode.OK : HttpStatusCode.NotFound);
            };
        }

        public static Func<Request, Response, Task> Upsert(SQLiteAsyncConnection db, Settings settings, Configuration config)
        {
            return async (req, res) =>
            {
                var sessionData = req.GetSession<Session>();
                var updatedArticle = await req.ParseBodyAsync<Article>();

                if (await db.FindAsync<Article>(arti =>
                        arti.Slug == updatedArticle.Slug && arti.Id != updatedArticle.Id) != null)
                {
                    const string msg = "Another article with the same slug already exists";
                    await res.SendString(msg, status: HttpStatusCode.BadRequest);
                    return;
                }

                Article article;
                ArticleHtml articleHtml;
                ArticleMarkdown articleMarkdown;
                var newArticle = updatedArticle.Id == Guid.Empty;
                if (!newArticle)
                {
                    article = await db.FindAsync<Article>(arti => arti.Id == updatedArticle.Id);

                    if (article == null)
                    {
                        const string msg = "Could not find an existing article with the specified id";
                        await res.SendString(msg, status: HttpStatusCode.BadRequest);
                        return;
                    }

                    articleHtml = await db.FindAsync<ArticleHtml>(arti => arti.Id == updatedArticle.Id);
                    articleMarkdown = await db.FindAsync<ArticleMarkdown>(arti => arti.Id == updatedArticle.Id);
                }
                else
                {
                    article = new Article {Id = Guid.NewGuid(), Author = sessionData.Name};
                    articleHtml = new ArticleHtml {Id = article.Id};
                    articleMarkdown = new ArticleMarkdown {Id = article.Id};
                }

                TextFormatting.CopyMeta(article, updatedArticle);

                articleMarkdown.Content = updatedArticle.Markdown;
                articleHtml.Content = CommonMarkConverter.Convert(updatedArticle.Markdown);

                var firstParagraph = TextFormatting.FirstParagraph(articleHtml.Content);
                article.Html = firstParagraph;
                article.Markdown = "";


                if (newArticle)
                {
                    await db.InsertAllAsync(new object[] {article, articleHtml, articleMarkdown});
                }
                else
                {
                    await db.UpdateAllAsync(new object[] {article, articleHtml, articleMarkdown});
                }

                FileHandling.UpdateIndexingFiles(db, settings, config);
                await res.SendString(article.Id.ToString());
            };
        }

        public static Func<Request, Response, Task> UpdateMeta(SQLiteAsyncConnection db)
        {
            return async (req, res) =>
            {
                var updatedArticle = await req.ParseBodyAsync<Article>();

                if (await db.FindAsync<Article>(
                        arti => arti.Slug == updatedArticle.Slug && arti.Id != updatedArticle.Id) != null)
                {
                    const string msg = "Another article with the same slug already exists";
                    await res.SendString(msg, status: HttpStatusCode.BadRequest);
                    return;
                }

                var existingArticle = await db.FindAsync<Article>(arti => arti.Id == updatedArticle.Id);
                if (existingArticle == null)
                {
                    const string msg = "Could not find an existing article with the specified id";
                    await res.SendString(msg, status: HttpStatusCode.BadRequest);
                    return;
                }

                TextFormatting.CopyMeta(existingArticle, updatedArticle);

                await db.UpdateAsync(existingArticle);
                await res.SendStatus(HttpStatusCode.OK);
            };
        }
    }
}