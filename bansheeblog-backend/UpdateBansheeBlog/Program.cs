using System;
using System.Collections.Generic;
using System.Diagnostics;
using System.IO;
using System.Linq;
using System.Reflection;
using System.Threading.Tasks;
using Commander.NET;

namespace UpdateBansheeBlog
{
    class Program
    {
        private const string InstallCommand = " --install";
        private const string WaitInstallCommand = " --wait-install";
        private const string CheckCommand = " --check";

        private static readonly string[] UpdaterFiles = {"UpdateBansheeBlog.dll", "UpdateBansheeBlog.runtimeconfig.json", "Newtonsoft.Json.dll", "Commander.NET.dll"};
        
        static async Task Main(string[] args)
        {
            Console.WriteLine("BansheeBlog updater\n");
            var parser = new CommanderParser<CommandLineArgs>();
            Console.WriteLine(parser.Usage());

            CommandLineArgs parsedArgs;
            try
            {
                parsedArgs = parser.Parse();
            }
            catch (Exception e)
            {
                Console.WriteLine(e.Message);
                return;
            }

            if (parsedArgs.Check != null)
            {
                Console.WriteLine("Check is not yet supported");
            }
            else if (parsedArgs.Install != null || parsedArgs.WaitAndInstall != null)
            {
                var wait = parsedArgs.WaitAndInstall != null;
                var installArgs = wait ? parsedArgs.WaitAndInstall : parsedArgs.Install;
               
                var updateDir = installArgs.UpdateDirectory;
                var backendDir = installArgs.BackendDirectory;
                var publicDir = installArgs.PublicDirectory;
                
                if (!Directory.Exists(updateDir) || !Directory.Exists(backendDir) || !Directory.Exists(publicDir))
                {
                    Console.WriteLine("One or more of the required directories does not exist");
                    return;
                }


                if (wait)
                {
                    Console.WriteLine("Waiting for BansheeBlog to exit...");
                    await AwaitServerShutdown(backendDir);
                }
            
                try
                {
                    Console.WriteLine("Deleting backend server files");
                    File.Delete(Path.Combine(backendDir, "BansheeBlog.dll")); // Main file first to ensure it is closed
                    DeleteBackendServerFiles(backendDir);
                    
                    Console.WriteLine("Deleting admin frontend files");
                    DeleteAdminFrontendFiles(publicDir);
                    
                    Console.WriteLine("Installing updated backend server files");
                    MoveBackendServerFiles(updateDir, backendDir);
                    
                    Console.WriteLine("Installing updated admin frontend files");
                    MoveAdminFrontendFiles(updateDir, publicDir);
                    
                    Console.WriteLine("Cleaning up after update");
                    Cleanup(updateDir);

                    if (wait)
                    {
                        Console.WriteLine("Starting BansheeBlog");
                        StartServer(backendDir);
                    }
                
                    Console.WriteLine("\nDone! This updater closes in 3 seconds, bye :)");
                    await Task.Delay(3000);
                }
                catch (Exception e)
                {
                    Console.WriteLine("Blast!");
                    Console.WriteLine(e.Message);
                }
            }
        }

        private static async Task AwaitServerShutdown(string backendDir)
        {
            await Task.Delay(750);
            try
            {
                File.Delete(Path.Combine(backendDir, "BansheeBlog.dll"));
            }
            catch (Exception)
            {
                await AwaitServerShutdown(backendDir);
            }
        }
        
        private static void DeleteBackendServerFiles(string backendDir)
        {
            var files = Directory.EnumerateFiles(backendDir, "*", SearchOption.TopDirectoryOnly)
                .Where(file => !UpdaterFiles.Contains(Path.GetFileName(file)));
            
            foreach (var file in files)
            {
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