import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import bcrypt from 'bcryptjs';
import { Pool } from 'pg';
import type {
  Course,
  CourseChapter,
  User,
  PDFDocument,
  LearningProgress,
  Certificate,
  TutorConversation,
  PlatformAdminStats,
  FinalExamQuestion,
  FinalExamAttempt,
  FinalExamStatus,
  FinalExamQuestionResult,
  LearningActivityRecord,
  StudentCourseProgress,
  UserProgressSummary,
} from '../types/index.ts';

export interface DBUser {
  id: string;
  name: string;
  email: string;
  passwordHash: string;
  createdAt: string;
  coursesCreated: number;
  avatarUrl?: string;
  emailVerified?: boolean;
}

export interface OTPRecord {
  verificationId: string;
  email: string;
  otpHash: string;
  expiresAt: number;
  attempts: number;
  verifiedAt?: number;
  usedAt?: number;
  lastSentAt: number;
  resetToken?: string;
}

export interface Enrollment {
  id: string;
  userId: string;
  courseId: string;
  enrolledAt: string;
  completedAt?: string;
  status: 'active' | 'completed';
}

interface DBData {
  users: DBUser[];
  courses: Course[];
  enrollments: Enrollment[];
  studentProgress: StudentCourseProgress[];
  otps: OTPRecord[];
  pdfDocuments: PDFDocument[];
  learningProgress: LearningProgress[];
  certificates: Certificate[];
  tutorConversations: TutorConversation[];
  finalExamAttempts: FinalExamAttempt[];
  learningActivities: LearningActivityRecord[];
}


const DATA_DIR = path.resolve(process.cwd(), 'data');
const DB_FILE = path.resolve(DATA_DIR, 'course_studio_db.json');

// Ensure data directory exists
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

export const DEFAULT_USER: DBUser = {
  id: 'user_default_1',
  name: 'AlphaWave Learner',
  email: 'learner@alphawave.ai',
  passwordHash: 'password123',
  createdAt: new Date().toISOString(),
  coursesCreated: 0,
};

