﻿using System;
using System.Collections.Concurrent;
using System.IO;
using HandlebarsDotNet;

namespace BansheeBlog.Utility
{
    internal class HandlebarsCache
    {
        private readonly ConcurrentDictionary<string, HandlebarsCacheFile> _cachedFiles = new ConcurrentDictionary<string, HandlebarsCacheFile>();

        public Action<TextWriter, object> GetRenderer(string filePath)
        {
            if (_cachedFiles.TryGetValue(filePath, out var file))
                return file.Renderer;
            file = new HandlebarsCacheFile(filePath);
            _cachedFiles.TryAdd(filePath, file);
            return file.Renderer;
        }

        private class HandlebarsCacheFile
        {
            private DateTime _updated;
            private readonly string _filePath;
            private Action<TextWriter, object> _renderer;

            public HandlebarsCacheFile(string filePath)
            {
                _filePath = filePath;
                Update();
            }

            private void Update()
            {
                using (StreamReader streamReader = File.OpenText(_filePath))
                {
                    _renderer = Handlebars.Compile(streamReader);
                    _updated = DateTime.UtcNow;
                }
            }

            public Action<TextWriter, object> Renderer
            {
                get
                {
                    if (File.GetLastWriteTimeUtc(_filePath) > _updated)
                        Update();
                    return _renderer;
                }
            }
        }
    }
}