﻿using System;
using System.IO;
using System.Net;
using System.Threading.Tasks;
using BansheeBlog.Models;
using BansheeBlog.Routes;
using BansheeBlog.Utility;
using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.HttpOverrides;
using Red;
using Red.CookieSessions;
using SQLite;
using UpdateBansheeBlog;

namespace BansheeBlog
{
    class Program
    {
#if DEBUG
        public const bool DEV = true;
#else
        public const bool DEV = false;
#endif
        
        public const string Version = "1.3.0";
        public const string ConfigPath = "config.json";
        public const string SettingsPath = "settings.json";
        
        static async Task Main(string[] args)
        {
            var config = Configuration.Load(ConfigPath);
            var settings = Settings.Load(SettingsPath);
            
            var server = new RedHttpServer(config.Port, config.PublicDirectory);
            server.RespondWithExceptionDetails = DEV;
            var tracking = new Tracking(config);

            server.ConfigureApplication = app =>
            {
                app.UseForwardedHeaders(new ForwardedHeadersOptions
                {
                    ForwardedHeaders = ForwardedHeaders.XForwardedFor | ForwardedHeaders.XForwardedProto
                });
            };

            Updater.CleanupTemporaryFiles();
            
            // Setup database and tables
            Directory.CreateDirectory(Path.GetDirectoryName(config.AnalyticsDatabaseFilePath));
            var db = new SQLiteAsyncConnection(config.DatabaseFilePath);
            await Task.WhenAll(db.CreateTableAsync<Session>(),
                               db.CreateTableAsync<User>(),
                               db.CreateTableAsync<Article>(),
                               db.CreateTableAsync<ArticleHtml>(),
                               db.CreateTableAsync<ArticleMarkdown>());

            // Cookie session authentication
            server.Use(new CookieSessions<Session>(TimeSpan.FromDays(14))
            {
                Secure = !DEV,
                Store = new SQLiteSessionStore(db)
            });

            // Create directories for later use
            Directory.CreateDirectory(Path.Combine(config.PublicDirectory, "static"));
            Directory.CreateDirectory(config.TempDirectory);
            
            // Check if first start and create admin user
            StartUpCheck(db);
            
            // Initialize partial templates
            var partials = new[] {"header", "footer", "navigation", "meta", "style"};
            FileHandling.RegisterPartialRenderer(partials, config, settings);


            // Public routes
            server.Get("/", PublicRoutes.SendFrontpage(settings, tracking, db, config));
            server.Get("/article/:slug", PublicRoutes.FindFromSlug(settings, tracking, db, config));
            server.Get("/admin/*", PublicRoutes.SendAdminPWA(config));


            // Admin routes
            server.Get("/api/verify", Auth, AuthenticationRoutes.Verify());
            server.Post("/api/login", AuthenticationRoutes.Login(db));
            server.Post("/api/logout", Auth, AuthenticationRoutes.Logout());
            server.Post("/api/changepassword", Auth, AuthenticationRoutes.ChangePassword(db));


            server.Get("/api/articles", Auth, ArticleRoutes.FetchList(db));
            server.Get("/api/article/:id", Auth, ArticleRoutes.FetchOne(db));
            server.Get("/api/article/:id/markdown", Auth, ArticleRoutes.FetchOneMarkdown(db));

           
            server.Put("/api/article", Auth, ArticleRoutes.Upsert(db, settings, config));
            server.Put("/api/article/meta", Auth, ArticleRoutes.UpdateMeta(db));
            server.Delete("/api/article", Auth, ArticleRoutes.Remove(db));

            server.Get("/api/settings", Auth, SettingsRoutes.Fetch(settings));
            server.Get("/api/settings/timezones", Auth, SettingsRoutes.FetchTimeZones());
            server.Post("/api/settings", Auth, SettingsRoutes.Update(settings));

            server.Get("/api/visits/latest-month", Auth, AnalyticsRoutes.FetchLatest30Days(tracking));
            
            server.Get("/api/files", Auth, StaticFileRoutes.FetchList(config));
            server.Post("/api/file", Auth, StaticFileRoutes.Upload(config));
            server.Delete("/api/file", Auth, StaticFileRoutes.Remove(config));

            server.Get("/api/themes", Auth, ThemeRoutes.FetchList(config));
            server.Post("/api/theme", Auth, ThemeRoutes.Upload(config));
            server.Delete("/api/theme", Auth, ThemeRoutes.Remove(config));

            server.Get("/api/update", Auth, UpdatingRoutes.FetchAvailability());
            server.Post("/api/update", Auth, UpdatingRoutes.InitiateUpdate(config));


            Console.WriteLine($"\nStarting BansheeBlog v. {Version}...");
            await server.RunAsync("*");
        }
        
        
        private static async void StartUpCheck(SQLiteAsyncConnection db)
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

        private static async Task Auth(Request req, Response res)
        {
            if (req.GetSession<Session>() == null)
            {
                await res.SendStatus(HttpStatusCode.Unauthorized);
            }
        }
    }
}