const INITIAL_COURSES: Course[] = [
  {
    id: 'course-sql-101',
    userId: 'platform_instructor',
    title: 'Introduction to SQL for Beginners',
    description: 'Learn SQL and relational databases. Master table design, querying, filtering, multi-table joins, and aggregate business analysis.',
    category: 'Programming',
    difficulty: 'Beginner',
    duration: '1 hour',
    noOfChapters: 5,
    numberOfChapters: 5,
    includeVideo: true,
    thumbnailUrl: '/src/assets/images/banner_sql_course_1794057965712.jpg',
    thumbnailPrompt: 'Professional SQL database course thumbnail',
    createdAt: new Date().toISOString(),
    creatorName: 'AlphaWave AI',
    userEmail: 'learner@alphawave.ai',
    progress: 20,
    chapters: [
      {
        id: 'ch-sql-1',
        chapterNumber: 1,
        title: 'What is SQL and Relational Databases?',
        description: 'This chapter introduces SQL as a language for interacting with databases and explains the concept of relational databases, focusing on their structure and key components.',
        duration: '25 minutes',
        videoId: '3T39CMHUS9U',
        videoTitle: 'SQL Tutorial - Full Database Course for Beginners',
        videoChannel: 'freeCodeCamp.org',
        completed: true,
        isUnlocked: true,
        assessmentScore: 100,
        content: {
          introduction: 'SQL (Structured Query Language) is a powerful and widely used programming language designed specifically for managing and manipulating data stored in relational databases. It acts as a bridge between users and the database, allowing you to interact with data in a structured and efficient way.',
          sections: [
            {
              title: 'What is SQL?',
              content: 'SQL (Structured Query Language) is a standard language for storing, manipulating and retrieving data in relational database management systems. Whether querying small tables or analyzing millions of enterprise transactions, SQL provides a declarative interface to specify what data you want without managing low-level storage routines.',
            },
            {
              title: 'Relational Databases',
              content: 'A relational database organizes data into tables. Each table has rows (records) and columns (fields). Tables can be related to each other through shared columns, forming a network of interconnected data. This structure allows for efficient data storage, retrieval, and management.',
            },
            {
              title: 'Key Concepts in Relational Databases',
              content: `Understanding these concepts is crucial for working with SQL and relational databases:

• Tables: Tables are the fundamental building blocks of a relational database. They hold organized data in a tabular format, with rows representing individual records and columns representing specific attributes or fields. For example, a 'Customers' table might have columns for 'CustomerID', 'Name', 'Address', and 'Phone Number'.

• Rows (Records): Each row in a table represents a single instance or record of the data. For example, a row in the 'Customers' table would contain information about a specific customer, such as their ID, name, address, and phone number.

• Columns (Fields): Columns represent the attributes or characteristics of each record in a table. They define the data types and structure of the information stored in the rows. In the 'Customers' table, 'CustomerID', 'Name', 'Address', and 'Phone Number' would be individual columns.

• Primary Key: A primary key is a special column (or a combination of columns) that uniquely identifies each record in a table. It ensures that each row is distinct and prevents duplication. For example, 'CustomerID' could be the primary key for the 'Customers' table.

• Foreign Key: A foreign key is a column (or a combination of columns) in one table that references the primary key of another table. It establishes a relationship between the tables, allowing you to link related data. For example, an 'Orders' table might have a 'CustomerID' column that acts as a foreign key referencing the 'Customers' table, connecting orders to the specific customers who placed them.

• Data Integrity: Relational databases enforce data integrity, ensuring the accuracy and consistency of data. This is achieved through constraints like primary keys, foreign keys, and data validation rules, which help prevent inconsistencies, duplicates, and invalid data entries.`,
            },
            {
              title: 'Advantages of Relational Databases',
              content: `Relational databases provide several distinct architectural advantages:

• Structured and organized data: Data is well-defined and organized into tables, promoting consistency and ease of access.
• Data integrity: Constraints ensure accurate and reliable data by preventing inconsistencies and errors.
• Scalability: Relational databases can handle large amounts of data and can be scaled horizontally or vertically as needed.
• Security: Access control mechanisms can be implemented to protect sensitive data.`,
            },
          ],
          keyTakeaways: [
            'SQL is the universal declarative language for interacting with relational databases.',
            'A primary key uniquely identifies rows; a foreign key links child rows back to parent records.',
            'Relational tables organize data into rows (records) and columns (fields/attributes).',
            'Data integrity constraints prevent duplicates, null violations, and orphan records.',
          ],
        },
        assessment: {
          mcqs: [
            {
              id: 'sql_1_1',
              question: 'What does SQL stand for in database management systems?',
              options: [
                'Structured Question Logic',
                'Structured Query Language',
                'Simple Query Language',
                'Sequential Query Loop',
              ],
              correctAnswerIndex: 1,
              explanation: 'SQL stands for Structured Query Language, the ANSI standard language designed specifically for managing data stored in relational databases.',
            },
            {
              id: 'sql_1_2',
              question: 'Which component uniquely identifies each record in a relational database table?',
              options: ['Foreign Key', 'Secondary Index', 'Primary Key', 'Composite Field'],
              correctAnswerIndex: 2,
              explanation: 'A Primary Key is a special column or set of columns that uniquely identifies each row in a table, guaranteeing uniqueness and preventing duplicates.',
            },
            {
              id: 'sql_1_3',
              question: 'What is the primary role of a Foreign Key in a relational database?',
              options: [
                'To reference the Primary Key of another table and establish a relationship between them',
                'To encrypt user passwords across all tables',
                'To automatically sort rows in ascending order',
                'To eliminate the need for columns and fields',
              ],
              correctAnswerIndex: 0,
              explanation: 'A Foreign Key points to the Primary Key of another table, establishing referential integrity and linking related records (such as Orders to Customers).',
            },
            {
              id: 'sql_1_4',
              question: 'In relational database terminology, what does an individual row (record) in a table represent?',
              options: [
                'The data type of a column',
                'The database connection credentials',
                'The name of the database index',
                'A single instance or data record (e.g., one specific customer or order)',
              ],
              correctAnswerIndex: 3,
              explanation: 'Each row (record) in a table represents a single discrete entity instance, holding values corresponding to each column attribute.',
            },
            {
              id: 'sql_1_5',
              question: 'Which of the following is a key advantage of relational databases highlighted in this lecture?',
              options: [
                'Removing the need for tables and schemas',
                'Data integrity enforced via primary keys, foreign keys, and validation constraints',
                'Storing only unstructured text files without relations',
                'Preventing users from running queries',
              ],
              correctAnswerIndex: 1,
              explanation: 'Relational databases enforce data integrity through constraints, ensuring accuracy, consistency, and prevention of duplicate or invalid entries.',
            },
          ],
          writingQuestions: [],
        },
      },
      {
        id: 'ch-sql-2',
        chapterNumber: 2,
        title: 'Basic SQL Commands: SELECT, WHERE, ORDER BY',
        description: 'This chapter dives into essential SQL commands for selecting data, filtering results with WHERE clauses, and sorting datasets using ORDER BY.',
        duration: '25 minutes',
        videoId: 'k7wWlMpKoLQ',
        videoTitle: 'SQL Basics Tutorial - SELECT, WHERE, ORDER BY',
        videoChannel: 'Luke Barousse',
        completed: false,
        isUnlocked: true,
        content: {
          introduction: 'In this 25-minute session, we master the foundational query clauses of SQL: selecting columns, restricting returned rows with boolean WHERE criteria, and ordering records with ORDER BY.',
          sections: [
            {
              title: 'SELECT Statement',
              content: 'The SELECT statement is the foundation of SQL, used to retrieve data from one or more tables. It specifies the columns you want to extract and optionally filters the results based on certain criteria.',
              codeSnippet: `SELECT * FROM Customers; -- Retrieve all columns and rows from the Customers table\nSELECT Name, Email FROM Customers; -- Retrieve only the Name and Email columns from Customers`,
              codeLanguage: 'sql',
            },
            {
              title: 'WHERE Clause',
              content: 'The WHERE clause is used to filter the results of a SELECT statement, retrieving only rows that meet specific conditions. You can use comparison operators, logical operators, and functions within the WHERE clause.',
              codeSnippet: `SELECT * FROM Customers WHERE City = 'New York'; -- Retrieve rows from Customers where City is 'New York'\nSELECT * FROM Orders WHERE OrderDate >= '2023-01-01'; -- Retrieve rows from Orders placed in 2023 or later\nSELECT * FROM Products WHERE Price BETWEEN 10 AND 50; -- Retrieve rows from Products where Price is between 10 and 50`,
              codeLanguage: 'sql',
            },
            {
              title: 'ORDER BY Clause',
              content: 'The ORDER BY clause sorts the results of a SELECT statement in ascending or descending order based on one or more columns. You can specify the sorting direction using ASC (ascending) or DESC (descending).',
              codeSnippet: `SELECT * FROM Customers ORDER BY Name ASC; -- Sort Customers by Name in ascending order\nSELECT * FROM Products ORDER BY Price DESC; -- Sort Products by Price in descending order\nSELECT * FROM Orders ORDER BY OrderDate ASC, CustomerID DESC; -- Sort Orders first by OrderDate ascending, then by CustomerID descending`,
              codeLanguage: 'sql',
            },
          ],
          keyTakeaways: [
            'SELECT specifies which columns to retrieve; FROM specifies the source table.',
            'WHERE filters rows based on evaluation conditions like =, !=, >, <, and BETWEEN.',
            'ORDER BY defaults to ascending order (ASC); explicitly add DESC for descending order.',
            'Multiple columns can be specified in ORDER BY to sort hierarchically.',
          ],
        },
        assessment: {
          mcqs: [
            {
              id: 'sql_2_1',
              question: 'Which SQL statement is the fundamental command used to retrieve data from database tables?',
              options: ['FETCH', 'GET', 'SELECT', 'QUERY'],
              correctAnswerIndex: 2,
              explanation: 'The SELECT statement is the primary SQL command used to query and retrieve data from one or more tables.',
            },
            {
              id: 'sql_2_2',
              question: 'What does the asterisk (*) denote in the query `SELECT * FROM Customers;`?',
              options: [
                'Retrieve only the primary key column',
                'Count the total number of customers',
                'Delete the Customers table',
                'Retrieve all columns and all rows from the table',
              ],
              correctAnswerIndex: 3,
              explanation: 'The asterisk (*) wildcard in a SELECT clause instructs the database to return all columns for the target table.',
            },
            {
              id: 'sql_2_3',
              question: 'Which clause is used to filter query results to only rows satisfying a specific condition?',
              options: ['FILTER BY', 'WHERE', 'HAVING ONLY', 'LIMIT'],
              correctAnswerIndex: 1,
              explanation: 'The WHERE clause specifies search conditions to filter rows returned by a query.',
            },
            {
              id: 'sql_2_4',
              question: 'How do you sort query results in descending order by product price?',
              options: [
                'ORDER BY Price DESC',
                'SORT BY Price DOWN',
                'ORDER BY Price ASCENDING',
                'FILTER BY Price DESC',
              ],
              correctAnswerIndex: 0,
              explanation: 'The DESC keyword in the ORDER BY clause sorts query results in descending order.',
            },
            {
              id: 'sql_2_5',
              question: 'What results are returned by `SELECT * FROM Products WHERE Price BETWEEN 10 AND 50;`?',
              options: [
                'Only products with a price strictly equal to 10 or 50',
                'Products with a price greater than 50',
                'All products with a price inclusively between 10 and 50',
                'All products except those priced between 10 and 50',
              ],
              correctAnswerIndex: 2,
              explanation: 'The SQL BETWEEN operator filters a result set within an inclusive range between two specified boundary values.',
            },
          ],
          writingQuestions: [],
        },
      },
      {
        id: 'ch-sql-3',
        chapterNumber: 3,
        title: 'Data Manipulation: INSERT, UPDATE, DELETE',
        description: 'Understand how to add records, safely update existing data, and remove obsolete rows using DML commands.',
        duration: '25 minutes',
        videoId: 'DHRQgvek4Ro',
        videoTitle: 'SQL Data Manipulation: INSERT, UPDATE, DELETE in Depth',
        videoChannel: 'Socratica',
        completed: false,
        isUnlocked: false,
        content: {
          introduction: 'In this 25-minute lecture, we explore Data Manipulation Language (DML) commands: inserting new rows, modifying records safely with condition checks, and executing targeted deletions.',
          sections: [
            {
              title: 'INSERT Statement',
              content: 'The INSERT INTO statement is used to insert new records into a table. You specify the table name and the list of columns, followed by the VALUES keyword and the corresponding values.',
              codeSnippet: `INSERT INTO Customers (CustomerID, Name, Email, City)\nVALUES (101, 'John Doe', 'john@example.com', 'New York');`,
              codeLanguage: 'sql',
            },
            {
              title: 'UPDATE Statement',
              content: 'The UPDATE statement is used to modify existing records in a table. It is critical to always provide a WHERE clause; omitting the WHERE clause will overwrite the specified columns across every single row in the table!',
              codeSnippet: `UPDATE Customers\nSET City = 'Los Angeles', Email = 'john.updated@example.com'\nWHERE CustomerID = 101;`,
              codeLanguage: 'sql',
            },
            {
              title: 'DELETE Statement',
              content: 'The DELETE statement is used to remove existing records from a table. Pairing DELETE with a WHERE clause ensures only targeted records are removed, preserving the table structure and remaining rows.',
              codeSnippet: `DELETE FROM Customers\nWHERE CustomerID = 101;`,
              codeLanguage: 'sql',
            },
          ],
          keyTakeaways: [
            'INSERT INTO adds new rows into a database table.',
            'UPDATE modifies existing column values; always use a WHERE clause to prevent accidental bulk updates.',
            'DELETE removes rows meeting WHERE criteria; omitting WHERE removes all rows.',
          ],
        },
        assessment: {
          mcqs: [
            {
              id: 'sql_3_1',
              question: 'Which SQL statement is used to add new rows of data into a table?',
              options: ['ADD ROW', 'APPEND', 'CREATE RECORD', 'INSERT INTO'],
              correctAnswerIndex: 3,
              explanation: 'The INSERT INTO statement is the standard SQL DML command used to insert new rows into a table.',
            },
            {
              id: 'sql_3_2',
              question: 'What happens if you execute an UPDATE statement without including a WHERE clause?',
              options: [
                'Every single row in the entire table will be updated with the new values',
                'The database throws a syntax error and cancels the query',
                'Only the first row in the table is updated',
                'No rows are modified',
              ],
              correctAnswerIndex: 0,
              explanation: 'Omitting the WHERE clause in an UPDATE statement causes the update to apply to all records in the table.',
            },
            {
              id: 'sql_3_3',
              question: 'Which SQL command deletes targeted records from a table while retaining the table definition?',
              options: ['DROP TABLE', 'ERASE', 'DELETE FROM', 'REMOVE'],
              correctAnswerIndex: 2,
              explanation: 'DELETE FROM deletes rows from a table while preserving the table schema and column definitions.',
            },
            {
              id: 'sql_3_4',
              question: 'How does DELETE FROM differ from DROP TABLE in SQL?',
              options: [
                'DELETE is for views only while DROP is for tables',
                'DELETE removes rows while keeping the table; DROP TABLE completely destroys the table structure and its data',
                'DELETE can only be used once per day',
                'There is no difference between them',
              ],
              correctAnswerIndex: 1,
              explanation: 'DELETE removes table rows (data), whereas DROP TABLE completely removes the entire table schema and all its data from the database.',
            },
            {
              id: 'sql_3_5',
              question: 'Which keyword in an INSERT statement introduces the literal values to be inserted?',
              options: ['RECORDS', 'DATA', 'INPUT', 'VALUES'],
              correctAnswerIndex: 3,
              explanation: 'The VALUES keyword specifies the data values corresponding to the target column list.',
            },
          ],
          writingQuestions: [],
        },
      },
      {
        id: 'ch-sql-4',
        chapterNumber: 4,
        title: 'Joins and Aggregations',
        description: 'This chapter covers essential SQL concepts like joins to combine data from multiple tables and aggregation functions for calculating summaries.',
        duration: '25 minutes',
        videoId: 'Y7Kqbc0sDGI',
        videoTitle: 'SQL Joins Explained In-Depth: INNER, LEFT, RIGHT, FULL',
        videoChannel: 'Alex The Analyst',
        completed: false,
        isUnlocked: false,
        content: {
          introduction: 'In this 25-minute class, we master relational joins to merge datasets across multiple tables using foreign keys, and utilize aggregate functions with GROUP BY to calculate business metrics.',
          sections: [
            {
              title: 'Types of Joins',
              content: `A JOIN clause combines rows from two or more tables based on a related column between them (typically a foreign key).\n\n• INNER JOIN: Returns records that have matching values in both tables.\n• LEFT JOIN: Returns all records from the left table, and the matched records from the right table (unmatched right columns return NULL).\n• RIGHT JOIN: Returns all records from the right table, and the matched records from the left table.\n• FULL OUTER JOIN: Returns all records when there is a match in either left or right table.`,
              codeSnippet: `SELECT Customers.Name, Orders.OrderID, Orders.TotalAmount\nFROM Customers\nINNER JOIN Orders ON Customers.CustomerID = Orders.CustomerID;`,
              codeLanguage: 'sql',
            },
            {
              title: 'Filtering and Sorting Joined Data',
              content: 'You can apply WHERE conditions and ORDER BY sorting to joined query results to filter across related entities.',
              codeSnippet: `SELECT Customers.Name, Orders.OrderDate\nFROM Customers\nLEFT JOIN Orders ON Customers.CustomerID = Orders.CustomerID\nWHERE Orders.OrderDate >= '2023-01-01'\nORDER BY Customers.Name ASC;`,
              codeLanguage: 'sql',
            },
            {
              title: 'Aggregating Data with GROUP BY & HAVING',
              content: 'Aggregate functions (COUNT, SUM, AVG, MIN, MAX) calculate summaries over sets of values. The GROUP BY clause groups rows with identical values in specified columns, while HAVING filters aggregated groups.',
              codeSnippet: `SELECT City, COUNT(*) AS TotalCustomers, AVG(Age) AS AvgAge\nFROM Customers\nGROUP BY City\nHAVING COUNT(*) >= 5\nORDER BY TotalCustomers DESC;`,
              codeLanguage: 'sql',
            },
          ],
          keyTakeaways: [
            'INNER JOIN returns only rows with matches in both tables.',
            'LEFT JOIN returns all rows from the left table even if no match exists on the right.',
            'The ON clause specifies the join condition matching foreign and primary keys.',
            'WHERE filters individual rows before grouping; HAVING filters aggregated groups after GROUP BY.',
          ],
        },
        assessment: {
          mcqs: [
            {
              id: 'sql_4_1',
              question: 'Which type of JOIN returns only records that have matching values in BOTH participating tables?',
              options: ['INNER JOIN', 'FULL JOIN', 'LEFT JOIN', 'CROSS JOIN'],
              correctAnswerIndex: 0,
              explanation: 'An INNER JOIN selects records that have matching values in both tables based on the join predicate.',
            },
            {
              id: 'sql_4_2',
              question: 'If you want to list ALL customers regardless of whether they have placed an order, which JOIN should you use?',
              options: ['INNER JOIN', 'LEFT JOIN', 'EXCLUSIVE JOIN', 'NULL JOIN'],
              correctAnswerIndex: 1,
              explanation: 'A LEFT JOIN returns all rows from the left table (Customers) and matching rows from the right table (Orders), filling unmatched order columns with NULL.',
            },
            {
              id: 'sql_4_3',
              question: 'What is the purpose of the ON clause in a SQL JOIN statement?',
              options: [
                'To turn on database performance caching',
                'To rename the database table',
                'To limit the query execution time',
                'To specify the relationship condition (e.g. matching primary and foreign keys)',
              ],
              correctAnswerIndex: 3,
              explanation: 'The ON clause specifies the join condition that determines how rows from the two tables are linked.',
            },
            {
              id: 'sql_4_4',
              question: 'Which SQL aggregate function calculates the arithmetic average of numeric values in a column?',
              options: ['SUM()', 'MEDIAN()', 'AVG()', 'COUNT()'],
              correctAnswerIndex: 2,
              explanation: 'The AVG() aggregate function returns the average (arithmetic mean) of an expression.',
            },
            {
              id: 'sql_4_5',
              question: 'What is the fundamental difference between the WHERE clause and the HAVING clause in SQL?',
              options: [
                'WHERE filters individual rows before grouping; HAVING filters groups after GROUP BY aggregation',
                'WHERE is only used with numbers; HAVING is only used with text',
                'WHERE sorts results; HAVING filters results',
                'There is zero functional difference',
              ],
              correctAnswerIndex: 0,
              explanation: 'WHERE filters rows before any grouping calculations occur. HAVING filters the aggregated summary groups created by GROUP BY.',
            },
          ],
          writingQuestions: [],
        },
      },
      {
        id: 'ch-sql-5',
        chapterNumber: 5,
        title: 'Practice Exercises and Project',
        description: 'This chapter provides hands-on practice exercises to solidify your understanding of SQL concepts, followed by a complete database project that uses the topics covered in previous chapters.',
        duration: '25 minutes',
        videoId: 'AZ29DXaJ1Ts',
        videoTitle: 'SQL Project | SQL Case Study to Solve and Practice',
        videoChannel: 'techTFQ',
        completed: false,
        isUnlocked: false,
        content: {
          introduction: 'In this concluding 25-minute session, we consolidate all previous lessons into real-world practice exercises and execute an end-to-end e-commerce database case study.',
          sections: [
            {
              title: 'Hands-on Practice Exercises',
              content: 'Practice exercises are essential for solidifying your understanding of SQL concepts and gaining hands-on experience. They involve applying SQL commands to solve real data problems.',
              codeSnippet: `-- Practice Query: High-Value Customer Analysis\nSELECT c.Name, COUNT(o.OrderID) AS OrderCount, SUM(o.TotalAmount) AS TotalSpent\nFROM Customers c\nINNER JOIN Orders o ON c.CustomerID = o.CustomerID\nGROUP BY c.CustomerID, c.Name\nHAVING SUM(o.TotalAmount) > 1000\nORDER BY TotalSpent DESC;`,
              codeLanguage: 'sql',
            },
            {
              title: 'Capstone Database Case Study',
              content: 'In this capstone case study, you design an e-commerce database schema, write data ingestion scripts, implement relational integrity with foreign keys, and construct analytical business reports.',
              codeSnippet: `-- Indexing for Query Performance\nCREATE INDEX idx_orders_customer ON Orders(CustomerID);\nCREATE INDEX idx_orders_date ON Orders(OrderDate);`,
              codeLanguage: 'sql',
            },
            {
              title: 'Summary & Conclusion',
              content: 'Congratulations on completing the course! You have mastered relational modeling, fundamental queries, data manipulation, joins, aggregations, and practical capstone analytics.',
            },
          ],
          keyTakeaways: [
            'Combine SELECT, WHERE, JOIN, and GROUP BY to generate complex analytical reports.',
            'Indexes accelerate data retrieval queries on frequently filtered columns.',
            'Always enforce referential integrity using primary and foreign keys in relational designs.',
          ],
        },
        assessment: {
          mcqs: [
            {
              id: 'sql_5_1',
              question: 'What is the primary benefit of creating an index on a database column (e.g., CREATE INDEX)?',
              options: [
                'Doubles the storage capacity of the database server',
                'Significantly speeds up data retrieval and search performance for queries filtering on that column',
                'Automatically converts text columns to numeric values',
                'Eliminates the need for a primary key',
              ],
              correctAnswerIndex: 1,
              explanation: 'Database indexes work like a book index, allowing the database engine to find rows quickly without performing full table scans.',
            },
            {
              id: 'sql_5_2',
              question: 'In an e-commerce database, what type of cardinality relationship exists between Customers and Orders?',
              options: [
                'One-to-One (1:1)',
                'Zero-to-Zero',
                'Many-to-Many (M:N) without an intermediate table',
                'One-to-Many (1:N)',
              ],
              correctAnswerIndex: 3,
              explanation: 'One customer can place many orders, but each order is placed by exactly one customer (a 1:N One-to-Many relationship).',
            },
            {
              id: 'sql_5_3',
              question: 'Which query correctly counts the number of orders placed by each customer and shows only those with more than 3 orders?',
              options: [
                'SELECT CustomerID, COUNT(*) FROM Orders GROUP BY CustomerID HAVING COUNT(*) > 3;',
                'SELECT CustomerID, COUNT(*) FROM Orders WHERE COUNT(*) > 3;',
                'SELECT CustomerID FROM Orders ORDER BY 3;',
                'SELECT COUNT(CustomerID) FROM Orders LIMIT 3;',
              ],
              correctAnswerIndex: 0,
              explanation: 'GROUP BY CustomerID aggregates orders by customer, and HAVING COUNT(*) > 3 filters to only customers with more than 3 orders.',
            },
            {
              id: 'sql_5_4',
              question: 'What does referential integrity prevent in an interconnected database schema?',
              options: [
                'The creation of database tables',
                'Running SELECT queries on weekends',
                'Orphan records (e.g. an order referencing a customer ID that does not exist)',
                'Using numbers in customer names',
              ],
              correctAnswerIndex: 2,
              explanation: 'Referential integrity ensures foreign key values always correspond to an existing primary key in the referenced parent table.',
            },
            {
              id: 'sql_5_5',
              question: 'What is the recommended best practice before running an UPDATE or DELETE query on a production database?',
              options: [
                'Delete the entire database and re-install',
                'First run a SELECT query with the identical WHERE clause to preview the exact rows that will be affected',
                'Remove all WHERE clauses to save typing time',
                'Shut down the server without saving',
              ],
              correctAnswerIndex: 1,
              explanation: 'Running a preview SELECT with the exact WHERE clause ensures you verify the target rows before executing irreversible data modifications.',
            },
          ],
          writingQuestions: [],
        },
      },
    ],
  },
];

