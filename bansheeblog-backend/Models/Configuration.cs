using System.IO;
using System.Linq;
using Newtonsoft.Json;

namespace BansheeBlog.Models
{
    public class Configuration
    {
        [JsonProperty(Required = Required.Always)]
        public string DatabaseFilePath { get; set; }
        
        [JsonProperty(Required = Required.Always)]
        public string AnalyticsDatabaseFilePath { get; set; }
        
        [JsonProperty(Required = Required.Always)]
        public int Port { get; set; }
        
        [JsonProperty(Required = Required.Always)]
        public string PublicDirectory { get; set; }
        
        [JsonProperty(Required = Required.Always)]
        public string ThemeDirectory { get; set; } 
        
        [JsonProperty(Required = Required.Always)]
        public string TempDirectory { get; set; } 
        
        public static Configuration Load(string filepath)
        {
            var numbers = Enumerable.Range(0, 100).Where(x => x % 2 == 0);
            
            
            var json = File.ReadAllText(filepath);
            var config = JsonConvert.DeserializeObject<Configuration>(json);
            
            config.DatabaseFilePath = Path.GetFullPath(config.DatabaseFilePath);
            config.ThemeDirectory = Path.GetFullPath(config.ThemeDirectory);
            config.PublicDirectory = Path.GetFullPath(config.PublicDirectory);
            
            return config;
        }
    }
}