const fs = require('fs');
const path = require('path');
const child_process = require('child_process');

const started = Date.now();
const version = process.argv[2];
if (!version) return console.log('-- no version found in arguments --');
if (!version.match(/^\d+\.\d+\.\d+$/)) return console.log('-- invalid version. must be in the format x.x.x --');

console.log(`-- building BansheeBlog v. ${version} --`);

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
    const frontendBuildDir = path.join(frontendPath, 'data', 'public', 'admin');
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

console.log(`-- done building in ${((Date.now() - started) / 1000.0).toFixed(1)} seconds --`);


function buildTask(title, action) {
    process.stdout.write(` ${title}..`.padEnd(35))
    const started = Date.now();
    const success = action();
    let elapsed = Date.now() - started;
    if (elapsed > 1000) process.stdout.write(`${(elapsed / 1000.0).toFixed(1)}s`.padEnd(8));
    else process.stdout.write(`${elapsed}ms`.padEnd(8));
    console.log(success ? '' : 'FAILED!');
    if (!success) process.exit();
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
    try {
        const original = fs.readFileSync(file, 'utf8');
        const modified = original.replace(regex, replacement);
        fs.writeFileSync(file, modified, 'utf8');
        return true;
    }
    catch (e) {
        return false;
    }
}

function createDirectory(dir) {
    if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
    }
}

function copyFolder(input, output) {
    try {
        copyFolderRec(input, output);
        return true;
    }
    catch (e) {
        return false;
    }
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

function deleteFolder(input) {
    try {
        deleteFolderRec(input);
        return true;
    }
    catch (e) {
        return false;
    }
}

function deleteFolderRec(input) {
    const entries = fs.readdirSync(input, { withFileTypes: true });
    const mappedEntries = entries.map(entry => ([entry, entry.isFile()]));
    mappedEntries.forEach(entry => {
        const inputPath = path.join(input, entry[0].name);
        if (entry[1]) fs.unlinkSync(inputPath);
        else deleteFolderRec(inputPath);
    });
    fs.rmdirSync(input);
}