// In-Memory Fast Cache with Neon PostgreSQL Background Persistence
let memoryCache: DBData = {
  users: [DEFAULT_USER],
  courses: INITIAL_COURSES,
  enrollments: [],
  studentProgress: [],
  otps: [],
  pdfDocuments: [],
  learningProgress: [],
  certificates: [
    {
      id: 'cert_sql_mastery_demo',
      certificateId: 'CERT-AW-1794-DEMO1',
      userId: 'demo_archive_user', // Isolated archive - never leaks to active students
      userName: 'Mhadev Biradar',
      courseId: 'course-sql-101',
      courseTitle: 'Introduction to SQL for Beginners',
      category: 'Database & SQL',
      score: 95,
      issueDate: 'November 8, 2026',
      verificationUrl: '/verify-certificate/CERT-AW-1794-DEMO1',
      instructorName: 'AlphaWave AI Academic Board',
    },
  ],
  tutorConversations: [],
  finalExamAttempts: [],
  learningActivities: [],
};


// PostgreSQL Connection Pool (Optional - fallback to memory & JSON file storage)
const PG_URL = process.env.DATABASE_URL;

function isValidPostgresUrl(url?: string): boolean {
  if (!url || typeof url !== 'string') return false;
  const trimmed = url.trim();
  // Must be a valid postgres URI scheme
  if (!trimmed.startsWith('postgres://') && !trimmed.startsWith('postgresql://')) {
    return false;
  }
  // Discard dummy placeholders like "MY_DATABASE_URL", "base", or template values
  if (
    trimmed.includes('MY_DATABASE_URL') ||
    trimmed.includes('placeholder') ||
    trimmed === 'postgres://' ||
    trimmed === 'postgresql://'
  ) {
    return false;
  }
  try {
    const parsed = new URL(trimmed);
    const host = parsed.hostname;
    if (!host || host === 'base' || host.includes('MY_') || (host === 'localhost' && !process.env.PG_ALLOW_LOCALHOST)) {
      return false;
    }
    return true;
  } catch {
    return false;
  }
}

let pgPool: Pool | null = null;
if (isValidPostgresUrl(PG_URL)) {
  try {
    pgPool = new Pool({
      connectionString: PG_URL,
      ssl: { rejectUnauthorized: false },
      max: 5,
      connectionTimeoutMillis: 3000,
      idleTimeoutMillis: 30000,
    });
    pgPool.on('error', (err) => {
      console.warn('[PostgreSQL Pool Notice]', err.message);
      pgPool = null;
    });
  } catch (err: any) {
    console.warn('[PostgreSQL] Could not initialize pool, falling back to local storage:', err?.message);
    pgPool = null;
  }
} else {
  pgPool = null;
}

