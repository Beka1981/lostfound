using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Design;
namespace LostFound.Infrastructure.Persistence;
public sealed class DesignTimeDbContextFactory : IDesignTimeDbContextFactory<LostFoundDbContext>
{
 public LostFoundDbContext CreateDbContext(string[] args) { var connection = Environment.GetEnvironmentVariable("ConnectionStrings__DefaultConnection") ?? throw new InvalidOperationException("ConnectionStrings__DefaultConnection is required for EF tooling."); var options = new DbContextOptionsBuilder<LostFoundDbContext>().UseNpgsql(connection).Options; return new(options); }
}
