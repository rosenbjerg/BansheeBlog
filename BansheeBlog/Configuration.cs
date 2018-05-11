using System.IO;
using System.Runtime.InteropServices.ComTypes;
using Newtonsoft.Json;

namespace BansheeBlog
{
    class Configuration
    {
        public string LiteDbConnectionString { get; set; } 
        public int Port { get; set; }
        public string PublicDirectory { get; set; }
        public string ThemeDirectory { get; set; } 

        public static Configuration Load(string filepath)
        {
            var json = File.ReadAllText(filepath);
            return JsonConvert.DeserializeObject<Configuration>(json);
        }
    }
}