// Initialize tables and sync data on server startup
async function initDatabase() {
  if (!pgPool) return;

  try {
    await pgPool.query(`
      CREATE TABLE IF NOT EXISTS users (
        id VARCHAR(64) PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        email VARCHAR(255) UNIQUE NOT NULL,
        password_hash VARCHAR(255) DEFAULT '',
        created_at TIMESTAMPTZ DEFAULT NOW(),
        courses_created INT DEFAULT 0
      );
      CREATE TABLE IF NOT EXISTS courses (
        id VARCHAR(64) PRIMARY KEY,
        user_id VARCHAR(64) NOT NULL,
        title TEXT NOT NULL,
        description TEXT,
        category VARCHAR(64),
        difficulty VARCHAR(64),
        duration VARCHAR(64),
        no_of_chapters INT DEFAULT 5,
        number_of_chapters INT DEFAULT 5,
        include_video BOOLEAN DEFAULT true,
        video_included BOOLEAN DEFAULT true,
        thumbnail_url TEXT,
        thumbnail_prompt TEXT,
        pdf_sources JSONB,
        chapters JSONB,
        progress INT DEFAULT 0,
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ,
        creator_name VARCHAR(255),
        user_email VARCHAR(255),
        author JSONB
      );
      CREATE TABLE IF NOT EXISTS otps (
        email VARCHAR(255) PRIMARY KEY,
        otp VARCHAR(16) NOT NULL,
        expires_at BIGINT NOT NULL
      );

      -- Safe idempotent migrations for pre-existing tables
      ALTER TABLE users ADD COLUMN IF NOT EXISTS password_hash VARCHAR(255) DEFAULT '';
      ALTER TABLE users ADD COLUMN IF NOT EXISTS courses_created INT DEFAULT 0;
      ALTER TABLE users ADD COLUMN IF NOT EXISTS avatar_url TEXT;

      ALTER TABLE courses ADD COLUMN IF NOT EXISTS no_of_chapters INT DEFAULT 5;
      ALTER TABLE courses ADD COLUMN IF NOT EXISTS number_of_chapters INT DEFAULT 5;
      ALTER TABLE courses ADD COLUMN IF NOT EXISTS include_video BOOLEAN DEFAULT true;
      ALTER TABLE courses ADD COLUMN IF NOT EXISTS video_included BOOLEAN DEFAULT true;
      ALTER TABLE courses ADD COLUMN IF NOT EXISTS thumbnail_url TEXT;
      ALTER TABLE courses ADD COLUMN IF NOT EXISTS thumbnail_prompt TEXT;
      ALTER TABLE courses ADD COLUMN IF NOT EXISTS pdf_sources JSONB;
      ALTER TABLE courses ADD COLUMN IF NOT EXISTS chapters JSONB;
      ALTER TABLE courses ADD COLUMN IF NOT EXISTS progress INT DEFAULT 0;
      ALTER TABLE courses ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT NOW();
      ALTER TABLE courses ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ;
      ALTER TABLE courses ADD COLUMN IF NOT EXISTS creator_name VARCHAR(255);
      ALTER TABLE courses ADD COLUMN IF NOT EXISTS user_email VARCHAR(255);
      ALTER TABLE courses ADD COLUMN IF NOT EXISTS author JSONB;
    `);

    // Fetch existing users from Postgres
    const userRes = await pgPool.query('SELECT * FROM users');
    if (userRes.rows.length > 0) {
      memoryCache.users = userRes.rows.map(r => ({
        id: r.id,
        name: r.name,
        email: r.email,
        passwordHash: r.password_hash || '',
        createdAt: r.created_at?.toISOString() || new Date().toISOString(),
        coursesCreated: parseInt(r.courses_created, 10) || 0,
        avatarUrl: r.avatar_url || undefined,
      }));
    } else {
      // Seed default user into Postgres
      await pgPool.query(
        'INSERT INTO users (id, name, email, password_hash, created_at, courses_created) VALUES ($1, $2, $3, $4, $5, $6) ON CONFLICT (id) DO NOTHING',
        [DEFAULT_USER.id, DEFAULT_USER.name, DEFAULT_USER.email, DEFAULT_USER.passwordHash, DEFAULT_USER.createdAt, DEFAULT_USER.coursesCreated]
      );
    }

    // Fetch existing courses from Postgres
    const coursesRes = await pgPool.query('SELECT * FROM courses ORDER BY created_at DESC');
    if (coursesRes.rows.length > 0) {
      memoryCache.courses = coursesRes.rows.map(r => ({
        id: r.id,
        userId: r.user_id,
        title: r.title,
        description: r.description || '',
        category: r.category || 'General',
        difficulty: r.difficulty || 'Beginner',
        duration: r.duration || '1 hour',
        noOfChapters: r.no_of_chapters || r.number_of_chapters || 5,
        numberOfChapters: r.no_of_chapters || r.number_of_chapters || 5,
        includeVideo: r.include_video ?? r.video_included ?? true,
        thumbnailUrl: r.thumbnail_url,
        thumbnailPrompt: r.thumbnail_prompt,
        pdfSources: r.pdf_sources || undefined,
        chapters: r.chapters || [],
        progress: r.progress || 0,
        createdAt: r.created_at?.toISOString() || new Date().toISOString(),
        updatedAt: r.updated_at?.toISOString(),
        creatorName: r.creator_name || (r.author ? r.author.name : null) || 'Instructor',
        userEmail: r.user_email || (r.author ? r.author.email : null) || '',
      }));
    }

    // Always ensure initial starter courses are upserted with latest 25-min chapters, notes, and 5-MCQ assessments
    for (const c of INITIAL_COURSES) {
      const chapterCount = c.noOfChapters || c.numberOfChapters || 5;
      const authorObj = JSON.stringify({
        name: c.creatorName || 'Instructor',
        email: c.userEmail || '',
      });

      await pgPool.query(
        `INSERT INTO courses (
          id, user_id, title, description, category, difficulty, duration,
          no_of_chapters, number_of_chapters, include_video, video_included,
          thumbnail_url, thumbnail_prompt, chapters, progress, created_at, creator_name, user_email, author
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19)
        ON CONFLICT (id) DO UPDATE SET
          title = EXCLUDED.title,
          description = EXCLUDED.description,
          duration = EXCLUDED.duration,
          chapters = EXCLUDED.chapters,
          no_of_chapters = EXCLUDED.no_of_chapters,
          number_of_chapters = EXCLUDED.number_of_chapters,
          thumbnail_url = EXCLUDED.thumbnail_url,
          author = EXCLUDED.author,
          updated_at = NOW()`,
        [
          c.id, c.userId, c.title, c.description, c.category, c.difficulty, c.duration,
          chapterCount, chapterCount, c.includeVideo, c.includeVideo,
          c.thumbnailUrl, c.thumbnailPrompt, JSON.stringify(c.chapters), c.progress, c.createdAt, c.creatorName, c.userEmail, authorObj
        ]
      ).catch(e => console.warn('[PostgreSQL] Seed upsert warning:', e?.message));
    }

    // Refresh courses list from PostgreSQL
    const refreshedCoursesRes = await pgPool.query('SELECT * FROM courses ORDER BY created_at DESC');
    if (refreshedCoursesRes.rows.length > 0) {
      memoryCache.courses = refreshedCoursesRes.rows.map(r => ({
        id: r.id,
        userId: r.user_id,
        title: r.title,
        description: r.description || '',
        category: r.category || 'General',
        difficulty: r.difficulty || 'Beginner',
        duration: r.duration || '1 hour',
        noOfChapters: r.no_of_chapters || r.number_of_chapters || 5,
        numberOfChapters: r.no_of_chapters || r.number_of_chapters || 5,
        includeVideo: r.include_video ?? r.video_included ?? true,
        thumbnailUrl: r.thumbnail_url,
        thumbnailPrompt: r.thumbnail_prompt,
        pdfSources: r.pdf_sources || undefined,
        chapters: typeof r.chapters === 'string' ? JSON.parse(r.chapters) : (r.chapters || []),
        progress: r.progress || 0,
        createdAt: r.created_at?.toISOString() || new Date().toISOString(),
        updatedAt: r.updated_at?.toISOString(),
        creatorName: r.creator_name || (r.author ? r.author.name : null) || 'Instructor',
        userEmail: r.user_email || (r.author ? r.author.email : null) || '',
      }));
    }

    console.log(`[PostgreSQL] Synchronized ${memoryCache.users.length} users and ${memoryCache.courses.length} courses.`);
  } catch {
    pgPool = null;
    console.log('[PostgreSQL] Remote database unreachable, using local storage engine.');
  }
}

// Start background connection to PostgreSQL
initDatabase();

// Load initial from JSON if file exists
function loadLocalFile(): void {
  try {
    if (fs.existsSync(DB_FILE)) {
      const raw = fs.readFileSync(DB_FILE, 'utf-8');
      const parsed = JSON.parse(raw);
      if (parsed.users && Array.isArray(parsed.users)) {
        memoryCache.users = parsed.users;
      }
      if (parsed.courses && Array.isArray(parsed.courses)) {
        memoryCache.courses = parsed.courses;
      }
      if (parsed.otps) {
        memoryCache.otps = parsed.otps;
      }
      if (parsed.pdfDocuments && Array.isArray(parsed.pdfDocuments)) {
        memoryCache.pdfDocuments = parsed.pdfDocuments;
      }
      if (parsed.learningProgress && Array.isArray(parsed.learningProgress)) {
        memoryCache.learningProgress = parsed.learningProgress;
      }
      if (parsed.certificates && Array.isArray(parsed.certificates)) {
        memoryCache.certificates = parsed.certificates;
      }
      if (parsed.tutorConversations && Array.isArray(parsed.tutorConversations)) {
        memoryCache.tutorConversations = parsed.tutorConversations;
      }
      if (parsed.finalExamAttempts && Array.isArray(parsed.finalExamAttempts)) {
        memoryCache.finalExamAttempts = parsed.finalExamAttempts;
      }
      if (parsed.enrollments && Array.isArray(parsed.enrollments)) {
        memoryCache.enrollments = parsed.enrollments;
      }
      if (parsed.studentProgress && Array.isArray(parsed.studentProgress)) {
        memoryCache.studentProgress = parsed.studentProgress;
      }
      if (parsed.learningActivities && Array.isArray(parsed.learningActivities)) {
        memoryCache.learningActivities = parsed.learningActivities;
      }
    }
  } catch {
    // ignore
  }
}
loadLocalFile();

function syncToDisk(): void {
  try {
    fs.writeFileSync(DB_FILE, JSON.stringify(memoryCache, null, 2), 'utf-8');
  } catch {
    // ignore
  }
}

// User Methods
export function findUserByEmail(email: string): DBUser | undefined {
  if (!email) return undefined;
  return memoryCache.users.find(u => u.email.toLowerCase() === email.trim().toLowerCase());
}

export function findUserById(id: string): DBUser | undefined {
  if (!id) return undefined;
  return memoryCache.users.find(u => u.id === id);
}

export function hashPassword(plain: string): string {
  return bcrypt.hashSync(plain, 10);
}

export function verifyUserPassword(user: DBUser, passwordAttempt: string): boolean {
  if (!user || !user.passwordHash) return false;
  try {
    if (user.passwordHash.startsWith('$2a$') || user.passwordHash.startsWith('$2b$')) {
      return bcrypt.compareSync(passwordAttempt, user.passwordHash);
    }
    // Backward compatibility for demo plain text
    if (user.passwordHash === passwordAttempt) {
      user.passwordHash = hashPassword(passwordAttempt);
      syncToDisk();
      return true;
    }
  } catch {
    return false;
  }
  return false;
}

export function createUser(name: string, email: string, passwordOrHash: string, avatarUrl?: string): DBUser {
  const isHash = passwordOrHash.startsWith('$2a$') || passwordOrHash.startsWith('$2b$');
  const passwordHash = isHash ? passwordOrHash : hashPassword(passwordOrHash);

  const newUser: DBUser = {
    id: 'user_' + Date.now().toString(36) + Math.random().toString(36).substring(2, 6),
    name: name.trim() || 'Learner',
    email: email.trim().toLowerCase(),
    passwordHash,
    createdAt: new Date().toISOString(),
    coursesCreated: 0,
    avatarUrl: avatarUrl || undefined,
    emailVerified: false,
  };

  memoryCache.users.push(newUser);
  syncToDisk();

  if (pgPool) {
    pgPool.query(
      'INSERT INTO users (id, name, email, password_hash, created_at, courses_created, avatar_url) VALUES ($1, $2, $3, $4, $5, $6, $7) ON CONFLICT (email) DO UPDATE SET password_hash = EXCLUDED.password_hash, name = EXCLUDED.name, avatar_url = COALESCE(EXCLUDED.avatar_url, users.avatar_url)',
      [newUser.id, newUser.name, newUser.email, newUser.passwordHash, newUser.createdAt, newUser.coursesCreated, newUser.avatarUrl || null]
    ).catch(() => {
      pgPool = null;
    });
  }

  return newUser;
}

export function updateUserProfile(userId: string, updates: { name?: string; avatarUrl?: string }): DBUser | undefined {
  const user = memoryCache.users.find(u => u.id === userId);
  if (!user) return undefined;

  if (updates.name && updates.name.trim()) {
    user.name = updates.name.trim();
  }
  if (updates.avatarUrl !== undefined) {
    user.avatarUrl = updates.avatarUrl;
  }
  syncToDisk();

  if (pgPool) {
    pgPool.query(
      'UPDATE users SET name = $1, avatar_url = $2 WHERE id = $3',
      [user.name, user.avatarUrl || null, user.id]
    ).catch(() => {
      pgPool = null;
    });
  }

  return user;
}

