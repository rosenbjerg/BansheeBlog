using System.Collections.Generic;
using System.IO;
using Newtonsoft.Json;

namespace BansheeBlog.Models
{
    public class Settings
    {
        [JsonProperty(Required = Required.Always)]
        public string BlogTitle = "Your blog title";
        
        [JsonProperty(Required = Required.Always)]
        public string BlogDescription = "Your blog description";
        
        [JsonProperty(Required = Required.Always)]
        public string Author = "Your name";
        
        [JsonProperty(Required = Required.Always)]
        public string BlogUrl = "http://localhost:5420/";
        
        [JsonProperty(Required = Required.Always)]
        public string ActiveTheme = "default";
        
        [JsonProperty(Required = Required.Always)]
        public string Timezone = "Central European Standard Time";
        
        [JsonProperty(Required = Required.Always)]
        public string GoogleAnalyticsTrackingId = "";

        [JsonProperty(Required = Required.Always)]
        public bool UseServerSideTracking = false;
        
        [JsonProperty(Required = Required.Always)]
        public List<NavigationElement> Navigation = new List<NavigationElement>();
        
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
        public string Name;
        public string Href;
        public bool OpenInNewWindow = true;
    }
}