using System;
using System.Collections.Generic;
using System.Globalization;
using System.Linq;
using System.Net;
using System.Runtime.Serialization;
using System.Text.RegularExpressions;
using BansheeBlog.Models;
using Microsoft.AspNetCore.Http;
using Red;

namespace BansheeBlog.Utility
{
    public static class TextFormatting
    {
        public static string FirstParagraph(string content)
        {
            return content.Substring(0, content.IndexOf("</p>") + 4);
        }

        public static void CopyMeta(Article existing, Article updated)
        {
            existing.Edited = DateTime.SpecifyKind(updated.Edited, DateTimeKind.Utc);
            existing.Created = DateTime.SpecifyKind(updated.Created, DateTimeKind.Utc);
            existing.Title = updated.Title;
            existing.Slug = updated.Slug;
            existing.Tags = updated.Tags;
            if (existing.Public != updated.Public)
            {
                existing.Published = updated.Public ? DateTime.UtcNow : existing.Published;
            }

            existing.Public = updated.Public;
        }

    }

    public static class Localization
    {
        public static string[] TimeZoneNames = TimeZoneInfo.GetSystemTimeZones()
            .Select(timezone => timezone.Id).ToArray();
        
        public static DateTimeFormatInfo GetDateTimeFormat(this Request request)
        {
            var headers = request.UnderlyingRequest.GetTypedHeaders();
            var culture = new CultureInfo(headers.AcceptLanguage.FirstOrDefault()?.Value.Value ?? "en-UK");
            return culture.DateTimeFormat;
        }
    }
}