export function updateUserPassword(email: string, newPassword: string): boolean {
  const user = memoryCache.users.find(u => u.email.toLowerCase() === email.trim().toLowerCase());
  if (!user) return false;

  const isHash = newPassword.startsWith('$2a$') || newPassword.startsWith('$2b$');
  user.passwordHash = isHash ? newPassword : hashPassword(newPassword);
  syncToDisk();

  if (pgPool) {
    pgPool.query(
      'UPDATE users SET password_hash = $1 WHERE LOWER(email) = LOWER($2)',
      [user.passwordHash, email]
    ).catch(() => {
      pgPool = null;
    });
  }

  return true;
}

// ---------------------------------------------------------------------------
// Cryptographic 6-Digit Email OTP System (Module 1 - C)
// ---------------------------------------------------------------------------

export function requestPasswordResetOTP(email: string): {
  success: boolean;
  otp?: string;
  verificationId?: string;
  cooldownRemaining?: number;
  error?: string;
} {
  const cleanEmail = email.trim().toLowerCase();
  const existing = memoryCache.otps.find(o => o.email.toLowerCase() === cleanEmail);

  // 60-second resend cooldown
  if (existing && existing.lastSentAt) {
    const elapsedSeconds = Math.floor((Date.now() - existing.lastSentAt) / 1000);
    if (elapsedSeconds < 60) {
      return {
        success: false,
        error: `Please wait ${60 - elapsedSeconds} seconds before requesting another code.`,
        cooldownRemaining: 60 - elapsedSeconds,
      };
    }
  }

  // Cryptographically secure 6-digit OTP
  const rawOtp = crypto.randomInt(100000, 1000000).toString();
  // Hash with sha256 + email salt
  const otpHash = crypto.createHash('sha256').update(rawOtp + ':' + cleanEmail).digest('hex');
  const verificationId = 'otp_' + Date.now().toString(36) + crypto.randomBytes(4).toString('hex');
  const expiresAt = Date.now() + 5 * 60 * 1000; // Strictly 5 minutes expiry

  // Invalidate any prior active OTPs for this email
  memoryCache.otps = memoryCache.otps.filter(o => o.email.toLowerCase() !== cleanEmail);
  memoryCache.otps.push({
    verificationId,
    email: cleanEmail,
    otpHash,
    expiresAt,
    attempts: 0,
    lastSentAt: Date.now(),
  });
  syncToDisk();

  return {
    success: true,
    otp: rawOtp,
    verificationId,
  };
}

export function verifyOTPAttempt(email: string, enteredOtp: string): {
  valid: boolean;
  resetToken?: string;
  error?: string;
} {
  const cleanEmail = email.trim().toLowerCase();
  const record = memoryCache.otps.find(o => o.email.toLowerCase() === cleanEmail);

  if (!record) {
    return { valid: false, error: 'No active OTP request found for this email. Please request a new code.' };
  }

  if (record.usedAt) {
    return { valid: false, error: 'This verification code has already been used. Please request a new code.' };
  }

  if (Date.now() > record.expiresAt) {
    return { valid: false, error: 'Verification code has expired (valid for 5 minutes). Please request a new code.' };
  }

  if (record.attempts >= 5) {
    return { valid: false, error: 'Maximum verification attempts (5) exceeded. For security, please request a new code.' };
  }

  const expectedHash = crypto.createHash('sha256').update(enteredOtp.trim() + ':' + cleanEmail).digest('hex');
  if (record.otpHash !== expectedHash) {
    record.attempts += 1;
    syncToDisk();
    const remaining = 5 - record.attempts;
    return {
      valid: false,
      error: `Invalid verification code. ${remaining > 0 ? `${remaining} attempt(s) remaining.` : 'Please request a new code.'}`,
    };
  }

  // Mark verified and generate single-use resetToken
  record.verifiedAt = Date.now();
  const resetToken = 'rst_' + crypto.randomBytes(24).toString('hex');
  record.resetToken = resetToken;
  syncToDisk();

  return { valid: true, resetToken };
}

export function resetPasswordWithVerifiedOTP(
  email: string,
  newPassword: string,
  resetToken?: string,
  otpCode?: string
): { success: boolean; error?: string } {
  const cleanEmail = email.trim().toLowerCase();
  const record = memoryCache.otps.find(o => o.email.toLowerCase() === cleanEmail);

  if (!record) {
    return { success: false, error: 'No OTP verification session found. Please request a new verification code.' };
  }

  if (record.usedAt) {
    return { success: false, error: 'This verification session has already been used.' };
  }

  if (Date.now() > record.expiresAt) {
    return { success: false, error: 'Verification code has expired. Please request a new code.' };
  }

  let isVerified = false;
  if (resetToken && record.resetToken === resetToken) {
    isVerified = true;
  } else if (otpCode) {
    const expectedHash = crypto.createHash('sha256').update(otpCode.trim() + ':' + cleanEmail).digest('hex');
    if (record.otpHash === expectedHash) {
      isVerified = true;
    }
  }

  if (!isVerified) {
    return { success: false, error: 'Invalid or unverified reset session. Please verify your OTP first.' };
  }

  const user = findUserByEmail(cleanEmail);
  if (!user) {
    return { success: false, error: 'User account not found.' };
  }

  user.passwordHash = hashPassword(newPassword);
  record.usedAt = Date.now();
  syncToDisk();

  return { success: true };
}

// Backward compatibility methods for previous OTP calls
export function storeOTP(email: string, otp: string, durationMs: number = 5 * 60 * 1000): void {
  const cleanEmail = email.trim().toLowerCase();
  const otpHash = crypto.createHash('sha256').update(otp.trim() + ':' + cleanEmail).digest('hex');
  memoryCache.otps = memoryCache.otps.filter(o => o.email.toLowerCase() !== cleanEmail);
  memoryCache.otps.push({
    verificationId: 'otp_' + Date.now().toString(36),
    email: cleanEmail,
    otpHash,
    expiresAt: Date.now() + durationMs,
    attempts: 0,
    lastSentAt: Date.now(),
  });
  syncToDisk();
}

export function verifyOTP(email: string, otp: string): boolean {
  const result = verifyOTPAttempt(email, otp);
  return result.valid;
}

// ---------------------------------------------------------------------------
// PDF Documents CRUD & Learning System (Module 3 & 4)
// ---------------------------------------------------------------------------

export function savePDFDocument(doc: PDFDocument): PDFDocument {
  const existingIdx = memoryCache.pdfDocuments.findIndex(p => p.id === doc.id);
  if (existingIdx !== -1) {
    memoryCache.pdfDocuments[existingIdx] = doc;
  } else {
    memoryCache.pdfDocuments.unshift(doc);
  }
  syncToDisk();
  return doc;
}

export function getPDFDocumentsForUser(userId: string): PDFDocument[] {
  if (!userId) return [];
  return memoryCache.pdfDocuments.filter(p => p.userId === userId);
}

export function getPDFDocumentById(id: string): PDFDocument | undefined {
  return memoryCache.pdfDocuments.find(p => p.id === id);
}

export function updatePDFDocument(id: string, updates: Partial<PDFDocument>): PDFDocument | null {
  const idx = memoryCache.pdfDocuments.findIndex(p => p.id === id);
  if (idx === -1) return null;
  const updated: PDFDocument = {
    ...memoryCache.pdfDocuments[idx],
    ...updates,
    updatedAt: new Date().toISOString(),
  };
  memoryCache.pdfDocuments[idx] = updated;
  syncToDisk();
  return updated;
}

export function deletePDFDocument(id: string, userId: string): boolean {
  const initialLen = memoryCache.pdfDocuments.length;
  memoryCache.pdfDocuments = memoryCache.pdfDocuments.filter(
    p => !(p.id === id && p.userId === userId)
  );
  const deleted = memoryCache.pdfDocuments.length < initialLen;
  if (deleted) syncToDisk();
  return deleted;
}

// ---------------------------------------------------------------------------
// Learning Progress Tracking (Module 5)
// ---------------------------------------------------------------------------

export function getLearningProgress(userId: string, targetId: string): LearningProgress | undefined {
  return memoryCache.learningProgress.find(
    lp => lp.userId === userId && (lp.courseId === targetId || lp.documentId === targetId)
  );
}

export function saveLearningProgress(progress: LearningProgress): LearningProgress {
  const idx = memoryCache.learningProgress.findIndex(lp => lp.id === progress.id);
  if (idx !== -1) {
    memoryCache.learningProgress[idx] = progress;
  } else {
    memoryCache.learningProgress.push(progress);
  }
  syncToDisk();
  return progress;
}

// ---------------------------------------------------------------------------
// Student Course Progress & Enrollment Isolation Engine (Requirements 1, 2, 3)
// ---------------------------------------------------------------------------

// 1. Created Courses: Filter strictly by course.userId === authenticated userId
export function getUserCreatedCourses(userId: string): Course[] {
  if (!userId) return [];
  return memoryCache.courses.filter(c => c.userId === userId);
}

// 2. Platform Catalog Courses: Available courses on the platform
export function getPlatformCatalogCourses(): Course[] {
  return memoryCache.courses;
}

// 3. Enrolled Courses: Courses the student is actively enrolled in or studying
export function getUserEnrolledCourses(userId: string): Course[] {
  if (!userId) return [];
  const enrolledCourseIds = new Set(
    memoryCache.enrollments.filter(e => e.userId === userId).map(e => e.courseId)
  );
  // User is enrolled in courses they explicitly enrolled in OR courses they created themselves
  return memoryCache.courses.filter(c => c.userId === userId || enrolledCourseIds.has(c.id));
}

