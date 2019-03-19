using System;
using System.IO;
using Newtonsoft.Json;

namespace BansheeBlog.Models
{
    public class Configuration
    {
        [JsonProperty(Required = Required.Always)]
        public int Port { get; set; } = 5420;
        
        [JsonProperty(Required = Required.Always)]
        public string DatabaseFilePath { get; set; } = Path.Combine("data", "database", "database.sqlite");
        
        [JsonProperty(Required = Required.Always)]
        public string AnalyticsDatabaseFilePath { get; set; } = Path.Combine("data", "database", "analytics.sqlite");
        
        [JsonProperty(Required = Required.Always)]
        public string PublicDirectory { get; set; } = Path.Combine("data", "public");
        
        [JsonProperty(Required = Required.Always)]
        public string ThemeDirectory { get; set; }  = Path.Combine("data", "themes");
        
        [JsonProperty(Required = Required.Always)]
        public string TempDirectory { get; set; } = Path.Combine("data", "temp");
        
        public static Configuration Load(string filepath)
        {
            Configuration config;
            if (!File.Exists(filepath))
            {
                config = new Configuration();
                File.WriteAllText(filepath, JsonConvert.SerializeObject(config, Formatting.Indented));
                Console.WriteLine("Default configuration created\nEdit it and restart the server if needed");
            }
            else
            {
                var json = File.ReadAllText(filepath);
                config = JsonConvert.DeserializeObject<Configuration>(json);
            }
            
            
            config.DatabaseFilePath = Path.GetFullPath(config.DatabaseFilePath);
            config.AnalyticsDatabaseFilePath = Path.GetFullPath(config.AnalyticsDatabaseFilePath);
            config.ThemeDirectory = Path.GetFullPath(config.ThemeDirectory);
            config.PublicDirectory = Path.GetFullPath(config.PublicDirectory);
            config.TempDirectory = Path.GetFullPath(config.TempDirectory);
            
            return config;
        }
    }
}