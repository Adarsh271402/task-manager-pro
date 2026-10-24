-- =====================================================================
-- Task Manager Pro — SQL Server schema script
-- =====================================================================
-- This script creates the database schema by hand (DBA / DB-first setup).
-- NOTE: you normally do NOT need it — the API applies EF Core migrations
-- automatically on startup (db.Database.Migrate()).
--
-- Usage:
--   sqlcmd -S localhost,1433 -U sa -P '<your password>' -i create_database.sql
--
-- After creating the schema, start the API once — it will seed demo users,
-- board columns and tasks automatically when the tables are empty.
-- =====================================================================

IF DB_ID(N'TaskManagerPro') IS NULL
    CREATE DATABASE TaskManagerPro;
GO

USE TaskManagerPro;
GO

-- ---------------------------------------------------------------------
-- Users
-- ---------------------------------------------------------------------
IF OBJECT_ID(N'dbo.Users', N'U') IS NULL
BEGIN
    CREATE TABLE dbo.Users
    (
        Id           INT IDENTITY(1,1) NOT NULL PRIMARY KEY,
        FullName     NVARCHAR(100)     NOT NULL,
        Email        NVARCHAR(200)     NOT NULL,
        PasswordHash NVARCHAR(500)     NOT NULL,
        Role         NVARCHAR(20)      NOT NULL,           -- Admin | Manager | Member
        IsActive     BIT               NOT NULL CONSTRAINT DF_Users_IsActive DEFAULT (1),
        CreatedAt    DATETIME2         NOT NULL CONSTRAINT DF_Users_CreatedAt DEFAULT (SYSUTCDATETIME())
    );

    CREATE UNIQUE INDEX IX_Users_Email ON dbo.Users (Email);
END;
GO

-- ---------------------------------------------------------------------
-- BoardColumns (Kanban columns, e.g. Week 1 .. Week 4)
-- ---------------------------------------------------------------------
IF OBJECT_ID(N'dbo.BoardColumns', N'U') IS NULL
BEGIN
    CREATE TABLE dbo.BoardColumns
    (
        Id       INT IDENTITY(1,1) NOT NULL PRIMARY KEY,
        Name     NVARCHAR(50)      NOT NULL,
        Color    NVARCHAR(20)      NOT NULL CONSTRAINT DF_BoardColumns_Color DEFAULT (N'#8b5cf6'),
        Position INT               NOT NULL
    );

    CREATE UNIQUE INDEX IX_BoardColumns_Position ON dbo.BoardColumns (Position);
END;
GO

-- ---------------------------------------------------------------------
-- Tasks
-- ---------------------------------------------------------------------
IF OBJECT_ID(N'dbo.Tasks', N'U') IS NULL
BEGIN
    CREATE TABLE dbo.Tasks
    (
        Id            INT IDENTITY(1,1) NOT NULL PRIMARY KEY,
        Title         NVARCHAR(200)     NOT NULL,
        Description   NVARCHAR(2000)    NULL,
        Priority      NVARCHAR(20)      NOT NULL,         -- Low | Medium | High | Urgent
        BoardColumnId INT               NOT NULL,
        Position      INT               NOT NULL,
        AssigneeId    INT               NULL,
        CreatorId     INT               NOT NULL,
        DueDate       DATETIME2         NULL,
        CreatedAt     DATETIME2         NOT NULL CONSTRAINT DF_Tasks_CreatedAt DEFAULT (SYSUTCDATETIME()),
        UpdatedAt     DATETIME2         NULL,

        CONSTRAINT FK_Tasks_BoardColumns FOREIGN KEY (BoardColumnId) REFERENCES dbo.BoardColumns (Id) ON DELETE RESTRICT,
        CONSTRAINT FK_Tasks_Users_Assignee FOREIGN KEY (AssigneeId) REFERENCES dbo.Users (Id) ON DELETE SET NULL,
        CONSTRAINT FK_Tasks_Users_Creator FOREIGN KEY (CreatorId) REFERENCES dbo.Users (Id) ON DELETE RESTRICT
    );

    CREATE INDEX IX_Tasks_BoardColumnId_Position ON dbo.Tasks (BoardColumnId, Position);
    CREATE INDEX IX_Tasks_AssigneeId ON dbo.Tasks (AssigneeId);
END;
GO

-- ---------------------------------------------------------------------
-- Reference seed: the four board columns from the product design.
-- (Users / tasks are seeded by the API on first run.)
-- ---------------------------------------------------------------------
IF NOT EXISTS (SELECT 1 FROM dbo.BoardColumns)
BEGIN
    INSERT INTO dbo.BoardColumns (Name, Color, Position) VALUES
        (N'Week 1', N'#6366f1', 0),
        (N'Week 2', N'#8b5cf6', 1),
        (N'Week 3', N'#a855f7', 2),
        (N'Week 4', N'#22c55e', 3);
END;
GO
