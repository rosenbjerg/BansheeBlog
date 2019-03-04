using System;
using System.Collections.Generic;
using System.Threading.Tasks;
using BansheeBlog.Models;
using Red;
using SQLite;
using UAParser;

namespace BansheeBlog.Utility
{
    public class Tracking
    {
        private readonly Parser _userAgentParser = Parser.GetDefault();
        private readonly Configuration _config;
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
            _config = config;
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