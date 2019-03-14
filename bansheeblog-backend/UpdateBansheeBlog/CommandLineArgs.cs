using Commander.NET.Attributes;

namespace UpdateBansheeBlog
{
    public class CommandLineArgs
    {
        [Command("--check", Description = "Check for updates")]
        public string Check { get; set; }
        
        [Command("--install", Description = "Check for updates and install them if available")]
        public InstallArguments Install { get; set; }
        
        [Command("--wait-install", Description = "Wait for the server to exit, check for and install updates, then restart server (used by BansheeBlog backend)")]
        public InstallArguments WaitAndInstall { get; set; }
    }
    
    public class InstallArguments
    {
        [Parameter("--update-dir", "-b", Description = "The path to the extracted content of the BansheeBlog release zip-file (where the 'banshee-blog' folder is extracted to)")]
        public string UpdateDirectory;
        
        [Parameter("--backend-dir", "-b", Description = "The path to the backend server (where 'BansheeBlog.dll' is)")]
        public string BackendDirectory;
        
        [Parameter("--public-dir", "-p", Description = "The path to the public directory for the BansheeBlog installation (where the 'admin' folder is)")]
        public string PublicDirectory;
    }
}