// 4. Enroll user in a course
export function enrollUserInCourse(userId: string, courseId: string): Enrollment {
  const existing = memoryCache.enrollments.find(e => e.userId === userId && e.courseId === courseId);
  if (existing) return existing;
  const newEnrollment: Enrollment = {
    id: `enr_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
    userId,
    courseId,
    enrolledAt: new Date().toISOString(),
    status: 'active',
  };
  memoryCache.enrollments.unshift(newEnrollment);
  syncToDisk();
  return newEnrollment;
}

// 5. Retrieve student's isolated course progress
export function getStudentCourseProgress(userId: string, courseId: string): StudentCourseProgress {
  const existing = memoryCache.studentProgress.find(p => p.userId === userId && p.courseId === courseId);
  const course = getCourseById(courseId);
  const totalChapters = course?.chapters?.length || course?.noOfChapters || 1;

  if (existing) {
    existing.totalChapters = totalChapters;
    if (!existing.completedChapterNumbers) {
      existing.completedChapterNumbers = [];
    }
    return existing;
  }

  const newProgress: StudentCourseProgress = {
    userId,
    courseId,
    courseTitle: course?.title || 'Course',
    totalChapters,
    completedChapterIds: [],
    completedChapterNumbers: [],
    chapterScores: {},
    videosWatched: [],
    progressPercentage: 0,
    finalExamUnlocked: false,
    finalExamPassed: false,
    totalStudyMinutes: 0,
    lastStudiedAt: new Date().toISOString(),
  };
  memoryCache.studentProgress.push(newProgress);
  syncToDisk();
  return newProgress;
}

// 6. Update student's isolated chapter progress
export function updateStudentChapterProgress(
  userId: string,
  courseId: string,
  chapterNumber: number,
  score: number,
  passed: boolean
): StudentCourseProgress {
  const progress = getStudentCourseProgress(userId, courseId);
  const course = getCourseById(courseId);
  const totalChapters = course?.chapters?.length || progress.totalChapters || 1;

  if (passed) {
    if (!progress.completedChapterNumbers.includes(chapterNumber)) {
      progress.completedChapterNumbers.push(chapterNumber);
      progress.completedChapterNumbers.sort((a: number, b: number) => a - b);
    }
    const chObj = course?.chapters?.find(c => c.chapterNumber === chapterNumber);
    if (chObj?.id && !progress.completedChapterIds.includes(chObj.id)) {
      progress.completedChapterIds.push(chObj.id);
    }
  }

  progress.chapterScores[chapterNumber] = Math.max(progress.chapterScores[chapterNumber] || 0, score);
  progress.progressPercentage = Math.round((progress.completedChapterNumbers.length / Math.max(1, totalChapters)) * 100);
  progress.finalExamUnlocked = progress.completedChapterNumbers.length >= totalChapters;
  progress.lastStudiedAt = new Date().toISOString();
  progress.totalStudyMinutes = progress.completedChapterNumbers.length * 25;

  // Check if final exam passed
  const examPassed = memoryCache.finalExamAttempts.some(
    a => a.courseId === courseId && a.userId === userId && a.passed
  );
  progress.finalExamPassed = examPassed;

  // Check if certificate earned
  const cert = memoryCache.certificates.find(c => c.courseId === courseId && c.userId === userId);
  if (cert) {
    progress.certificateEarned = true;
    progress.certificateId = cert.certificateId;
  }

  // Also auto-enroll if not enrolled
  enrollUserInCourse(userId, courseId);

  syncToDisk();
  return progress;
}

// 7. Calculate accurate user dashboard statistics directly from database records
export function getUserDashboardStats(userId: string): {
  totalCreated: number;
  totalEnrolled: number;
  totalCompleted: number;
  totalInProgress: number;
  totalCertificates: number;
} {
  if (!userId) {
    return { totalCreated: 0, totalEnrolled: 0, totalCompleted: 0, totalInProgress: 0, totalCertificates: 0 };
  }
  const created = getUserCreatedCourses(userId);
  const enrolled = getUserEnrolledCourses(userId);
  const userCerts = getUserCertificates(userId);

  let completed = 0;
  let inProgress = 0;

  enrolled.forEach(c => {
    const prog = getStudentCourseProgress(userId, c.id);
    const isCompleted = (prog.completedChapterNumbers.length >= prog.totalChapters && prog.finalExamPassed) ||
      userCerts.some(cert => cert.courseId === c.id);
    if (isCompleted) {
      completed++;
    } else if (prog.completedChapterNumbers.length > 0) {
      inProgress++;
    }
  });

  return {
    totalCreated: created.length,
    totalEnrolled: enrolled.length,
    totalCompleted: completed,
    totalInProgress: inProgress,
    totalCertificates: userCerts.length,
  };
}

// Backward-compatible alias for existing callers: strictly queries user's created courses
export function getCoursesForUser(userId: string, _userEmail?: string): Course[] {
  return getUserCreatedCourses(userId);
}

export function getCourseById(courseId: string): Course | undefined {
  return memoryCache.courses.find(c => c.id === courseId);
}

export function saveNewCourse(course: Course): Course {
  memoryCache.courses.unshift(course);

  // Automatically enroll creator in the course they created
  enrollUserInCourse(course.userId, course.id);

  const user = memoryCache.users.find(u => u.id === course.userId);
  if (user) {
    user.coursesCreated = (user.coursesCreated || 0) + 1;
  }

  syncToDisk();

  // Async persist to Neon PostgreSQL
  if (pgPool) {
    const chapterCount = course.noOfChapters || course.numberOfChapters || 5;
    const authorObj = JSON.stringify({
      name: course.creatorName || 'Instructor',
      email: course.userEmail || '',
    });

    pgPool.query(
      `INSERT INTO courses (
         id, user_id, title, description, category, difficulty, duration,
         no_of_chapters, number_of_chapters,
         include_video, video_included,
         thumbnail_url, thumbnail_prompt, pdf_sources, chapters, progress,
         created_at, creator_name, user_email, author
       ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20)
       ON CONFLICT (id) DO UPDATE SET
         chapters = EXCLUDED.chapters,
         progress = EXCLUDED.progress,
         no_of_chapters = EXCLUDED.no_of_chapters,
         number_of_chapters = EXCLUDED.number_of_chapters,
         updated_at = NOW()`,
      [
        course.id,
        course.userId,
        course.title,
        course.description,
        course.category,
        course.difficulty,
        course.duration,
        chapterCount,
        chapterCount,
        course.includeVideo,
        course.includeVideo,
        course.thumbnailUrl,
        course.thumbnailPrompt,
        course.pdfSources ? JSON.stringify(course.pdfSources) : null,
        JSON.stringify(course.chapters),
        course.progress || 0,
        course.createdAt,
        course.creatorName,
        course.userEmail,
        authorObj,
      ]
    ).catch(() => {
      pgPool = null;
    });
  }

  return course;
}

export function updateCourseInDB(courseId: string, updates: Partial<Course>): Course | null {
  const idx = memoryCache.courses.findIndex(c => c.id === courseId);
  if (idx === -1) return null;

  const updated: Course = {
    ...memoryCache.courses[idx],
    ...updates,
    updatedAt: new Date().toISOString(),
  };
  memoryCache.courses[idx] = updated;
  syncToDisk();

  if (pgPool) {
    pgPool.query(
      `UPDATE courses SET
         chapters = $1,
         progress = $2,
         updated_at = NOW()
       WHERE id = $3`,
      [JSON.stringify(updated.chapters), updated.progress, courseId]
    ).catch(() => {
      pgPool = null;
    });
  }

  return updated;
}

export function deleteCourseFromDB(courseId: string, userId: string): boolean {
  const course = memoryCache.courses.find(c => c.id === courseId);
  if (!course) return false;

  const adminEmail = (process.env.ADMIN_EMAIL || '').trim().toLowerCase();
  const caller = memoryCache.users.find(u => u.id === userId);
  const isCallerAdmin = Boolean(adminEmail && caller?.email && caller.email.trim().toLowerCase() === adminEmail);

  // Strict ownership check: only owner or verified developer admin can delete
  if (course.userId !== userId && !isCallerAdmin) {
    return false;
  }

  // 1. Remove from courses list
  memoryCache.courses = memoryCache.courses.filter(c => c.id !== courseId);

  // 2. Cascade delete all user-owned and associated data for this course
  memoryCache.enrollments = memoryCache.enrollments.filter(e => e.courseId !== courseId);
  memoryCache.studentProgress = memoryCache.studentProgress.filter(p => p.courseId !== courseId);
  memoryCache.finalExamAttempts = memoryCache.finalExamAttempts.filter(a => a.courseId !== courseId);
  memoryCache.certificates = memoryCache.certificates.filter(c => c.courseId !== courseId);
  memoryCache.learningActivities = memoryCache.learningActivities.filter(a => a.courseId !== courseId);
  memoryCache.tutorConversations = memoryCache.tutorConversations.filter(t => t.courseId !== courseId);

  // 3. Decrement owner's coursesCreated count
  const owner = memoryCache.users.find(u => u.id === course.userId);
  if (owner) {
    owner.coursesCreated = Math.max(0, memoryCache.courses.filter(c => c.userId === owner.id).length);
  }

  syncToDisk();

  if (pgPool) {
    pgPool.query('DELETE FROM courses WHERE id = $1', [courseId]).catch(() => {
      pgPool = null;
    });
  }

  return true;
}

// ----------------------------------------------------
// Certificates Data Access (Module 10)
// STRICT ISOLATION: A student sees only their own private certificates
// ----------------------------------------------------
export function getUserCertificates(userId: string): Certificate[] {
  if (!userId) return [];
  return memoryCache.certificates.filter(c => c.userId === userId);
}

export function getCertificateById(certId: string): Certificate | undefined {
  if (!certId) return undefined;
  const clean = certId.trim().toLowerCase();
  return memoryCache.certificates.find(
    c => c.id.toLowerCase() === clean || c.certificateId.toLowerCase() === clean
  );
}

export function saveCertificate(cert: Certificate): Certificate {
  const existingIdx = memoryCache.certificates.findIndex(c => c.id === cert.id || c.certificateId === cert.certificateId);
  if (existingIdx !== -1) {
    memoryCache.certificates[existingIdx] = cert;
  } else {
    memoryCache.certificates.unshift(cert);
  }
  syncToDisk();
  return cert;
}

// ----------------------------------------------------
// AI Tutor Conversations Data Access (Module 8)
// STRICT ISOLATION: A student sees only their own conversations
// ----------------------------------------------------
export function getTutorConversation(userId: string, courseId: string): TutorConversation | undefined {
  if (!userId) return undefined;
  return memoryCache.tutorConversations.find(
    c => c.userId === userId && c.courseId === courseId
  );
}

export function saveTutorConversation(conv: TutorConversation): TutorConversation {
  const existingIdx = memoryCache.tutorConversations.findIndex(
    c => c.userId === conv.userId && c.courseId === conv.courseId
  );
  if (existingIdx !== -1) {
    memoryCache.tutorConversations[existingIdx] = conv;
  } else {
    memoryCache.tutorConversations.unshift(conv);
  }
  syncToDisk();
  return conv;
}

export function deleteTutorConversation(userId: string, courseId: string): boolean {
  const prevLen = memoryCache.tutorConversations.length;
  memoryCache.tutorConversations = memoryCache.tutorConversations.filter(
    c => !(c.userId === userId && c.courseId === courseId)
  );
  const changed = memoryCache.tutorConversations.length < prevLen;
  if (changed) syncToDisk();
  return changed;
}

// ----------------------------------------------------
// Admin & Platform Management Data Access (Module 13)
// ----------------------------------------------------
export function getAllUsers(): DBUser[] {
  return memoryCache.users;
}

export function getAllCourses(): Course[] {
  return memoryCache.courses;
}

export function getAdminTelemetryData() {
  const totalUsers = memoryCache.users.length;
  const totalCourses = memoryCache.courses.length;
  const totalChapters = memoryCache.courses.reduce((acc, c) => acc + (c.chapters?.length || 0), 0);
  const totalCertificates = memoryCache.certificates.length;
  const totalPdfDocuments = memoryCache.pdfDocuments.length;

  // Active vs Completed courses
  let activeCourses = 0;
  let completedCourses = 0;
  memoryCache.courses.forEach(c => {
    const hasCert = memoryCache.certificates.some(cert => cert.courseId === c.id);
    const hasPassedExam = memoryCache.finalExamAttempts.some(a => a.courseId === c.id && a.passed);
    if (hasCert || hasPassedExam || (c.progress && c.progress >= 100)) {
      completedCourses++;
    } else {
      activeCourses++;
    }
  });

  // Recent Activity Log
  const recentActivity: PlatformAdminStats['recentActivity'] = [];

  memoryCache.courses.slice(0, 10).forEach(c => {
    recentActivity.push({
      id: `act-course-${c.id}`,
      type: 'course_created',
      title: `Course Created: ${c.title}`,
      detail: `By ${c.creatorName || c.userEmail || 'User'} · ${c.chapters?.length || c.noOfChapters} chapters`,
      timestamp: c.createdAt,
    });
  });

  memoryCache.certificates.slice(0, 10).forEach(cert => {
    recentActivity.push({
      id: `act-cert-${cert.id}`,
      type: 'certificate_earned',
      title: `Certificate Issued: ${cert.userName}`,
      detail: `For completing "${cert.courseTitle}" with ${cert.score}%`,
      timestamp: cert.issueDate,
    });
  });

  memoryCache.users.slice(0, 10).forEach(u => {
    recentActivity.push({
      id: `act-user-${u.id}`,
      type: 'user_registered',
      title: `User Registered: ${u.name}`,
      detail: `${u.email}`,
      timestamp: u.createdAt,
    });
  });

  recentActivity.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

  // Detailed Users with their courses
  const usersWithCourses = memoryCache.users.map(u => {
    const userCourses = memoryCache.courses.filter(c => c.userId === u.id);
    const userCertificates = memoryCache.certificates.filter(c => c.userId === u.id);
    const userEnrolled = memoryCache.enrollments.filter(e => e.userId === u.id);
    return {
      id: u.id,
      name: u.name,
      email: u.email,
      createdAt: u.createdAt,
      avatarUrl: u.avatarUrl,
      coursesCreated: userCourses.length,
      createdCourses: userCourses.map(c => ({
        id: c.id,
        title: c.title,
        category: c.category,
        difficulty: c.difficulty,
        chaptersCount: c.chapters?.length || c.noOfChapters,
        progress: c.progress || 0,
        createdAt: c.createdAt,
        isCompleted: userCertificates.some(cert => cert.courseId === c.id),
      })),
      enrolledCount: userEnrolled.length,
      certificatesCount: userCertificates.length,
    };
  });

  // Detailed Courses with creator identity
  const allCoursesWithCreator = memoryCache.courses.map(c => {
    const creator = memoryCache.users.find(u => u.id === c.userId);
    const isCompleted = memoryCache.certificates.some(cert => cert.courseId === c.id) ||
      memoryCache.finalExamAttempts.some(a => a.courseId === c.id && a.passed);
    return {
      id: c.id,
      title: c.title,
      description: c.description,
      category: c.category,
      difficulty: c.difficulty,
      userId: c.userId,
      creatorName: creator?.name || c.creatorName || 'AlphaWave Creator',
      creatorEmail: creator?.email || c.userEmail || '',
      createdAt: c.createdAt,
      chaptersCount: c.chapters?.length || c.noOfChapters || 0,
      progress: c.progress || 0,
      isCompleted,
    };
  });

  return {
    stats: {
      totalUsers,
      totalCourses,
      totalChapters,
      totalCertificates,
      totalPdfDocuments,
      activeLearners: Math.max(1, activeCourses),
      activeCourses,
      completedCourses,
      recentActivity: recentActivity.slice(0, 20),
    },
    users: usersWithCourses,
    courses: allCoursesWithCreator,
    recentlyRegisteredUsers: usersWithCourses.slice(0, 10),
    recentlyCreatedCourses: allCoursesWithCreator.slice(0, 10),
  };
}

export function getPlatformStats(): PlatformAdminStats {
  return getAdminTelemetryData().stats;
}

// ---------------------------------------------------------------------------
// LEARNING ACTIVITIES & PROGRESS ENGINE (Requirement 2 & 4)
// ---------------------------------------------------------------------------

export function recordLearningActivity(
  activity: Omit<LearningActivityRecord, 'id' | 'timestamp'>
): LearningActivityRecord {
  const newActivity: LearningActivityRecord = {
    ...activity,
    id: `act_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
    timestamp: new Date().toISOString(),
  };

  memoryCache.learningActivities.unshift(newActivity);
  if (memoryCache.learningActivities.length > 500) {
    memoryCache.learningActivities = memoryCache.learningActivities.slice(0, 500);
  }

  syncToDisk();
  return newActivity;
}

