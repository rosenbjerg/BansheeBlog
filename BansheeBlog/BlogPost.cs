using System;
using System.Collections.Generic;
using LiteDB;

namespace BansheeBlog
{
    class BlogPost
    {
        public ObjectId Id { get; set; }
        
        public string Slug { get; set; }
        public string Title { get; set; }
        public List<string> Tags { get; set; }
        
        public DateTime Created { get; set; }
        public DateTime Edited { get; set; }
        public DateTime Published { get; set; }
        
        public string Markdown { get; set; }
        public string Html { get; set; }
        
        public bool Public { get; set; }
        
        public string Creator { get; set; }
        public string Editor { get; set; }
        public string Publisher { get; set; }
    }
}