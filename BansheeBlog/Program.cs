using System;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using System.Net;
using System.Runtime.InteropServices.ComTypes;
using System.Xml.Schema;
using HandlebarsDotNet;
using LiteDB;
using Newtonsoft.Json;
using Red;
using Red.Extensions;
using Red.HandlebarsRenderer;
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
            var db = new LiteDatabase(config.LiteDbConnectionString);

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
                var path = Path.Combine(config.ThemeDirectory, settings.ActiveTheme, "index.hbs");
//                var blogPosts = db.GetCollection<BlogPost>()
//                    .Find(
//                        Query.And(Query.All(nameof(BlogPost.Created), Query.Descending),
//                            Query.EQ(nameof(BlogPost.Public), true)), limit: 5)
//                    .OrderByDescending(bp => bp.Created).ToList();

                
                var blogPosts = db.GetCollection<BlogPost>()
                    .Find(Query.All(nameof(BlogPost.Created), Query.Descending), limit: 5)
                    .OrderByDescending(bp => bp.Created).ToList();
                
                foreach (var blogPost in blogPosts)
                {
                    Utils.Lighten(blogPost);
                }

                await res.RenderTemplate(path, new
                {
                    Now = DateTime.UtcNow,
                    Posts = blogPosts,
                    Settings = settings
                });
            });

            server.Get("/:title", async (req, res) =>
            {
                var urlTitle = req.Parameters["title"];
                var blogPost = db.GetCollection<BlogPost>().FindOne(post => post.Slug == urlTitle);
                if (blogPost == null)
                {
                    var templatePath = Path.Combine(config.ThemeDirectory, settings.ActiveTheme, "error.hbs");
                    await res.RenderTemplate(templatePath, new
                    {
                        Now = DateTime.UtcNow,
                        Settings = settings,
                        title = "Article not found",
                        message = "The article was not found"
                    });
                }
                else
                {
                    var templatePath = Path.Combine(config.ThemeDirectory, settings.ActiveTheme, "post.hbs");
                    await res.RenderTemplate(templatePath, new
                    {
                        Now = DateTime.UtcNow,
                        Post = blogPost,
                        Settings = settings
                    });
                }
            });
            server.Get("/admin/articles", async (req, res) =>
            {
                var blogPost = db.GetCollection<BlogPost>().FindAll();
                await res.SendJson(blogPost);
            });
            server.Post("/admin/article", async (req, res) =>
            {
                var post = await req.ParseBodyAsync<BlogPost>();
                post.Created = DateTime.UtcNow;
                post.Edited = DateTime.UtcNow;
                post.Html = CommonMark.CommonMarkConverter.Convert(post.Markdown);

                db.GetCollection<BlogPost>().Insert(post);

                await res.SendStatus(HttpStatusCode.OK);
            });
            server.Put("/admin/article/", async (req, res) =>
            {
                var urlTitle = req.Parameters["title"];

                var post = db.GetCollection<BlogPost>().FindOne(bp => bp.Slug == urlTitle);
                if (post == null)
                {
                    await res.SendStatus(HttpStatusCode.NotFound);
                    return;
                }

                var updatedPost = await req.ParseBodyAsync<BlogPost>();

                post.Edited = DateTime.UtcNow;
                post.Title = updatedPost.Title;
                post.Slug = updatedPost.Slug;
                post.Tags = updatedPost.Tags;
                post.Markdown = updatedPost.Markdown;
                post.Html = CommonMark.CommonMarkConverter.Convert(post.Markdown);

                db.GetCollection<BlogPost>().Update(post);
                await res.SendStatus(HttpStatusCode.OK);
            });
            server.Delete("/admin/article/", async (req, res) =>
            {
                var urlTitle = req.Parameters["title"];
                var deleted = db.GetCollection<BlogPost>().Delete(bp => bp.Slug == urlTitle);
                await res.SendStatus(deleted == 1 ? HttpStatusCode.OK : HttpStatusCode.NotFound);
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