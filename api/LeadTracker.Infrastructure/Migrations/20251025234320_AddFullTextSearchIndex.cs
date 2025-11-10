using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace LeadTracker.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class AddFullTextSearchIndex : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            // Add full-text search index for leads
            // Note: CONCURRENTLY removed to allow execution in transaction
            migrationBuilder.Sql(@"
                CREATE INDEX IF NOT EXISTS idx_leads_fulltext_search 
                ON ""Leads"" USING gin(
                    to_tsvector('english', 
                        COALESCE(""Title"", '') || ' ' ||
                        COALESCE(""FirstName"", '') || ' ' ||
                        COALESCE(""LastName"", '') || ' ' ||
                        COALESCE(""Email"", '') || ' ' ||
                        COALESCE(""Company"", '') || ' ' ||
                        COALESCE(""Notes"", '')
                    )
                );
            ");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            // Drop full-text search index
            migrationBuilder.Sql(@"DROP INDEX IF EXISTS idx_leads_fulltext_search;");
        }
    }
}
