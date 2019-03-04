using System;
using System.Net;
using UAParser;

namespace BansheeBlog.Models
{
    public class Visit
    {
        public DateTime Timestamp { get; set; }
        public string IPv4 { get; set; }
        public string IPv6 { get; set; }
        public string OS { get; set; }
        public string Device { get; set; }
        public string UserAgent { get; set; }
        public string Page { get; set; }

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

        public Visit() { }

        public override string ToString()
        {
            return $"{Timestamp}: {IPv4} - {OS} {Device} {UserAgent} - {Page}";
        }
    }
}