export function getUserActivities(userId: string, limit = 20): LearningActivityRecord[] {
  return memoryCache.learningActivities
    .filter(a => a.userId === userId)
    .slice(0, limit);
}

export function trackVideoWatched(userId: string, courseId: string, chapterNumber: number): boolean {
  const course = getCourseById(courseId);
  if (!course) return false;

  const chapter = course.chapters.find(c => c.chapterNumber === chapterNumber);
  if (!chapter) return false;

  recordLearningActivity({
    userId,
    courseId,
    courseTitle: course.title,
    type: 'video_watched',
    title: `Watched Lecture: ${chapter.title}`,
    detail: `Studied video lecture for Chapter ${chapterNumber} (${chapter.duration || '20 mins'})`,
  });

  return true;
}

// ---------------------------------------------------------------------------
// FINAL COMPREHENSIVE ASSESSMENT GENERATION & EVALUATION (Requirement 4)
// ---------------------------------------------------------------------------

export function generateCourseFinalExamQuestions(courseId: string): FinalExamQuestion[] {
  const course = getCourseById(courseId);
  if (!course) return [];

  const chapters = course.chapters || [];
  const totalChapters = Math.max(1, chapters.length);
  const targetTotal = 15;
  const questions: FinalExamQuestion[] = [];

  // Calculate question allocation per chapter to guarantee exactly 15 questions
  const basePerChapter = Math.floor(targetTotal / totalChapters);
  const remainder = targetTotal % totalChapters;

  chapters.forEach((chapter, index) => {
    const quota = basePerChapter + (index < remainder ? 1 : 0);
    const chNum = chapter.chapterNumber || (index + 1);
    const chTitle = chapter.title || `Chapter ${chNum}`;
    const desc = chapter.description || '';
    const sections = chapter.content?.sections || [];
    const takeaways = chapter.content?.keyTakeaways || [];
    const mcqs = chapter.assessment?.mcqs || [];

    // 1. First pull high-yield questions from chapter's existing MCQs
    mcqs.forEach((mcq, mIdx) => {
      if (questions.filter(q => q.chapterNumber === chNum).length < quota) {
        questions.push({
          id: `fe-${course.id}-ch${chNum}-q${mIdx + 1}`,
          chapterNumber: chNum,
          chapterTitle: chTitle,
          question: mcq.question,
          options: mcq.options.slice(0, 4),
          correctAnswerIndex: mcq.correctAnswerIndex,
          explanation: mcq.explanation || `Correctly tests core understanding of ${chTitle}.`,
          difficulty: mIdx % 3 === 0 ? 'Basic' : mIdx % 3 === 1 ? 'Intermediate' : 'Advanced',
        });
      }
    });

    // 2. Synthesize rigorous academic conceptual questions from sections & takeaways if needed
    let secIdx = 0;
    while (questions.filter(q => q.chapterNumber === chNum).length < quota) {
      const qNum = questions.filter(q => q.chapterNumber === chNum).length + 1;
      const sec = sections[secIdx % Math.max(1, sections.length)];
      const topicName = sec?.title || chTitle;
      const keyRule = takeaways[secIdx % Math.max(1, takeaways.length)] || desc;

      const qId = `fe-${course.id}-ch${chNum}-syn-${qNum}`;
      const diff: 'Basic' | 'Intermediate' | 'Advanced' = qNum === 1 ? 'Basic' : qNum === 2 ? 'Intermediate' : 'Advanced';

      let qText = '';
      let opts: string[] = [];
      let cIdx = 0;
      let exp = '';

      if (course.category.toLowerCase().includes('program') || course.title.toLowerCase().includes('sql') || course.title.toLowerCase().includes('dbms')) {
        if (qNum === 1) {
          qText = `In ${topicName}, what is the primary architectural purpose of enforcing constraints and keys?`;
          opts = [
            'To guarantee data integrity, uniqueness, and prevent anomalous records',
            'To compress table file size on disk storage',
            'To restrict queries to running exclusively on weekends',
            'To eliminate the requirement for primary keys',
          ];
          cIdx = 0;
          exp = 'Keys and constraints enforce referential and entity integrity, preventing invalid or duplicate records.';
        } else if (qNum === 2) {
          qText = `When analyzing ${topicName}, which trade-off must be considered during relational schema design?`;
          opts = [
            'Increasing query complexity vs decreasing database users',
            'Balancing redundancy elimination through normalization against multi-table JOIN performance overhead',
            'Using only text columns vs using only numeric columns',
            'Ignoring foreign key constraints entirely to improve read speed',
          ];
          cIdx = 1;
          exp = 'Normalization removes redundant data and anomalies, but excessive decomposition introduces JOIN overhead that must be balanced.';
        } else {
          qText = `Consider an application utilizing ${chTitle}. What is the recommended strategy when executing irreversible transactional updates?`;
          opts = [
            'Execute directly on production without backup',
            'Verify row counts with an identical SELECT filter before committing UPDATE/DELETE modifications',
            'Remove all WHERE clauses to optimize execution speed',
            'Convert relational tables to unstructured binary files',
          ];
          cIdx = 1;
          exp = 'Running a preview SELECT with the identical WHERE predicate guarantees that only the intended records are updated or deleted.';
        }
      } else if (course.title.toLowerCase().includes('network') || course.title.toLowerCase().includes('osi')) {
        qText = `Regarding ${topicName} in Computer Networks, which layer or protocol mechanism guarantees reliability?`;
        opts = [
          'TCP flow control, sequence numbering, and acknowledgement packets (SYN/ACK)',
          'Physical copper wire shielding alone',
          'Unchecked UDP datagram transmission',
          'MAC address random number generators',
        ];
        cIdx = 0;
        exp = 'TCP implements end-to-end reliability through sequence numbers, acknowledgements, and window-based flow control.';
      } else {
        qText = `Regarding ${chTitle} (${topicName}): Which statement most accurately summarizes the foundational principle taught in this lecture?`;
        opts = [
          `${keyRule.slice(0, 95)}`,
          'Theoretical principles can be ignored in practical implementations without risk',
          'System architecture should default to unstructured, non-standardized formats',
          'Only execute processes without validation or error handling',
        ];
        cIdx = 0;
        exp = `Foundational understanding of ${chTitle} requires adhering to verified structural principles and validated standards.`;
      }

      questions.push({
        id: qId,
        chapterNumber: chNum,
        chapterTitle: chTitle,
        question: qText,
        options: opts,
        correctAnswerIndex: cIdx,
        explanation: exp,
        difficulty: diff,
      });

      secIdx++;
    }
  });

  return questions.slice(0, targetTotal);
}

