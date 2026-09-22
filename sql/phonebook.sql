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
    @TotalCount INT OUTPUT
AS
BEGIN
    SET NOCOUNT ON;

    IF @PageNumber < 1 SET @PageNumber = 1;
    IF @PageSize < 1 SET @PageSize = 10;
    IF @PageSize > 100 SET @PageSize = 100;

    SET @SearchTerm = NULLIF(LTRIM(RTRIM(@SearchTerm)), N'');

    SELECT @TotalCount = COUNT(*)
    FROM dbo.Contacts
    WHERE @SearchTerm IS NULL
       OR Name LIKE N'%' + @SearchTerm + N'%'
       OR PhoneNumber LIKE N'%' + @SearchTerm + N'%'
       OR Email LIKE N'%' + @SearchTerm + N'%';

    SELECT Id, Name, PhoneNumber, Email, Address, CreatedAt
    FROM dbo.Contacts
    WHERE @SearchTerm IS NULL
       OR Name LIKE N'%' + @SearchTerm + N'%'
       OR PhoneNumber LIKE N'%' + @SearchTerm + N'%'
       OR Email LIKE N'%' + @SearchTerm + N'%'
    ORDER BY Name ASC, Id ASC
    OFFSET (@PageNumber - 1) * @PageSize ROWS
    FETCH NEXT @PageSize ROWS ONLY;
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
