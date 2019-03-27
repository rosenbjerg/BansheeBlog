using System.Collections.Generic;
using System.IO;
using Newtonsoft.Json;

namespace BansheeBlog.Models
{
    public class Settings
    {
        [JsonProperty(Required = Required.Always)]
        public string BlogTitle { get; set; } = "Your blog title";
        
        [JsonProperty(Required = Required.Always)]
        public string BlogDescription { get; set; } = "Your blog description";
        
        [JsonProperty(Required = Required.Always)]
        public string Author { get; set; } = "Your name";
        
        [JsonProperty(Required = Required.Always)]
        public string BlogUrl { get; set; } = "http://localhost:5420/";
        
        [JsonProperty(Required = Required.Always)]
        public string ActiveTheme { get; set; } = "default";
        
        [JsonProperty(Required = Required.Always)]
        public string GoogleAnalyticsTrackingId { get; set; } = "";
        
        [JsonProperty(Required = Required.Always)]
        public bool UseServerSideTracking { get; set; }
        
        [JsonProperty(Required = Required.Always)]
        public List<NavigationElement> Navigation { get; set; } = new List<NavigationElement>();
        
        public static Settings Load(string filepath)
        {
            if (!File.Exists(filepath))
                return new Settings();
            var json = File.ReadAllText(filepath);
            var obj = JsonConvert.DeserializeObject<Settings>(json);
            return obj;
        }
    }

    public class NavigationElement
    {
        public string Name { get; set; }
        public string Href { get; set; }
    }
}