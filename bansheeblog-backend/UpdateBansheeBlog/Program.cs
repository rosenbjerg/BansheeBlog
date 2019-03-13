using System;
using System.Diagnostics;
using System.IO;
using System.Reflection;
using System.Threading.Tasks;

namespace UpdateBansheeBlog
{
    class Program
    {
        static async Task Main(string[] args)
        {
            Console.WriteLine("BansheeBlog updater\n");
            if (args.Length != 3)
            {
                Console.WriteLine("Invalid arguments. This application is not for manual use");
                return;
            }

            var updateDir = args[0];
            var backendDir = args[1];
            var publicDir = args[2];

            if (!Directory.Exists(updateDir) || !Directory.Exists(backendDir) || !Directory.Exists(publicDir))
            {
                Console.WriteLine("One or more of the required directories does not exist");
                return;
            }

            Console.WriteLine("Waiting for BansheeBlog to exit...");
            await AwaitServerShutdown(backendDir);
            
            try
            {
                Console.WriteLine("Deleting backend server files");
                DeleteBackendServerFiles(backendDir);
                Console.WriteLine("Deleting admin frontend files");
                DeleteAdminFrontendFiles(publicDir);
                Console.WriteLine("Installing updated backend server files");
                MoveBackendServerFiles(updateDir, backendDir);
                Console.WriteLine("Installing updated admin frontend files");
                MoveAdminFrontendFiles(updateDir, publicDir);
                Console.WriteLine("Cleaning up after update");
                Cleanup(updateDir);
                Console.WriteLine("Starting BansheeBlog");
                StartServer(backendDir);
                
                Console.WriteLine("\nDone! This updater closes in 3 seconds, bye :)");
                await Task.Delay(3000);
            }
            catch (Exception e)
            {
                Console.WriteLine("Blast!");
                Console.WriteLine(e.Message);
            }
        }

        private static async Task AwaitServerShutdown(string backendDir)
        {
            await Task.Delay(750);
            try
            {
                File.Delete(Path.Combine(backendDir, "BansheeBlog.dll"));
            }
            catch (Exception e)
            {
                await AwaitServerShutdown(backendDir);
            }
        }
        
        private static void DeleteBackendServerFiles(string backendDir)
        {
            var files = Directory.EnumerateFiles(backendDir, "*", SearchOption.TopDirectoryOnly);
            foreach (var file in files)
            {
                if (file.Contains("UpdateBansheeBlog")) continue;
                File.Delete(file);
            }
            Directory.Delete(Path.Combine(backendDir, "runtimes"), true);
        }
        private static void DeleteAdminFrontendFiles(string publicDir)
        {
            var adminDir = Path.Combine(publicDir, "admin");
            Directory.Delete(adminDir, true);
        }

        private static void MoveBackendServerFiles(string updateDir, string backendDir)
        {
            var files = Directory.EnumerateFiles(Path.Combine(updateDir, "banshee-blog"), "*", SearchOption.TopDirectoryOnly);
            foreach (var file in files)
            {
                var newFileName = Path.Combine(backendDir, Path.GetFileName(file));
                File.Move(file, newFileName);
            }
            Directory.Move(Path.Combine(updateDir, "banshee-blog", "runtimes"), Path.Combine(backendDir, "runtimes"));
        }
        private static void MoveAdminFrontendFiles(string updateDir, string publicDir)
        {
            var updatedAdminDir = Path.Combine(updateDir, "banshee-blog", "data", "public", "admin");
            var oldAdminDir = Path.Combine(publicDir, "admin");
            Directory.Move(updatedAdminDir, oldAdminDir);
        }

        private static void Cleanup(string updateDir)
        {
            Directory.Delete(updateDir, true);
            File.Delete($"{updateDir}.zip");
        }
        private static void StartServer(string backendDir)
        {
            var startInfo = new ProcessStartInfo("dotnet")
            {
                WorkingDirectory = backendDir,
                Arguments = "BansheeBlog.dll"
            };
            Process.Start(startInfo);
        }
    }
}