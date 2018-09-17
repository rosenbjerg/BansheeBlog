using System;
using System.Collections.Generic;
using System.IO;
using Newtonsoft.Json;

namespace BansheeBlog
{
    class Settings
    {
        public string BlogTitle { get; set; } = "Your blog title";
        public string BlogDescription { get; set; } = "Your blog description";
        public string Author { get; set; } = "Your name";
        public string BlogUrl { get; set; } = "http://localhost:5420/";
        public string ActiveTheme { get; set; } = "default";
        public string GoogleAnalyticsTrackingId { get; set; } = "";
        public bool UseServerSideTracking { get; set; }
        
        public static Settings Load(string filepath)
        {
            if (!File.Exists(filepath))
                return new Settings();
            var json = File.ReadAllText(filepath);
            return JsonConvert.DeserializeObject<Settings>(json);
        }
    }
}