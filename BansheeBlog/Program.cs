using System;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using System.Net;
using System.Runtime.InteropServices.ComTypes;
using System.Threading.Tasks;
using System.Xml.Schema;
using HandlebarsDotNet;
using LiteDB;
using Newtonsoft.Json;
using Red;
using Red.Extensions;
using Red.HandlebarsRenderer;
using SQLite;
using FileMode = System.IO.FileMode;

namespace BansheeBlog
{
    class Program
    {
        static void Main(string[] args)
        {
            const string configPath = "config.json";
            const string settingsPath = "settings.json";

            var config = Configuration.Load(configPath);
            var settings = Settings.Load(settingsPath);

            var server = new RedHttpServer(config.Port, config.PublicDirectory);
            
            var sdb = new SQLiteAsyncConnection(config.DatabaseFilePath);

            sdb.CreateTableAsync<Article>().Wait();
            sdb.CreateTableAsync<ArticleHtml>().Wait();
            sdb.CreateTableAsync<ArticleMarkdown>().Wait();
//            var db = new LiteDatabase(config.DatabaseFilePath);

            var partials = new[] {"header", "footer", "navigation", "meta", "style"};
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
                        writer.WriteSafeString($"<span>Partial '{partial}' not found at '{path}'</span>");
                });
            }


            server.Get("/", async (req, res) =>
            {
                try
                {
                    var path = Path.Combine(config.ThemeDirectory, settings.ActiveTheme, "index.hbs");

                    var articles = await sdb.Table<Article>()
                        .Where(article => article.Public)
                        .OrderByDescending(article => article.Created)
                        .Take(5)
                        .ToListAsync();

                    await res.RenderTemplate(path, new
                    {
                        Now = DateTime.UtcNow,
                        Articles = articles,
                        Settings = settings
                    });
                }
                catch (Exception e)
                {
                    Console.WriteLine(e);
                    throw;
                }
            });

            server.Get("/:slug", async (req, res) =>
            {
                var slug = req.Parameters["slug"];
                var article = await sdb.FindAsync<Article>(arti => arti.Slug == slug);
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
                    var templatePath = Path.Combine(config.ThemeDirectory, settings.ActiveTheme, "article.hbs");
                    await res.RenderTemplate(templatePath, new
                    {
                        Now = DateTime.UtcNow,
                        Article = article,
                        Settings = settings
                    });
                }
            });

            server.Get("/admin/article/:id", async (req, res) =>
            {
                var articleId = Guid.Parse(req.Parameters["id"]);
                var article = await sdb.FindAsync<Article>(arti => arti.Id == articleId);
                await res.SendJson(article);
            });
            server.Get("/admin/article/:id/markdown", async (req, res) =>
            {
                var articleId = Guid.Parse(req.Parameters["id"]);
                var articleMarkup = await sdb.FindAsync<ArticleMarkdown>(arti => arti.Id == articleId);
                await res.SendJson(articleMarkup);
            });
            server.Get("/admin/article/:id/html", async (req, res) =>
            {
                var articleId = Guid.Parse(req.Parameters["id"]);
                var articleHtml = await sdb.FindAsync<ArticleHtml>(arti => arti.Id == articleId);
                await res.SendJson(articleHtml);
            });

            server.Get("/admin/articles", async (req, res) =>
            {
                var articles = await sdb.Table<Article>().ToListAsync();
                await res.SendJson(articles);
            });

            server.Put("/admin/article", async (req, res) =>
            {
                var updatedArticle = await req.ParseBodyAsync<Article>();

                if (await sdb.FindAsync<Article>(arti =>
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
                    article = await sdb.FindAsync<Article>(arti => arti.Id == updatedArticle.Id);

                    if (article == null)
                    {
                        const string msg = "Could not find an existing article with the specified id";
                        await res.SendString(msg, status: HttpStatusCode.BadRequest);
                        return;
                    }

                    articleHtml = await sdb.FindAsync<ArticleHtml>(arti => arti.Id == updatedArticle.Id);
                    articleMarkdown = await sdb.FindAsync<ArticleMarkdown>(arti => arti.Id == updatedArticle.Id);
                }
                else
                {
                    article = new Article {Id = Guid.NewGuid(), Created = DateTime.UtcNow};
                    articleHtml = new ArticleHtml {Id = article.Id};
                    articleMarkdown = new ArticleMarkdown {Id = article.Id};
                }

                article.Edited = DateTime.UtcNow;
                article.Title = updatedArticle.Title;
                article.Slug = updatedArticle.Slug;
                article.Tags = updatedArticle.Tags;

                articleMarkdown.Content = updatedArticle.Markdown;
                articleHtml.Content = CommonMark.CommonMarkConverter.Convert(updatedArticle.Markdown);

                var firstParagraph = Utils.FirstParagraph(articleHtml.Content);
                article.Html = firstParagraph;
                article.Markdown = "";

                if (article.Public != updatedArticle.Public)
                {
                    article.Published = updatedArticle.Public ? DateTime.UtcNow : article.Published;
                }
                article.Public = updatedArticle.Public;


                if (newArticle)
                {
                    await sdb.InsertAllAsync(new object[] {article, articleHtml, articleMarkdown});
                }
                else
                {
                    await sdb.UpdateAllAsync(new object[] {article, articleHtml, articleMarkdown});
                }

                await res.SendStatus(HttpStatusCode.OK);
            });

            server.Delete("/admin/article", async (req, res) =>
            {
                var article = await req.ParseBodyAsync<Article>();
                var articleHtml = new ArticleHtml {Id = article.Id};
                var articleMarkdown = new ArticleMarkdown {Id = article.Id};
                var deleted = await sdb.DeleteAsync(article);
                await Task.WhenAll(sdb.DeleteAsync(articleHtml), sdb.DeleteAsync(articleMarkdown));
                await res.SendStatus(deleted > 1 ? HttpStatusCode.OK : HttpStatusCode.NotFound);
            });

            server.Get("/admin/settings", async (req, res) => { await res.SendJson(settings); });
            server.Post("/admin/settings", async (req, res) =>
            {
                settings = await req.ParseBodyAsync<Settings>();
                File.WriteAllText(settingsPath, JsonConvert.SerializeObject(settings));
                await res.SendStatus(HttpStatusCode.OK);
            });

            server.Get("/admin/themes", async (req, res) =>
            {
                var themeDirs = Directory.EnumerateDirectories(config.ThemeDirectory)
                    .Select(Path.GetFileName);
                await res.SendJson(themeDirs);
            });

            server.Start();
            Console.ReadLine();
        }
    }
}