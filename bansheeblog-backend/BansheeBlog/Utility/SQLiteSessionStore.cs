using System;
using System.Threading.Tasks;
using BansheeBlog.Models;
using Red.CookieSessions;
using SQLite;

namespace BansheeBlog.Utility
{
    class SQLiteSessionStore : ICookieStore<Session>
    {
        private readonly SQLiteAsyncConnection _db;

        public SQLiteSessionStore(SQLiteAsyncConnection db)
        {
            _db = db;
        }


        public async Task<Tuple<bool, Session>> TryGet(string id)
        {
            var result = await _db.GetAsync<Session>(id);
            return new Tuple<bool, Session>(result != null, result);
        }

        public async Task<bool> TryRemove(string sessionId)
        {
            return await _db.DeleteAsync<Session>(sessionId) > 0;
        }

        public Task Set(Session session)
        {
            return _db.InsertOrReplaceAsync(session);
        }

        public async Task RemoveExpired()
        {
            var now = DateTime.UtcNow;
            await _db.Table<Session>().DeleteAsync(s => s.Expires <= now);
        }
    }
}