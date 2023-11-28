const express = require('express');
const { Pool } = require('pg');
const app = express();
const cors = require('cors');
const port = 3000;
const os = require('os');
require('dotenv').config({ path: './dev.env' });

app.use(express.json());

const pool = new Pool({
    user: process.env.PGUSER,
    host: process.env.PGHOST,
    database: process.env.PGDATABASE,
    password: process.env.PGPASSWORD,
    port: process.env.PGPORT,
});
const corsOptions = {
    origin: ['http://localhost:4200','https://souravkore.github.io/TaskManagement'],
    methods: 'GET,POST,PUT,DELETE',
    allowedHeaders: 'Content-Type,Authorization',
};

app.use(cors(corsOptions));

app.get('/username', (req, res) => {
    // Access the current user's username using the os module
    const username = os.userInfo().username;
    res.json({ username });
});

// Create an item
app.post('/items', async (req, res) => {
    const { name, description, id, CreatedBy, username } = req.body;
    const client = await pool.connect();
    const current_date = new Date();

    try {
        const result = await client.query(
            'INSERT INTO items (id, name, description, createdby, createddate) VALUES ($1, $2, $3, $4, current_date) RETURNING *',
            [id, name, description, username]
        );

        res.json(result.rows[0]);
    } catch (error) {
        console.error('Error inserting item: ', error);
        res.status(500).json({ error: 'Internal Server Error' });
    } finally {
        client.release();
    }
});

// Retrieve all items
app.get('/items/:username', async (req, res) => {
    const { username } = req.params;
    const client = await pool.connect();

    try {
        const result = await client.query('SELECT * FROM items WHERE Createdby = $1 ORDER BY id ASC', [username]);
        res.json(result.rows);
    } catch (error) {
        console.error('Error fetching items: ', error);
        res.status(500).json({ error: 'Internal Server Error' });
    } finally {
        client.release();
    }
});

// Retrieve a single item by ID
app.get('/itemsForId/:id', async (req, res) => {
    const { id } = req.params;
    const client = await pool.connect();

    try {
        const result = await client.query('SELECT * FROM items WHERE id = $1', [id]);

        if (result.rows.length === 0) {
            res.status(404).json({ error: 'Item not found' });
        } else {
            res.json(result.rows[0]);
        }
    } catch (error) {
        console.error('Error fetching item: ', error);
        res.status(500).json({ error: 'Internal Server Error' });
    } finally {
        client.release();
    }
});

// Update an item by ID
app.put('/items/:id', async (req, res) => {
    const { id } = req.params;
    const { name, description } = req.body;
    const client = await pool.connect();

    try {
        const result = await client.query(
            'UPDATE items SET name = $1, description = $2 WHERE id = $3 RETURNING *',
            [name, description, id]
        );

        if (result.rows.length === 0) {
            res.status(404).json({ error: 'Item not found' });
        } else {
            res.json(result.rows[0]);
        }
    } catch (error) {
        console.error('Error updating item: ', error);
        res.status(500).json({ error: 'Internal Server Error' });
    } finally {
        client.release();
    }
});

// Delete an item by ID
app.delete('/items/:id', async (req, res) => {
    const { id } = req.params;
    const client = await pool.connect();

    try {
        const result = await client.query('DELETE FROM items WHERE id = $1 RETURNING *', [id]);

        if (result.rows.length === 0) {
            res.status(404).json({ error: 'Item not found' });
        } else {
            res.json({ message: 'Item deleted successfully' });
        }
    } catch (error) {
        console.error('Error deleting item: ', error);
        res.status(500).json({ error: 'Internal Server Error' });
    } finally {
        client.release();
    }
});

app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
});
