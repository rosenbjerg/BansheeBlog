# BansheeBlog
#### A simple, personal blogging platform

### Features
- Cross-platform (.NET Core)
- Server-side rendering of articles
    - Ensures support for all browsers, even with JavaScript disabled
- Server-side analytics to collect basic information about the visits to the blog
- Markdown for text-formatting of articles
    - [SimpleMDE](https://github.com/sparksuite/simplemde-markdown-editor) as a nice and useful Markdown editor
        - Markdown cheat-sheet [here](https://github.com/adam-p/markdown-here/wiki/Markdown-Cheatsheet)
- Administration webapp built with [Preact](https://github.com/developit/preact)
- ASP.NET-based backend server built with [RedHttpServer](https://github.com/rosenbjerg/Red)
    - Embedded database using [SQLite](https://github.com/praeclarum/sqlite-net)
    - Password hashing with [BCrypt](https://github.com/neoKushan/BCrypt.Net-Core)
    - Server-side rendering using
      - [Handlebars](https://github.com/rexm/Handlebars.Net)
      - [CommonMark / Markdown](https://github.com/Knagis/CommonMark.NET/)
- Automatically install updates through the admin interface


### Installation
- Make sure the `dotnet` version `2.2` or newer is installed
- Download the [latest release](https://github.com/rosenbjerg/BansheeBlog/releases)
- Extract the content of the zip-file to the location you want the server installed
- Navigate inside the `banshee-blog` folder you just extracted in a terminal
- Start the server by running `dotnet BansheeBlog.dll`
  - A file named `credentials.txt`, containing initial admin credentials, will be created in the root folder on first start
  - A configuration file named `config.json` is created on first start
    - If you need to change it, you must (re)start the server after saving the changed configuration
    
### Manuel upgrading
- Download the [latest release](https://github.com/rosenbjerg/BansheeBlog/releases)
- Extract everything except the `data` folder from the root of the `banshee-blog` folder, inside the archive, into the root of your BansheeBlog installation and overwrite
- Delete all the files in the `admin`-folder in your public root
- Extract everything from the folder `banshee-blog/data/public/admin`, inside the archive, into the `admin`-folder in your public root
- Extract the folders from `banshee-blog/data/themes`, inside the archive, into your `themes` folder and overwrite
  
    
### Contribution
Feel free to contribute to this project if you feel like it
