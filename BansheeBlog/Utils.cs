using System.Net;
using System.Text.RegularExpressions;

namespace BansheeBlog
{
    static class Utils
    {
        private static readonly Regex FirstParagraphRegex = new Regex("(<p>[\\s\\S]*?<\\/p>)", RegexOptions.Compiled);

        public static void Lighten(BlogPost post)
        {
            post.Markdown = "";
            var firstParagraph = FirstParagraphRegex.Match(post.Html);
            post.Html = post.Html.Substring(0, firstParagraph.Index + firstParagraph.Length);
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
    }
}