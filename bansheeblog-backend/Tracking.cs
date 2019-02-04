using System;
using System.Net;
using System.Threading.Tasks;
using Red;
using SQLite;
using UAParser;

namespace BansheeBlog
{
    public class Tracking
    {

        private readonly Parser _userAgentParser = Parser.GetDefault();
        public Task CollectInformation(Request request, string pageUrl, SQLiteAsyncConnection db)
        {
            var address = request.UnderlyingContext.Connection.RemoteIpAddress;
            var userAgent = _userAgentParser.Parse(request.Headers["User-Agent"]);
            var visit = new Visit(address, userAgent, "/" + pageUrl);
            return db.InsertAsync(visit);
        }

        class Visit
        {
            public readonly DateTime Timestamp;
            public readonly string IPv4;
            public readonly string IPv6;
            public readonly string OS;
            public readonly string Device;
            public readonly string UserAgent;
            public readonly string Page;

            public Visit(IPAddress address, ClientInfo userAgent, string pageUrl)
            {
                Timestamp = DateTime.UtcNow;
                IPv4 = address.MapToIPv4().ToString();
                IPv6 = address.MapToIPv6().ToString();
                OS = userAgent.OS.ToString();
                Device = userAgent.Device.ToString();
                UserAgent = userAgent.UserAgent.ToString();
                Page = pageUrl;
            }

            public override string ToString()
            {
                return $"{Timestamp}: {IPv4} - {OS} {Device} {UserAgent} - {Page}";
            }
        }
    }
}