/* CyberMax Solutions - Phonebook Application
   SQL Server Express / T-SQL
*/

IF DB_ID(N'PhonebookDb') IS NULL
BEGIN
    CREATE DATABASE PhonebookDb;
END
GO

USE PhonebookDb;
GO

IF OBJECT_ID(N'dbo.Contacts', N'U') IS NULL
BEGIN
    CREATE TABLE dbo.Contacts
    (
        Id INT IDENTITY(1,1) NOT NULL CONSTRAINT PK_Contacts PRIMARY KEY,
        Name NVARCHAR(255) NOT NULL,
        PhoneNumber NVARCHAR(50) NOT NULL CONSTRAINT UQ_Contacts_PhoneNumber UNIQUE,
        Email NVARCHAR(255) NULL,
        Address NVARCHAR(MAX) NULL,
        CreatedAt DATETIME NOT NULL CONSTRAINT DF_Contacts_CreatedAt DEFAULT GETDATE()
    );
END
GO

IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = N'IX_Contacts_Name_Id_Covering' AND object_id = OBJECT_ID(N'dbo.Contacts'))
BEGIN
    -- Covering index for the paged search: rows come out in ORDER BY Name, Id
    -- directly from the index, so the engine sorts nothing and performs no
    -- key lookups when serving OFFSET / FETCH pages.
    CREATE INDEX IX_Contacts_Name_Id_Covering
        ON dbo.Contacts (Name ASC, Id ASC)
        INCLUDE (PhoneNumber, Email, Address, CreatedAt);
END
GO

CREATE OR ALTER PROCEDURE dbo.sp_GetContactsPaged
    @PageNumber INT,
    @PageSize INT,
    @SearchTerm NVARCHAR(255) = NULL,
    @SortBy NVARCHAR(20) = N'Name',
    @SortOrder NVARCHAR(4) = N'ASC',
    @TotalCount INT OUTPUT
AS
BEGIN
    SET NOCOUNT ON;

    IF @PageNumber < 1 SET @PageNumber = 1;
    IF @PageSize < 1 SET @PageSize = 10;
    IF @PageSize > 100 SET @PageSize = 100;

    -- Whitelist sort inputs inside the engine: anything unexpected falls back
    -- to Name ASC. No dynamic SQL is used anywhere here.
    IF @SortBy NOT IN (N'Name', N'PhoneNumber', N'Email', N'CreatedAt') SET @SortBy = N'Name';
    IF @SortOrder NOT IN (N'ASC', N'DESC') SET @SortOrder = N'ASC';

    SET @SearchTerm = NULLIF(LTRIM(RTRIM(@SearchTerm)), N'');

    SELECT @TotalCount = COUNT(*)
    FROM dbo.Contacts
    WHERE @SearchTerm IS NULL
       OR Name LIKE N'%' + @SearchTerm + N'%'
       OR PhoneNumber LIKE N'%' + @SearchTerm + N'%'
       OR Email LIKE N'%' + @SearchTerm + N'%';

    -- Sort key comes ONLY from this CASE map: user input can never reach the
    -- SQL text. The statement itself stays fully parameterized via
    -- sp_executesql. This lets the optimizer use index order directly
    -- (no Sort operator, minimal memory grant) instead of a CASE-based sort.
    DECLARE @OrderBy NVARCHAR(100) =
      CASE @SortBy
        WHEN N'PhoneNumber' THEN N'PhoneNumber'
        WHEN N'Email' THEN N'Email'
        WHEN N'CreatedAt' THEN N'CreatedAt'
        ELSE N'Name'
      END + CASE WHEN @SortOrder = N'DESC' THEN N' DESC' ELSE N' ASC' END
      + N', Id ASC';

    DECLARE @Sql NVARCHAR(MAX) = N'
    SELECT Id, Name, PhoneNumber, Email, Address, CreatedAt
    FROM dbo.Contacts
    WHERE (@SearchTerm IS NULL
       OR Name LIKE N''%'' + @SearchTerm + N''%''
       OR PhoneNumber LIKE N''%'' + @SearchTerm + N''%''
       OR Email LIKE N''%'' + @SearchTerm + N''%'')
    ORDER BY ' + @OrderBy + N'
    OFFSET (@PageNumber - 1) * @PageSize ROWS
    FETCH NEXT @PageSize ROWS ONLY;';

    EXEC sp_executesql @Sql,
      N'@SearchTerm NVARCHAR(255), @PageNumber INT, @PageSize INT',
      @SearchTerm, @PageNumber, @PageSize;
END
GO

-- Google-like autocomplete source: distinct names starting with the typed prefix.
-- Prefix LIKE (no leading wildcard) seeks the name index; TOP limits the scan.
CREATE OR ALTER PROCEDURE dbo.sp_GetContactSuggestions
    @Term NVARCHAR(255),
    @Limit INT = 10
AS
BEGIN
    SET NOCOUNT ON;

    SET @Term = LTRIM(RTRIM(@Term));
    IF @Term IS NULL OR @Term = N'' RETURN;
    IF @Limit < 1 SET @Limit = 10;
    IF @Limit > 20 SET @Limit = 20;

    SELECT DISTINCT TOP (@Limit) Name
    FROM dbo.Contacts
    WHERE Name LIKE @Term + N'%'
    ORDER BY Name ASC;
END
GO

CREATE OR ALTER PROCEDURE dbo.sp_GetContactById
    @Id INT
AS
BEGIN
    SET NOCOUNT ON;

    SELECT Id, Name, PhoneNumber, Email, Address, CreatedAt
    FROM dbo.Contacts
    WHERE Id = @Id;
END
GO

CREATE OR ALTER PROCEDURE dbo.sp_InsertContact
    @Name NVARCHAR(255),
    @PhoneNumber NVARCHAR(50),
    @Email NVARCHAR(255) = NULL,
    @Address NVARCHAR(MAX) = NULL,
    @NewId INT OUTPUT
AS
BEGIN
    SET NOCOUNT ON;

    INSERT INTO dbo.Contacts (Name, PhoneNumber, Email, Address)
    VALUES (@Name, @PhoneNumber, @Email, @Address);

    SET @NewId = CONVERT(INT, SCOPE_IDENTITY());
END
GO

CREATE OR ALTER PROCEDURE dbo.sp_UpdateContact
    @Id INT,
    @Name NVARCHAR(255),
    @PhoneNumber NVARCHAR(50),
    @Email NVARCHAR(255) = NULL,
    @Address NVARCHAR(MAX) = NULL
AS
BEGIN
    SET NOCOUNT ON;

    UPDATE dbo.Contacts
    SET Name = @Name,
        PhoneNumber = @PhoneNumber,
        Email = @Email,
        Address = @Address
    WHERE Id = @Id;
END
GO

CREATE OR ALTER PROCEDURE dbo.sp_DeleteContact
    @Id INT
AS
BEGIN
    SET NOCOUNT ON;

    DELETE FROM dbo.Contacts
    WHERE Id = @Id;
END
GO

-- Optional sample records for testing. Run once if desired.
-- INSERT INTO dbo.Contacts (Name, PhoneNumber, Email, Address) VALUES
-- (N'Rahul Patil', N'9876543210', N'rahul@example.com', N'Pune'),
-- (N'Priya Sharma', N'9876543211', N'priya@example.com', N'Mumbai');
