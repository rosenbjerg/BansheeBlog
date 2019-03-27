const fs = require('fs');
const path = require('path');
const child_process = require('child_process');

const version = process.argv[2];
if (!version) {
    console.log('-- no version found in arguments --');
    return;
}
if (!version.match(/^\d+\.\d+\.\d+$/)) {
    console.log('-- invalid version. must be in the format x.x.x --');
    return;
}

console.log(`-- building BansheeBlog v. ${version} --`);

const releasePath = path.resolve('banshee-blog');
const frontendPath = path.resolve('bansheeblog-frontend');
const backendPath = path.resolve('bansheeblog-backend');

if (!fs.existsSync(releasePath)){
    fs.mkdirSync(releasePath);
}


console.log('-- updating frontend versioning --');
const frontendPackageJsonPath = path.join(frontendPath, 'package.json');
const frontendPackageJsonContent = fs.readFileSync(frontendPackageJsonPath, 'utf8');
const modifiedPackageJsonContent = frontendPackageJsonContent.replace(/"version": "[^"]+",/, `"version": "${version}",`);
fs.writeFileSync(frontendPackageJsonPath, modifiedPackageJsonContent, 'utf8');


console.log('-- updating backend versioning --');
const backendProgramPath = path.join(backendPath, 'BansheeBlog', 'Program.cs');
const backendProgramContent = fs.readFileSync(backendProgramPath, 'utf8');
const modifiedProgramContent = backendProgramContent.replace(/public const string Version = "[^"]+";/, `public const string Version = "${version}";`);
fs.writeFileSync(backendProgramPath, modifiedProgramContent, 'utf8');



console.log('-- building frontend --');
const frontendBuildScriptMatch = frontendPackageJsonContent.match(/"build": "([^"]+)"/);
const frontendBuildScipt = frontendBuildScriptMatch[1];
//child_process.exec(frontendBuildScipt, { cwd: frontendPath });
console.log(frontendBuildScipt);


console.log('-- building backend updater --');
const backendUpdaterProjectPath = path.join(backendPath, 'UpdateBansheeBlog', 'UpdateBansheeBlog.csproj');
const backendUpdaterBuildScript = `dotnet build \"${backendUpdaterProjectPath}\" --configuration Release --verbosity quiet --output \"${releasePath}\"`;
//child_process.exec(backendUpdaterBuildScript);
console.log(backendUpdaterBuildScript);

console.log('-- building backend --');
const backendProjectPath = path.join(backendPath, 'BansheeBlog', 'BansheeBlog.csproj');
const backendBuildScript = `dotnet build \"${backendProjectPath}\" --configuration Release --verbosity quiet --output \"${releasePath}\"`;
//child_process.exec(backendBuildScript);
console.log(backendBuildScript);