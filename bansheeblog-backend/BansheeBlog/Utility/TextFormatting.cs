using System;
using System.Net;
using System.Text.RegularExpressions;
using BansheeBlog.Models;

namespace BansheeBlog.Utility
{
    public static class TextFormatting
    {
        private static readonly Regex FirstParagraphRegex = new Regex("(<p>[\\s\\S]*?<\\/p>)", RegexOptions.Compiled);

        public static string FirstParagraph(string content)
        {
            var firstParagraph = FirstParagraphRegex.Match(content);
            return content.Substring(0, firstParagraph.Index + firstParagraph.Length);
        }

        public static string CreateUrlTitle(string title)
        {
            var urlTitle = title
                .Replace(" ", "-")
                .Replace("'", "")
                .ToLowerInvariant()
                .Trim();
            return WebUtility.UrlEncode(urlTitle);
        }
        public static void CopyMeta(Article existing, Article updated)
        {
            existing.Edited = DateTime.UtcNow;
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