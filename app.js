// Import necessary modules
const express = require('express');
const mysql = require('mysql2/promise');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config();

const app = express();
const port = process.env.PORT || 3000;

// Set view engine and views directory
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// Database configuration from .env file
const dbConfig = {
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
};

const DEFAULT_LIMIT = parseInt(process.env.DEFAULT_LIMIT, 10) || 100;

/**
 * Fetch null distribution for a given table.
 * @param {string} table - Table name.
 * @param {number} limit - Number of rows to fetch.
 * @returns {Object} - Null distribution result.
 */
async function getNullDistribution(table, limit)
{
    let connection;
    try
    {
        // Create a database connection
        connection = await mysql.createConnection(dbConfig);

        // Fetch the primary key column
        const [primaryKeyResult] = await connection.query(
            `SHOW KEYS FROM \`${table}\` WHERE Key_name = 'PRIMARY'`
        );
        if (!primaryKeyResult.length)
        {
            throw new Error(`No primary key found for table '${table}'.`);
        }
        const primaryKey = primaryKeyResult[0].Column_name;

        // Fetch data from the table
        const [rows] = await connection.query(
            `SELECT * FROM \`${table}\` ORDER BY \`${primaryKey}\` DESC LIMIT ?`,
            [limit]
        );

        if (!rows.length)
        {
            throw new Error(`No data found for table '${table}'.`);
        }

        // Analyze null distribution
        const nullDistribution = {};
        const totalRows = rows.length;

        // Iterate over all columns
        const columns = Object.keys(rows[0]);
        for (const column of columns)
        {
            let nullRows = 0;
            for (const row of rows)
            {
                if (row[column] === null)
                {
                    nullRows++;
                }
            }
            nullDistribution[column] = {
                total_rows: totalRows,
                null_rows: nullRows,
                not_null_rows: totalRows - nullRows,
            };
        }

        // Sort by null_rows in descending order
        const sortedDistribution = Object.entries(nullDistribution)
            .sort(([, a], [, b]) => b.null_rows - a.null_rows)
            .reduce((acc, [key, value]) =>
            {
                acc[key] = value;
                return acc;
            }, {});

        return { table, limit, null_distribution: sortedDistribution };
    } catch (error)
    {
        console.error('Error:', error);
        throw error;
    } finally
    {
        if (connection) await connection.end();
    }
}

// API endpoint for JSON response
app.get('/table-null-distribution', async (req, res) =>
{
    const { table, limit } = req.query;
    const fetchLimit = limit ? parseInt(limit, 10) : DEFAULT_LIMIT;

    if (!table)
    {
        return res.status(400).json({ error: 'Please provide a valid table name.' });
    }

    try
    {
        const result = await getNullDistribution(table, fetchLimit);
        res.json(result);
    } catch (error)
    {
        res.status(500).json({ error: error.message });
    }
});

// API endpoint for HTML response
app.get('/table-null-distribution-html', async (req, res) =>
{
    const { table, limit } = req.query;
    const fetchLimit = limit ? parseInt(limit, 10) : DEFAULT_LIMIT;

    if (!table)
    {
        return res.status(400).send('<h1>Please provide a valid table name.</h1>');
    }

    try
    {
        const result = await getNullDistribution(table, fetchLimit);
        const { null_distribution: nullDistribution } = result;

        res.render('nullDistribution', { table, nullDistribution });
    } catch (error)
    {
        res.status(500).send(`<h1>Error: ${error.message}</h1>`);
    }
});

// Start the server
app.listen(port, () =>
{
    console.log(`Server is running on http://localhost:${port}`);
});
