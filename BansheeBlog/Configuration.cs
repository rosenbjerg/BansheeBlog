using System.IO;
using System.Runtime.InteropServices.ComTypes;
using Newtonsoft.Json;

namespace BansheeBlog
{
    class Configuration
    {
        public string DatabaseFilePath { get; set; } 
        public int Port { get; set; }
        public string PublicDirectory { get; set; }
        public string ThemeDirectory { get; set; } 
        public string TempDirectory { get; set; } 

        public static Configuration Load(string filepath)
        {
            var json = File.ReadAllText(filepath);
            var config = JsonConvert.DeserializeObject<Configuration>(json);
            
            config.DatabaseFilePath = Path.GetFullPath(config.DatabaseFilePath);
            config.ThemeDirectory = Path.GetFullPath(config.ThemeDirectory);
            config.PublicDirectory = Path.GetFullPath(config.PublicDirectory);
            
            return config;
        }
    }
}