# BansheeBlog
#### A simple, personal blogging platform

### Features
- Cross-platform (.NET Core)
- Server-side rendering of articles
    - Ensures support for all browsers, even with javascript disabled
- Markdown for text-formatting of articles
    - [SimpleMDE](https://github.com/sparksuite/simplemde-markdown-editor) as a nice and useful Markdown editor
        - Markdown cheatsheet [here](https://github.com/adam-p/markdown-here/wiki/Markdown-Cheatsheet)
- Administration webapp built with [Preact](https://github.com/developit/preact)
- Backend server built with [RedHttpServer](https://github.com/rosenbjerg/Red)
    - Embedded database using [SQLite](https://github.com/praeclarum/sqlite-net)
    - Password hashing with [BCrypt](https://github.com/neoKushan/BCrypt.Net-Core)
    - Server-side rendering using
      - [Handlebars](https://github.com/rexm/Handlebars.Net)
      - [CommonMark / Markdown](https://github.com/Knagis/CommonMark.NET/)

### Installation
- Download the [latest release](https://github.com/rosenbjerg/BansheeBlog/releases)
- Extract to where you want the server to be
- Navigate inside the extracted folder in a terminal
- Run `dotnet BansheeBlog.dll` to start the server
  - A file named `credentials.txt`, containing inital admin credentials, will be created in the root folder on first start
  - A configuration file named `config.json` is created on first start
    - If you need to change it, you must (re)start the server after saving the changed configuration
    
### Upgrading
- Download the [latest release](https://github.com/rosenbjerg/BansheeBlog/releases)
- Extract all the files from the root of the `banshee-blog` folder inside the archive into the root of your BansheeBlog installation and overwrite
- Delete all the files in the `admin`-folder in your public root
- Extract everything from the folder `banshee-blog/data/public/admin`, inside the archive, into the `admin`-folder in your public root
- Extract the folders from `banshee-blog/data/themes`, inside the archive, into your `themes` folder and overwrite


    
    
    
    
    
### Contribution
Feel free to contribute to this project if you feel like it
