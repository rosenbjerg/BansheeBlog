using System;
using Red.CookieSessions;
using SQLite;

namespace BansheeBlog.Models
{
    class Session : ICookieSession
    {
        public string Username { get; set; }
        public string Name { get; set; }
        
        public DateTime Expires { get; set; }
        [PrimaryKey]
        public string SessionId { get; set; }
    }
}