export function getCourseFinalExamStatus(userId: string, courseId: string): FinalExamStatus {
  const course = getCourseById(courseId);
  const userAttempts = memoryCache.finalExamAttempts.filter(
    a => a.courseId === courseId && a.userId === userId
  );

  const studentProg = getStudentCourseProgress(userId, courseId);
  const totalChapters = course?.chapters?.length || studentProg.totalChapters || 1;
  const completedChaptersCount = studentProg.completedChapterNumbers.length;
  const isUnlocked = completedChaptersCount >= totalChapters;

  const passedAttempt = userAttempts.find(a => a.passed);
  const bestScore = userAttempts.length > 0 ? Math.max(...userAttempts.map(a => a.scorePercentage)) : undefined;
  const latestAttempt = userAttempts.length > 0 ? userAttempts[userAttempts.length - 1] : undefined;

  let lockReason: string | undefined = undefined;
  if (!isUnlocked) {
    const remaining = Math.max(0, totalChapters - completedChaptersCount);
    lockReason = `You must complete all ${totalChapters} lecture chapters and chapter-wise assessments first (${remaining} remaining).`;
  }

  return {
    courseId,
    courseTitle: course?.title || 'Course',
    isUnlocked,
    lockReason,
    completedChaptersCount,
    totalChaptersCount: totalChapters,
    attemptsCount: userAttempts.length,
    bestScore,
    latestScore: latestAttempt?.scorePercentage,
    isPassed: !!passedAttempt,
    latestAttempt,
    attempts: userAttempts,
  };
}

export function submitCourseFinalExam(
  userId: string,
  courseId: string,
  studentAnswers: Record<string, number>,
  durationSeconds: number
): { attempt: FinalExamAttempt; status: FinalExamStatus } {
  const course = getCourseById(courseId);
  if (!course) {
    throw new Error('Course not found.');
  }

  const user = findUserById(userId) || DEFAULT_USER;
  const studentProg = getStudentCourseProgress(userId, courseId);
  const totalChapters = course.chapters?.length || studentProg.totalChapters || 1;
  const completedChaptersCount = studentProg.completedChapterNumbers.length;

  if (completedChaptersCount < totalChapters) {
    throw new Error(`Final Examination is locked. You must complete all ${totalChapters} chapters before taking the final exam.`);
  }

  const questions = generateCourseFinalExamQuestions(courseId);
  const totalQuestions = questions.length; // exactly 15

  let correctCount = 0;
  let incorrectCount = 0;
  let unansweredCount = 0;

  const questionResults: FinalExamQuestionResult[] = [];
  const chapterStats: Record<number, { title: string; total: number; correct: number }> = {};

  questions.forEach(q => {
    if (!chapterStats[q.chapterNumber]) {
      chapterStats[q.chapterNumber] = { title: q.chapterTitle, total: 0, correct: 0 };
    }
    chapterStats[q.chapterNumber].total++;

    const studentChoice = studentAnswers[q.id] !== undefined ? studentAnswers[q.id] : -1;
    const isCorrect = studentChoice === q.correctAnswerIndex;

    if (studentChoice === -1) {
      unansweredCount++;
    } else if (isCorrect) {
      correctCount++;
      chapterStats[q.chapterNumber].correct++;
    } else {
      incorrectCount++;
    }

    questionResults.push({
      questionId: q.id,
      chapterNumber: q.chapterNumber,
      chapterTitle: q.chapterTitle,
      questionText: q.question,
      options: q.options,
      selectedOptionIndex: studentChoice,
      correctOptionIndex: q.correctAnswerIndex,
      isCorrect,
      explanation: q.explanation,
      difficulty: q.difficulty,
    });
  });

  const scorePercentage = Math.round((correctCount / Math.max(1, totalQuestions)) * 100);
  const passingThreshold = 70; // 70% passing threshold
  const passed = scorePercentage >= passingThreshold;

  const chapterBreakdown = Object.entries(chapterStats).map(([chNum, stat]) => {
    const chScore = Math.round((stat.correct / Math.max(1, stat.total)) * 100);
    return {
      chapterNumber: parseInt(chNum, 10),
      chapterTitle: stat.title,
      totalQuestions: stat.total,
      correctQuestions: stat.correct,
      scorePercentage: chScore,
      needsRevision: chScore < passingThreshold,
    };
  });

  const weakChapters = chapterBreakdown.filter(c => c.needsRevision);
  const recommendedRevisionTopics = weakChapters.map(
    c => `Chapter ${c.chapterNumber}: ${c.chapterTitle} (${c.scorePercentage}% score - review notes and re-attempt chapter quiz)`
  );

  const previousAttempts = memoryCache.finalExamAttempts.filter(
    a => a.courseId === courseId && a.userId === userId
  );

  const attemptId = `attempt_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
  const newAttempt: FinalExamAttempt = {
    attemptId,
    attemptNumber: previousAttempts.length + 1,
    courseId,
    courseTitle: course.title,
    userId,
    studentName: user.name || 'AlphaWave Student',
    startedAt: new Date(Date.now() - durationSeconds * 1000).toISOString(),
    submittedAt: new Date().toISOString(),
    durationSeconds,
    totalQuestions,
    correctAnswers: correctCount,
    incorrectAnswers: incorrectCount,
    unanswered: unansweredCount,
    scorePercentage,
    passingThreshold,
    passed,
    answers: studentAnswers,
    questionResults,
    chapterBreakdown,
    recommendedRevisionTopics,
  };

  memoryCache.finalExamAttempts.push(newAttempt);

  // Record Learning Activity and Update Isolated Student Progress
  if (passed) {
    studentProg.finalExamPassed = true;
    studentProg.finalExamBestScore = Math.max(studentProg.finalExamBestScore || 0, scorePercentage);
    studentProg.progressPercentage = 100;

    recordLearningActivity({
      userId,
      courseId,
      courseTitle: course.title,
      type: 'final_exam_passed',
      title: `Passed Final Examination: ${course.title}`,
      detail: `Achieved ${scorePercentage}% score (Passing: 70%). Course successfully completed and Certificate unlocked!`,
      score: scorePercentage,
    });
  } else {
    recordLearningActivity({
      userId,
      courseId,
      courseTitle: course.title,
      type: 'final_exam_failed',
      title: `Attempted Final Examination: ${course.title}`,
      detail: `Scored ${scorePercentage}% (${passingThreshold}% required). ${weakChapters.length} chapters recommended for revision before retake.`,
      score: scorePercentage,
    });
  }

  syncToDisk();

  return {
    attempt: newAttempt,
    status: getCourseFinalExamStatus(userId, courseId),
  };
}

export function updateChapterAssessment(
  courseId: string,
  chapterNumber: number,
  userId: string,
  score: number,
  passed: boolean
): { course: Course; isComplete: boolean; studentProgress: StudentCourseProgress } {
  const course = getCourseById(courseId);
  if (!course) {
    throw new Error('Course not found.');
  }

  // Update student's isolated progress
  const updatedProgress = updateStudentChapterProgress(userId, courseId, chapterNumber, score, passed);

  if (passed) {
    recordLearningActivity({
      userId,
      courseId,
      courseTitle: course.title,
      type: 'quiz_passed',
      title: `Passed Quiz: Chapter ${chapterNumber}`,
      detail: `Scored ${score}% on Chapter ${chapterNumber} assessment`,
      score,
    });
  }

  const isComplete = updatedProgress.completedChapterNumbers.length >= (course.chapters?.length || 1);

  return {
    course,
    isComplete,
    studentProgress: updatedProgress,
  };
}

export function getAccurateUserProgressSummary(userId: string): UserProgressSummary & {
  recentActivities: LearningActivityRecord[];
  finalExamStats: { totalPassedExams: number; totalAttempts: number };
} {
  const enrolledCourses = getUserEnrolledCourses(userId);
  const totalCourses = enrolledCourses.length;

  let completedCourses = 0;
  let inProgressCourses = 0;
  let totalChapters = 0;
  let completedChapters = 0;
  let totalScoreSum = 0;
  let totalScoreCount = 0;
  let totalMinutes = 0;

  enrolledCourses.forEach(c => {
    const prog = getStudentCourseProgress(userId, c.id);
    const chsCount = c.chapters?.length || prog.totalChapters || 1;
    totalChapters += chsCount;
    const completedChs = prog.completedChapterNumbers.length;
    completedChapters += completedChs;

    if (completedChs >= chsCount && prog.finalExamPassed) {
      completedCourses++;
    } else if (completedChs > 0) {
      inProgressCourses++;
    }

    // Accumulate scores from student's actual chapter assessment scores
    Object.values(prog.chapterScores).forEach(sc => {
      totalScoreSum += sc;
      totalScoreCount++;
    });

    totalMinutes += prog.totalStudyMinutes || (completedChs * 25);
  });

  // Include final exam scores in score average
  const userExamAttempts = memoryCache.finalExamAttempts.filter(a => a.userId === userId);
  userExamAttempts.forEach(a => {
    totalScoreSum += a.scorePercentage;
    totalScoreCount++;
    totalMinutes += Math.round(a.durationSeconds / 60);
  });

  const overallScoreAverage = totalScoreCount > 0 ? Math.round(totalScoreSum / totalScoreCount) : 0;

  // Calculate real activity counts for the last 7 calendar days
  const today = new Date();
  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const weeklyActivity: Array<{ day: string; minutes: number; chapters: number }> = [];

  for (let i = 6; i >= 0; i--) {
    const targetDate = new Date();
    targetDate.setDate(today.getDate() - i);
    const dateStr = targetDate.toISOString().split('T')[0];
    const dayName = dayNames[targetDate.getDay()];

    const daysActivities = memoryCache.learningActivities.filter(
      a => a.userId === userId && a.timestamp.startsWith(dateStr)
    );

    const chaptersCompleted = daysActivities.filter(a => a.type === 'quiz_passed' || a.type === 'chapter_completed').length;
    const minutesSpent = chaptersCompleted * 25 + daysActivities.filter(a => a.type === 'video_watched').length * 20;

    weeklyActivity.push({
      day: dayName,
      minutes: Math.max(daysActivities.length > 0 ? 15 : 0, minutesSpent),
      chapters: chaptersCompleted,
    });
  }

  // Calculate active streak based on consecutive active days
  const userActivities = getUserActivities(userId, 50);
  let streakDays = 0;
  if (userActivities.length > 0) {
    const activeDates = new Set(userActivities.map(a => a.timestamp.split('T')[0]));
    const todayStr = new Date().toISOString().split('T')[0];
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = yesterday.toISOString().split('T')[0];

    // User has an active streak if they studied today or yesterday
    if (activeDates.has(todayStr) || activeDates.has(yesterdayStr)) {
      let checkDate = activeDates.has(todayStr) ? new Date() : yesterday;
      while (activeDates.has(checkDate.toISOString().split('T')[0])) {
        streakDays++;
        checkDate.setDate(checkDate.getDate() - 1);
      }
    }
  }

  return {
    totalCourses,
    completedCourses,
    inProgressCourses,
    totalChapters,
    completedChapters,
    totalLearningMinutes: totalMinutes,
    overallScoreAverage,
    totalQuizzesAttempted: totalScoreCount,
    currentStreakDays: streakDays,
    streakDays,
    weeklyActivity,
    recentActivities: userActivities.slice(0, 10),
    finalExamStats: {
      totalPassedExams: userExamAttempts.filter(a => a.passed).length,
      totalAttempts: userExamAttempts.length,
    },
  };
}

