using SQLite;

namespace BansheeBlog.Models
{
    class User
    {
        [PrimaryKey] 
        public string Username { get; set; }
        public string Password { get; set; }

        public string Name { get; set; } = "";
        public string Email { get; set; } = "";
    }
}