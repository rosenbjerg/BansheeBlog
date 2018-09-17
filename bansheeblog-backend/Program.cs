using System;
using System.IO;
using System.IO.Compression;
using System.Linq;
using System.Net;
using System.Threading.Tasks;
using HandlebarsDotNet;
using Microsoft.AspNetCore.Http;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.ObjectPool;
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
        [PrimaryKey] 
        public string Username { get; set; }
        public string Password { get; set; }
    }

    class Session
    {
        public string Username { get; set; }
    }
    
    class Program
    {
        private static async void CreateFirstUser(SQLiteAsyncConnection db)
        {
            if (await db.Table<User>().FirstOrDefaultAsync() == null)
            {
                var password = Guid.NewGuid().ToString("N");
                var admin = new User
                {
                    Username = "admin",
                    Password = BCrypt.Net.BCrypt.HashPassword(password, 12)
                };
                await db.InsertAsync(admin);

                var print = $"username: {admin.Username}\npassword: {password}";
                await File.WriteAllTextAsync("./credentials.txt", print);
                Console.WriteLine("Credentials saved in 'credentials.txt'");
            }
        }

        const string ConfigPath = "config.json";
        const string SettingsPath = "settings.json";
        
        static async Task Main(string[] args)
        {
            var config = Configuration.Load(ConfigPath);
            var settings = Settings.Load(SettingsPath);

            var server = new RedHttpServer(config.Port, config.PublicDirectory);
            
            // Cookie session authentication
            server.Use(new CookieSessions(new CookieSessionSettings(TimeSpan.FromDays(2))
            {
                Secure = false
            }));
            
            // Setup database and tables
            var db = new SQLiteAsyncConnection(config.DatabaseFilePath);

            await Task.WhenAll(db.CreateTableAsync<User>(),
                db.CreateTableAsync<Article>(),
                db.CreateTableAsync<ArticleHtml>(),
                db.CreateTableAsync<ArticleMarkdown>());

            // Check if first start and create admin user
            CreateFirstUser(db);
            
            // Create directories for later use
            Directory.CreateDirectory(Path.Combine(config.PublicDirectory, "files"));
            Directory.CreateDirectory(config.TempDirectory);

            // Initialize partial templates
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
                    {
                        writer.WriteSafeString($"<span>Partial '{partial}' not found</span>");
                        Console.WriteLine($"Partial '{partial}' not found at '{path}'");
                    }
                });
            }

            async Task Auth(Request req, Response res)
            {
                if (req.GetSession<Session>() == null)
                {
                    await res.SendStatus(HttpStatusCode.Unauthorized);
                }
            }

            // Routes
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
                var article = await db.FindAsync<Article>(arti => arti.Public && arti.Slug == slug);
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

            server.Get("/api/verify", Auth, async (req, res) => await res.SendStatus(HttpStatusCode.OK));

            server.Get("/api/articles", Auth, async (req, res) =>
            {
                var articles = await db.Table<Article>().ToListAsync();
                await res.SendJson(articles);
            });
            server.Get("/api/article/:id", async (req, res) =>
            {
                var articleId = Guid.Parse(req.Parameters["id"]);
                var article = await db.FindAsync<Article>(arti => arti.Id == articleId);
                if (article != null)
                {
                    await res.SendJson(article);
                }
                else
                {
                    await res.SendStatus(HttpStatusCode.NotFound);
                }
            });
            server.Get("/api/article/:id/markdown", Auth, async (req, res) =>
            {
                var articleId = Guid.Parse(req.Parameters["id"]);
                var articleMarkup = await db.FindAsync<ArticleMarkdown>(arti => arti.Id == articleId);
                if (articleMarkup != null)
                {
                    await res.SendJson(articleMarkup);
                }
                else
                {
                    await res.SendStatus(HttpStatusCode.NotFound);
                }
            });

           
            server.Put("/api/article/meta", Auth, async (req, res) =>
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

                Utils.CopyMeta(existingArticle, updatedArticle);

                await db.UpdateAsync(existingArticle);
                await res.SendStatus(HttpStatusCode.OK);
            });

            server.Put("/api/article", Auth, async (req, res) =>
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

                Utils.CopyMeta(article, updatedArticle);

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
            server.Delete("/api/article", Auth, async (req, res) =>
            {
                var article = await req.ParseBodyAsync<Article>();
                var articleHtml = new ArticleHtml {Id = article.Id};
                var articleMarkdown = new ArticleMarkdown {Id = article.Id};

                var deleted = await db.DeleteAsync(article);
                await Task.WhenAll(db.DeleteAsync(articleHtml), db.DeleteAsync(articleMarkdown));
                await res.SendStatus(deleted > 1 ? HttpStatusCode.OK : HttpStatusCode.NotFound);
            });

            server.Get("/api/settings", Auth, async (req, res) => { await res.SendJson(settings); });
            server.Post("/api/settings", Auth, async (req, res) =>
            {
                var newSettings = await req.ParseBodyAsync<Settings>();
                if (newSettings == null)
                {
                    await res.SendStatus(HttpStatusCode.BadRequest);
                    return;
                }

                settings = newSettings;
                File.WriteAllText(SettingsPath, JsonConvert.SerializeObject(settings));
                await res.SendStatus(HttpStatusCode.OK);
            });
            
            server.Post("/api/changepassword", Auth, async (req, res) =>
            {
                var sessionUser = req.GetSession<User>().Data;

                var form = await req.GetFormDataAsync();

                if (form == null || form["newPassword1"] != form["newPassword2"] ||
                    !BCrypt.Net.BCrypt.Verify(form["oldPassword"], sessionUser.Password))
                {
                    await res.SendStatus(HttpStatusCode.BadRequest);
                }
                else
                {
                    sessionUser.Password = BCrypt.Net.BCrypt.HashPassword(form["newPassword1"], 11);
                    await db.UpdateAsync(sessionUser);
                    await res.SendStatus(HttpStatusCode.OK);
                }
            });

            server.Get("/api/files", Auth, async (req, res) =>
            {
                var staticFileFolder = Path.Combine(config.PublicDirectory, "files");
                var staticFileFolderUri = new Uri(staticFileFolder);

                var files = Directory.EnumerateFiles(staticFileFolder, "*", SearchOption.AllDirectories);
                var relativePaths =
                    files.Select(file => staticFileFolderUri.MakeRelativeUri(new Uri(file)).OriginalString).ToList();

                await res.SendJson(relativePaths);
            });
            server.Post("/api/files", Auth, async (req, res) =>
            {
                var saved = await req.SaveFiles(Path.Combine(config.PublicDirectory, "files"), maxSizeKb: 1024000);
                var status = saved ? HttpStatusCode.OK : HttpStatusCode.BadRequest;
                await res.SendStatus(status);
            });

            server.Get("/api/themes", Auth, async (req, res) =>
            {
                var themeDirs = Directory.EnumerateDirectories(config.ThemeDirectory)
                    .Select(Path.GetFileName);
                await res.SendJson(themeDirs);
            });
            server.Post("/api/theme", Auth, async (req, res) =>
            {
                try
                {
                    var form = await req.GetFormDataAsync();
                    var file = form.Files.FirstOrDefault();

                    var tempPath = Path.Combine(config.TempDirectory, file.FileName);
                    using (var tempFile = File.Create(tempPath))
                    {
                        await file.CopyToAsync(tempFile);
                    }
                
                    await Task.Run(() => ZipFile.ExtractToDirectory(tempPath, "themes"));
                    File.Delete(tempPath);
                    await res.SendStatus(HttpStatusCode.OK);
                }
                catch (Exception e)
                {
                    Console.WriteLine(e);
                    throw;
                }
            });


            await server.RunAsync();
        }
    }
}