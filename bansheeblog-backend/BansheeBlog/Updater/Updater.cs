using System;
using System.Diagnostics;
using System.IO;
using System.IO.Compression;
using System.Linq;
using System.Net.Http;
using System.Reflection;
using System.Threading.Tasks;
using BansheeBlog.Models;
using Newtonsoft.Json;

namespace BansheeBlog.Updater
{
    public class Updater
    {
        private const string GithubReleaseInfoUrl =
            "https://api.github.com/repos/rosenbjerg/BansheeBlog/releases/latest";

        private const string UserAgentValue = "BansheeBlogUpdater";

        private static async Task<ReleaseInfo> GetLatestReleaseInfo()
        {
            using (var httpClient = new HttpClient
            {
                DefaultRequestHeaders = { {"User-Agent", UserAgentValue} }
            })
            {
                var response = await httpClient.GetAsync(GithubReleaseInfoUrl);
                var content = await response.Content.ReadAsStringAsync();
                return JsonConvert.DeserializeObject<ReleaseInfo>(content);
            }
        }
        
        public static async Task<UpdatesAvailableStatus> CheckForUpdates()
        {
            var releaseInfo = await GetLatestReleaseInfo();
            var currentVersion = Version.Parse(Program.Version);
            var availableVersion = Version.Parse(releaseInfo.tag_name);
            var newerAvailable = !releaseInfo.prerelease && availableVersion > currentVersion;
            
            return new UpdatesAvailableStatus
            {
                Available = newerAvailable,
                Version = releaseInfo.tag_name,
                Message = releaseInfo.body,
                Url = releaseInfo.html_url
            };
        }

        public static async Task InstallUpdates(Configuration config)
        {
            var releaseInfo = await GetLatestReleaseInfo();
            var updateAsset = releaseInfo.assets.FirstOrDefault(asset =>
                asset.name.StartsWith("banshee-blog") && asset.name.EndsWith(".zip"));
            
            if (updateAsset != null)
            {
                var saveLocation = Path.Combine(config.TempDirectory, updateAsset.name);
                if (!File.Exists(saveLocation))
                {
                    using (var httpClient = new HttpClient 
                    {
                        DefaultRequestHeaders = { {"User-Agent", UserAgentValue} }
                    })
                    {
                        var response = await httpClient.GetAsync(updateAsset.browser_download_url);
                        using (var outputStream = File.Create(saveLocation))
                        using (var inputStream = await response.Content.ReadAsStreamAsync())
                        {
                            await inputStream.CopyToAsync(outputStream);
                        }
                    }
                }
                var unzipDir = Path.Combine(config.TempDirectory, Path.GetFileNameWithoutExtension(updateAsset.name));
                
                Directory.CreateDirectory(unzipDir);
                await Task.Run(() => ZipFile.ExtractToDirectory(saveLocation, unzipDir, true));

                string backendDir = Path.GetDirectoryName(new Uri(Assembly.GetExecutingAssembly().CodeBase).LocalPath);
                var startInfo = new ProcessStartInfo("dotnet")
                {
                    WorkingDirectory = backendDir,
                    Arguments = $"UpdateBansheeBlog.dll \"{unzipDir}\" \"{backendDir}\" \"{config.PublicDirectory}\""
                };
                Process.Start(startInfo);
                Environment.Exit(0);
            }
        }

        public class UpdatesAvailableStatus
        {
            public bool Available;
            public string Version;
            public string Message;
            public string Url;
        }
    }
}