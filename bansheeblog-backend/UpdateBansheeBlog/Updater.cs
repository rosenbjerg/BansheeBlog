using System;
using System.Diagnostics;
using System.IO;
using System.IO.Compression;
using System.Linq;
using System.Net.Http;
using System.Threading.Tasks;
using BansheeBlog.Updating;
using Newtonsoft.Json;

namespace UpdateBansheeBlog
{
    public static class Updater
    {
        private const string GithubReleaseInfoUrl =
            "https://api.github.com/repos/rosenbjerg/BansheeBlog/releases/latest";

        private const string UserAgentValue = "BansheeBlogUpdater";

        private static async Task<GitHubReleaseInfo> GetLatestReleaseInfo()
        {
            using (var httpClient = new HttpClient
            {
                DefaultRequestHeaders = { {"User-Agent", UserAgentValue} }
            })
            {
                var response = await httpClient.GetAsync(GithubReleaseInfoUrl);
                var content = await response.Content.ReadAsStringAsync();
                return JsonConvert.DeserializeObject<GitHubReleaseInfo>(content);
            }
        }
        
        public static async Task<UpdatesAvailableStatus> CheckForUpdates(string currentVersion)
        {
            var releaseInfo = await GetLatestReleaseInfo();
            var version = Version.Parse(currentVersion);
            var availableVersion = Version.Parse(releaseInfo.tag_name);
            var newerAvailable = !releaseInfo.prerelease && availableVersion > version;
            
            return new UpdatesAvailableStatus
            {
                Available = newerAvailable,
                Version = releaseInfo.tag_name,
                Message = releaseInfo.body,
                Url = releaseInfo.html_url,
                Released = releaseInfo.created_at
            };
        }

        public static async Task<bool> InstallUpdates(string backendDir, string publicDir, string tempDir)
        {
            var releaseInfo = await GetLatestReleaseInfo();
            var updateAsset = releaseInfo.assets.FirstOrDefault(asset =>
                asset.name.StartsWith("banshee-blog") && asset.name.EndsWith(".zip"));
            
            if (updateAsset != null)
            {
                var unzipDir = await DownloadAndExtractUpdate(tempDir, updateAsset);
                var startInfo = new ProcessStartInfo("dotnet")
                {
                    WorkingDirectory = backendDir,
                    Arguments = $"UpdateBansheeBlog.dll --wait-install --update-dir \"{unzipDir}\" --backend-dir \"{backendDir}\" --public-dir \"{publicDir}\""
                };
                Process.Start(startInfo);
                return true;
            }
            return false;
        }

        private static async Task<string> DownloadAndExtractUpdate(string tempDir, GitHubAsset updateAsset)
        {
            var saveLocation = Path.Combine(tempDir, updateAsset.name);
            if (!File.Exists(saveLocation))
            {
                using (var httpClient = new HttpClient
                {
                    DefaultRequestHeaders = {{"User-Agent", UserAgentValue}}
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

            var unzipDir = Path.Combine(tempDir, Path.GetFileNameWithoutExtension(updateAsset.name));

            Directory.CreateDirectory(unzipDir);
            await Task.Run(() => ZipFile.ExtractToDirectory(saveLocation, unzipDir, true));
            return unzipDir;
        }

        public class UpdatesAvailableStatus
        {
            public bool Available;
            public string Version;
            public string Message;
            public string Url;
            public DateTime Released;
        }
    }
}