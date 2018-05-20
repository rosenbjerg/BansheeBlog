using System;
using System.Collections.Generic;
using System.Runtime.InteropServices;
using SQLite;

namespace BansheeBlog
{
    class Article
    {
        [PrimaryKey] public Guid Id { get; set; } = Guid.Empty;
        
        [Indexed]
        public string Slug { get; set; }
        public string Title { get; set; }
        public string Tags { get; set; }
        
        public DateTime Created { get; set; }
        public DateTime Edited { get; set; }
        public DateTime Published { get; set; }
        
        [Indexed]
        public bool Public { get; set; }
        
        public string Creator { get; set; }
        public string Editor { get; set; }
        public string Publisher { get; set; }
        
        public string Html { get; set; }
        public string Markdown { get; set; }
    }

    class ArticleHtml
    {
        [PrimaryKey] public Guid Id { get; set; } = Guid.NewGuid();
        public string Content { get; set; }
    }
    
    class ArticleMarkdown
    {
        [PrimaryKey] public Guid Id { get; set; } = Guid.NewGuid();
        public string Content { get; set; }
    }
}