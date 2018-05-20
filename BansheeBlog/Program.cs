using System;
using System.IO;
using System.Linq;
using System.Net;
using System.Threading.Tasks;
using HandlebarsDotNet;
using Microsoft.AspNetCore.Http;
using Newtonsoft.Json;
using Red;
using Red.CookieSessions;
using Red.Extensions;
using Red.HandlebarsRenderer;
using SQLite;

namespace BansheeBlog
{
    class User
    {
        public string Username { get; set; }
        public string Password { get; set; }
    }

    class Program
    {
        static void Main(string[] args)
        {
            const string configPath = "config.json";
            const string settingsPath = "settings.json";

            var config = Configuration.Load(configPath);
            var settings = Settings.Load(settingsPath);

            var server = new RedHttpServer(config.Port, config.PublicDirectory);
            
            var sessionSettings = new CookieSessionSettings(TimeSpan.FromDays(2))
            {
                Secure = false,
                ShouldAuthenticate = path => path.StartsWith("/admin/")
            };
            server.Use(new CookieSessions<User>(sessionSettings));
            
            var db = new SQLiteAsyncConnection(config.DatabaseFilePath);

            db.DropTableAsync<User>().Wait();
            
            Task.WaitAll(db.CreateTableAsync<User>(), 
                db.CreateTableAsync<Article>(),
                db.CreateTableAsync<ArticleHtml>(),
                db.CreateTableAsync<ArticleMarkdown>());

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
                var templatePath = Path.Combine(config.ThemeDirectory, settings.ActiveTheme, "index.hbs");

                var articles = await db.Table<Article>()
                    .Where(article => article.Public)
                    .OrderByDescending(article => article.Created)
                    .Take(5)
                    .ToListAsync();

                await res.RenderTemplate(templatePath, new
                {
                    Now = DateTime.UtcNow,
                    Articles = articles,
                    Settings = settings
                });
            });

            server.Get("/:slug", async (req, res) =>
            {
                var slug = req.Parameters["slug"];
                var article = await db.FindAsync<Article>(arti => arti.Slug == slug);
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
                    var htmlContent = await db.FindAsync<ArticleHtml>(arti => arti.Id == article.Id);
                    article.Html = htmlContent.Content;
                    var templatePath = Path.Combine(config.ThemeDirectory, settings.ActiveTheme, "article.hbs");
                    await res.RenderTemplate(templatePath, new
                    {
                        Now = DateTime.UtcNow,
                        Article = article,
                        Settings = settings
                    });
                }
            });
            
            server.Post("/login", async (req, res) =>
            {
                var credentials = await req.ParseBodyAsync<User>();
                var user = await db.FindAsync<User>(u => u.Username == credentials.Username);
                
                if (user == null || !BCrypt.Net.BCrypt.Verify(credentials.Password, user.Password))
                {
                    await res.SendStatus(HttpStatusCode.BadRequest);
                    return;
                }
                
                req.OpenSession(user);
                await res.SendStatus(HttpStatusCode.OK);
            });
            
            server.Get("/admin/verify", async (req, res) => await res.SendStatus(HttpStatusCode.OK));
            
            server.Get("/admin/articles", async (req, res) =>
            {
                var articles = await db.Table<Article>().ToListAsync();
                await res.SendJson(articles);
            });

            server.Get("/admin/article/:id", async (req, res) =>
            {
                var articleId = Guid.Parse(req.Parameters["id"]);
                var article = await db.FindAsync<Article>(arti => arti.Id == articleId);
                await res.SendJson(article);
            });
            
            server.Get("/admin/article/:id/markdown", async (req, res) =>
            {
                var articleId = Guid.Parse(req.Parameters["id"]);
                var articleMarkup = await db.FindAsync<ArticleMarkdown>(arti => arti.Id == articleId);
                await res.SendJson(articleMarkup);
            });

            void CopyMeta(Article existing, Article updated)
            {
                existing.Edited = DateTime.UtcNow;
                existing.Title = updated.Title;
                existing.Slug = updated.Slug;
                existing.Tags = updated.Tags;
                if (existing.Public != updated.Public)
                {
                    existing.Published = updated.Public ? DateTime.UtcNow : existing.Published;
                }

                existing.Public = updated.Public;
            }

            server.Put("/admin/article/meta", async (req, res) =>
            {
                var updatedArticle = await req.ParseBodyAsync<Article>();
                
                if (await db.FindAsync<Article>(arti =>
                        arti.Slug == updatedArticle.Slug && arti.Id != updatedArticle.Id) != null)
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

                CopyMeta(existingArticle, updatedArticle);
                
                await db.UpdateAsync(existingArticle);
            });
            
            server.Put("/admin/article", async (req, res) =>
            {
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
                    article = new Article {Id = Guid.NewGuid(), Created = DateTime.UtcNow};
                    articleHtml = new ArticleHtml {Id = article.Id};
                    articleMarkdown = new ArticleMarkdown {Id = article.Id};
                }

                CopyMeta(article, updatedArticle);
                
                articleMarkdown.Content = updatedArticle.Markdown;
                articleHtml.Content = CommonMark.CommonMarkConverter.Convert(updatedArticle.Markdown);

                var firstParagraph = Utils.FirstParagraph(articleHtml.Content);
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

                await res.SendStatus(HttpStatusCode.OK);
            });
            server.Delete("/admin/article", async (req, res) =>
            {
                var article = await req.ParseBodyAsync<Article>();
                var articleHtml = new ArticleHtml {Id = article.Id};
                var articleMarkdown = new ArticleMarkdown {Id = article.Id};
                
                var deleted = await db.DeleteAsync(article);
                await Task.WhenAll(db.DeleteAsync(articleHtml), db.DeleteAsync(articleMarkdown));
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