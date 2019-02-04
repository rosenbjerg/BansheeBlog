using System;
using System.Collections.Generic;
using System.Runtime.InteropServices;
using Newtonsoft.Json;
using SQLite;

namespace BansheeBlog
{
    class Article
    {
        [PrimaryKey] 
        public Guid Id { get; set; } = Guid.Empty;
        
        [Indexed]
        [JsonProperty(Required = Required.Always)]
        public string Slug { get; set; }
        
        [JsonProperty(Required = Required.Always)]
        public string Title { get; set; }
        public string Tags { get; set; }
        
        public DateTime Created { get; set; }
        public DateTime Edited { get; set; }
        public DateTime Published { get; set; }
        
        [Indexed]
        public bool Public { get; set; }
        
        public string Author { get; set; }
        
        public string Html { get; set; }
        public string Markdown { get; set; }
    }

    class ArticleHtml
    {
        [PrimaryKey] 
        [JsonProperty(Required = Required.Always)]
        public Guid Id { get; set; } = Guid.NewGuid();
        
        [JsonProperty(Required = Required.Always)]
        public string Content { get; set; }
    }
    
    class ArticleMarkdown
    {
        [PrimaryKey]
        [JsonProperty(Required = Required.Always)]
        public Guid Id { get; set; } = Guid.NewGuid();
        
        [JsonProperty(Required = Required.Always)]
        public string Content { get; set; }
    }
}