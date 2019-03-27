using System;
using System.Net;
using System.Threading.Tasks;
using BansheeBlog.Models;
using Red;
using Red.CookieSessions;
using SQLite;

namespace BansheeBlog.Routes
{
    public static class AuthenticationRoutes
    {
        public static Func<Request, Response, Task> Logout()
        {
            return async (req, res) =>
            {
                await req.GetSession<Session>().Close(req);
                await res.SendStatus(HttpStatusCode.OK);
            };
        }

        public static Func<Request, Response, Task> Login(SQLiteAsyncConnection db)
        {
            return async (req, res) =>
            {
                var form = await req.GetFormDataAsync();
                string username = form["username"];
                string password = form["password"];
                
                var user = await db.FindAsync<User>(u => u.Username == username);

                if (user == null || !BCrypt.Net.BCrypt.Verify(password, user.Password))
                {
                    await res.SendStatus(HttpStatusCode.BadRequest);
                    return;
                }

                await req.OpenSession(new Session
                {
                    Username = user.Username,
                    Name = user.Name
                });
                await res.SendStatus(HttpStatusCode.OK);
            };
        }

        public static Func<Request, Response, Task> Verify()
        {
            return async (req, res) =>
            {
                var session = req.GetSession<Session>();
                await session.Renew(req);
                await res.SendStatus(HttpStatusCode.OK);
            };
        }
        
        
        public static Func<Request, Response, Task> ChangePassword(SQLiteAsyncConnection db)
        {
            return async (req, res) =>
            {
                var sessionUser = req.GetSession<Session>();
                var user = await db.FindAsync<User>(u => u.Username == sessionUser.Username);

                if (user == null)
                {
                    await res.SendStatus(HttpStatusCode.Unauthorized);
                    return;
                }
                
                var form = await req.GetFormDataAsync();

                if (form == null || form["newPassword1"] != form["newPassword2"] || form["newPassword1"][0].Length < 8 ||
                    !BCrypt.Net.BCrypt.Verify(form["oldPassword"], user.Password))
                {
                    await res.SendStatus(HttpStatusCode.BadRequest);
                }
                else
                {
                    user.Password = BCrypt.Net.BCrypt.HashPassword(form["newPassword1"], 11);
                    await db.UpdateAsync(user);
                    await res.SendStatus(HttpStatusCode.OK);
                }
            };
        }
    }
}