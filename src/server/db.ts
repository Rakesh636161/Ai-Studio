import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import bcrypt from 'bcryptjs';
import { Pool } from 'pg';
import { Course, CourseChapter, User, PDFDocument, LearningProgress, Certificate, TutorConversation, PlatformAdminStats } from '../types';

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

interface DBData {
  users: DBUser[];
  courses: Course[];
  otps: OTPRecord[];
  pdfDocuments: PDFDocument[];
  learningProgress: LearningProgress[];
  certificates: Certificate[];
  tutorConversations: TutorConversation[];
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
  coursesCreated: 3,
};

const INITIAL_COURSES: Course[] = [
  {
    id: 'course-sql-101',
    userId: 'user_default_1',
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
  otps: [],
  pdfDocuments: [],
  learningProgress: [],
  certificates: [
    {
      id: 'cert_sql_mastery_demo',
      certificateId: 'CERT-AW-1794-DEMO1',
      userId: 'user_default_1',
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
      if (parsed.users && parsed.users.length > 0) {
        memoryCache.users = parsed.users;
      }
      if (parsed.courses && parsed.courses.length > 0) {
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
  return memoryCache.pdfDocuments.filter(p => p.userId === userId || userId === 'user_default_1');
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
    p => !(p.id === id && (p.userId === userId || userId === 'user_default_1'))
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

// Course Methods - Strictly isolate user courses so new accounts don't see other users' private courses
export function getCoursesForUser(userId: string, userEmail?: string): Course[] {
  if (!userId) return [];
  const normalizedEmail = (userEmail || '').trim().toLowerCase();
  return memoryCache.courses.filter(c => {
    if (c.userId === userId) return true;
    if (normalizedEmail && c.userEmail && c.userEmail.trim().toLowerCase() === normalizedEmail) return true;
    return false;
  });
}

export function getCourseById(courseId: string): Course | undefined {
  return memoryCache.courses.find(c => c.id === courseId);
}

export function saveNewCourse(course: Course): Course {
  memoryCache.courses.unshift(course);

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
  const initialLen = memoryCache.courses.length;
  memoryCache.courses = memoryCache.courses.filter(
    c => !(c.id === courseId && (c.userId === userId || userId === 'user_default_1'))
  );
  const deleted = memoryCache.courses.length < initialLen;
  if (deleted) {
    syncToDisk();
    if (pgPool) {
      pgPool.query('DELETE FROM courses WHERE id = $1', [courseId])
        .catch(() => {
          pgPool = null;
        });
    }
  }
  return deleted;
}

// ----------------------------------------------------
// Certificates Data Access (Module 10)
// ----------------------------------------------------
export function getUserCertificates(userId: string): Certificate[] {
  return memoryCache.certificates.filter(c => c.userId === userId || userId === 'user_default_1');
}

export function getCertificateById(certId: string): Certificate | undefined {
  return memoryCache.certificates.find(
    c => c.id === certId || c.certificateId.toLowerCase() === certId.toLowerCase()
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
// ----------------------------------------------------
export function getTutorConversation(userId: string, courseId: string): TutorConversation | undefined {
  return memoryCache.tutorConversations.find(
    c => (c.userId === userId || userId === 'user_default_1') && c.courseId === courseId
  );
}

export function saveTutorConversation(conv: TutorConversation): TutorConversation {
  const existingIdx = memoryCache.tutorConversations.findIndex(
    c => (c.userId === conv.userId || conv.userId === 'user_default_1') && c.courseId === conv.courseId
  );
  if (existingIdx !== -1) {
    memoryCache.tutorConversations[existingIdx] = conv;
  } else {
    memoryCache.tutorConversations.unshift(conv);
  }
  syncToDisk();
  return conv;
}

// ----------------------------------------------------
// Admin & Platform Management Data Access (Module 13)
// ----------------------------------------------------
export function getAllUsers(): DBUser[] {
  return memoryCache.users;
}

export function getPlatformStats(): PlatformAdminStats {
  const totalUsers = memoryCache.users.length;
  const totalCourses = memoryCache.courses.length;
  const totalChapters = memoryCache.courses.reduce((acc, c) => acc + (c.chapters?.length || 0), 0);
  const totalCertificates = memoryCache.certificates.length;
  const totalPdfDocuments = memoryCache.pdfDocuments.length;
  const activeLearners = memoryCache.courses.filter(c => (c.progress || 0) > 0).length;

  const recentActivity: PlatformAdminStats['recentActivity'] = [];

  // Recent courses
  memoryCache.courses.slice(0, 5).forEach(c => {
    recentActivity.push({
      id: `act-course-${c.id}`,
      type: 'course_created',
      title: `Course Created: ${c.title}`,
      detail: `${c.noOfChapters || c.chapters.length} chapters · Level: ${c.difficulty}`,
      timestamp: c.createdAt,
    });
  });

  // Recent certificates
  memoryCache.certificates.slice(0, 5).forEach(cert => {
    recentActivity.push({
      id: `act-cert-${cert.id}`,
      type: 'certificate_earned',
      title: `Certificate Issued: ${cert.userName}`,
      detail: `Earned for completing "${cert.courseTitle}" with ${cert.score}%`,
      timestamp: cert.issueDate,
    });
  });

  // Recent PDFs
  memoryCache.pdfDocuments.slice(0, 5).forEach(doc => {
    recentActivity.push({
      id: `act-pdf-${doc.id}`,
      type: 'pdf_uploaded',
      title: `PDF Processed: ${doc.fileName}`,
      detail: `${doc.mainTopics?.length || 0} topics extracted · Status: ${doc.processingStatus}`,
      timestamp: doc.createdAt,
    });
  });

  // Sort activity by date descending
  recentActivity.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

  return {
    totalUsers,
    totalCourses,
    totalChapters,
    totalCertificates,
    totalPdfDocuments,
    activeLearners,
    recentActivity: recentActivity.slice(0, 15),
  };
}

