using System;
using System.Collections.Generic;
using System.IO;
using System.Threading.Tasks;
using BansheeBlog.Models;
using Red;
using SQLite;
using UAParser;

namespace BansheeBlog.Routes
{
    public static class AnalyticsRoutes
    {
        public static Func<Request, Response, Task> FetchLatest30Days(Tracking tracking)
        {
            return async (req, res) =>
            {
                await res.SendJson(await tracking.GetLatest());
            };
        }
        
    }
    public class Tracking
    {
        private readonly Parser _userAgentParser = Parser.GetDefault();
        private readonly SQLiteAsyncConnection _db;

        public Task<List<Visit>> GetLatest()
        {
            var oneMonthAgo = DateTime.UtcNow.AddMonths(-1);
            return _db.Table<Visit>()
                .Where(v => v.Timestamp > oneMonthAgo)
                .ToListAsync();
        }
        
        public Tracking(Configuration config)
        {
            Directory.CreateDirectory(Path.GetDirectoryName(config.AnalyticsDatabaseFilePath));
            _db = new SQLiteAsyncConnection(config.AnalyticsDatabaseFilePath);
            _db.CreateTableAsync<Visit>().Wait();
        }

        public Task CollectInformation(Request request, string pageUrl)
        {
            var address = request.UnderlyingContext.Connection.RemoteIpAddress;
            var userAgent = _userAgentParser.Parse(request.Headers["User-Agent"]);
            var visit = new Visit(address, userAgent, "/" + pageUrl);
            return _db.InsertAsync(visit);
        }

    }
}