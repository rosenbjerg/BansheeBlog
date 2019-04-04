const fs = require('fs');
const path = require('path');
const child_process = require('child_process');

const started = Date.now();
const version = process.argv[2];
if (!version) return console.log('-- no version found in arguments --');
if (!version.match(/^\d+\.\d+\.\d+$/)) return console.log('-- invalid version. must be in the format x.x.x --');

const title = 'BansheeBlog';
console.log(`-- building \x1b[1m${title}\x1b[0m v. \x1b[1m${version}\x1b[0m --`);

const basePath = path.resolve(`release`);
const releasePath = path.join(basePath, 'banshee-blog');
const frontendPath = path.resolve('bansheeblog-frontend');
const backendPath = path.resolve('bansheeblog-backend');

createDirectory(releasePath);

buildTask('updating frontend versioning', () => {
    const frontendPackagePath = path.join(frontendPath, 'package.json');
    return replaceInFile(frontendPackagePath, /"version": "[^"]+",/, `"version": "${version}",`);
});


buildTask('updating backend versioning', () => {
    const backendProgramPath = path.join(backendPath, 'BansheeBlog', 'Program.cs');
    return replaceInFile(backendProgramPath, /public const string Version = "[^"]+";/, `public const string Version = "${version}";`);
});

buildTask('removing old files', () => deleteFolder(basePath));

buildTask('building backend updater', () => {
    const backendUpdaterProjectPath = path.join(backendPath, 'UpdateBansheeBlog', 'UpdateBansheeBlog.csproj');
    const backendUpdaterBuildScript = `dotnet publish "${backendUpdaterProjectPath}" --configuration Release --verbosity quiet --output "${releasePath}"`;
    return !child_process.execSync(backendUpdaterBuildScript).toString().includes('Error');
});

buildTask('building backend', () => {
    const backendProjectPath = path.join(backendPath, 'BansheeBlog', 'BansheeBlog.csproj');
    const backendBuildScript = `dotnet publish "${backendProjectPath}" --configuration Release --verbosity quiet --output "${releasePath}"`;
    return !child_process.execSync(backendBuildScript).toString().includes('Error');
});

buildTask('copying themes folder', () => {
    const themesInput = path.join(backendPath, 'BansheeBlog', 'data', 'themes');
    const themesOutput = path.join(releasePath, 'data', 'themes');
    return copyFolder(themesInput, themesOutput);
});

buildTask('building frontend', () => {
    const frontendBuildDir = path.join(releasePath, 'data', 'public', 'admin');
    createDirectory(frontendBuildDir);
    const frontendBuildScript = `preact build --template src/template.html --config preact.production.config.js --dest "${frontendBuildDir}" --clean`;
    return !child_process.execSync(frontendBuildScript, { cwd: frontendPath ,  }).toString().includes('Error');
});

buildTask('copying favicons', () => {
    const faviconsInput = path.resolve('favicons');
    const faviconsOutput = path.join(releasePath, 'data', 'public');
    return copyFolder(faviconsInput, faviconsOutput);
});

buildTask('building zip archive', () => zipDirectory(releasePath, `banshee-blog-v-${version.replace(/\./g, '-')}.zip`));

buildTask('removing archived files', () => deleteFolder(basePath));

console.log(`-- done building in \x1b[32m${((Date.now() - started) / 1000.0).toFixed(1)}\x1b[0m seconds --`);





function buildTask(title, action) {
    process.stdout.write(` ${title}..`.padEnd(35));
    const taskStarted = Date.now();
    let success = true;
    try {
        success = action();
    }
    catch (e) {
        success = false;
    }
    let elapsed = Date.now() - taskStarted;
    let time = elapsed > 1000 ? `${(elapsed / 1000.0).toFixed(1)}s` : `${elapsed}ms`;
    let color = success ? '\x1b[32m' : '\x1b[31m';
    console.log(color + time.padEnd(8) + (success ? '' : 'FAILED!') + '\x1b[0m');
    if (!success) {
        console.log(`--\x1b[31m release build failed after ${((Date.now() - buildStarted) / 1000.0).toFixed(1)} seconds \x1b[0m--`);
        process.exit();
    }
}

function zipDirectory(sourceDir, outputFilename) {
    if (fs.existsSync(outputFilename)) fs.unlinkSync(outputFilename);
    let command;
    if (process.platform === 'win32')
        command = `powershell.exe -nologo -noprofile -command "& { Add-Type -A 'System.IO.Compression.FileSystem'; [IO.Compression.ZipFile]::CreateFromDirectory('${sourceDir}', '${outputFilename}', '0', 'true'); }"`;
    else
        command = `zip -r -y "${outputFilename}" "${sourceDir}"`;
    
    return !child_process.execSync(command).toString().includes('error');
}

function replaceInFile(file, regex, replacement) {
    const original = fs.readFileSync(file, 'utf8');
    const modified = original.replace(regex, replacement);
    fs.writeFileSync(file, modified, 'utf8');
    return true;
}

function createDirectory(dir) {
    if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
    }
}

function copyFolder(input, output) {
    if (fs.existsSync(input)) {
        copyFolderRec(input, output);
        return true;
    }
    else return false;
}

function copyFolderRec(input, output) {
    createDirectory(output);
    const entries = fs.readdirSync(input, { withFileTypes: true });
    const mappedEntries = entries.map(entry => ([entry, entry.isFile()]));
    mappedEntries.forEach(entry => {
        const inputPath = path.join(input, entry[0].name);
        const outputPath = path.join(output, entry[0].name);
        if (entry[1]) fs.copyFileSync(inputPath, outputPath);
        else copyFolderRec(inputPath, outputPath);
    });
}
function createDirectory(dir) {
    if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
    }
    return true;
}

function deleteFolder(dir) {
    if (fs.existsSync(dir)) {
        deleteFolderRec(dir);
    }
    return true;
}
function deleteFolderRec(dir) {
    const entries = fs.readdirSync(dir, { withFileTypes: true });
    const mappedEntries = entries.map(entry => ([entry, entry.isFile()]));
    mappedEntries.forEach(entry => {
        const inputPath = path.join(dir, entry[0].name);
        if (entry[1]) fs.unlinkSync(inputPath);
        else deleteFolderRec(inputPath);
    });
    fs.rmdirSync(dir);
}