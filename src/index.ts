import express, { Request, Response } from "express";
import { createClient } from "@libsql/client";
import dotenv from "dotenv";
import cors from "cors";

dotenv.config();

const app = express();
app.use(cors()); // Use CORS middleware
app.use(express.json());

const client = createClient({
  url: process.env.TURSO_DATABASE_URL as string,
  authToken: process.env.TURSO_AUTH_TOKEN as string,
});

// Initialize the table
client.execute(`
  CREATE TABLE IF NOT EXISTS complaints (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    email TEXT,
    complaint TEXT NOT NULL
  );
`);

// Create a new complaint
app.post("/complaints", async (req: Request, res: Response) => {
  const { email, complaint } = req.body;
  try {
    await client.execute({
      sql: "INSERT INTO complaints (email, complaint) VALUES (?, ?)",
      args: [email, complaint],
    });
    res.status(201).send("Complaint created");
  } catch (error) {
    res.status(500).send("Error creating complaint");
  }
});

// Read all complaints
app.get("/complaints", async (req: Request, res: Response) => {
  try {
    const result = await client.execute("SELECT * FROM complaints");
    res.status(200).json(result.rows);
  } catch (error) {
    res.status(500).send("Error retrieving complaints");
  }
});

// Read a single complaint by ID
app.get("/complaints/:id", async (req: Request, res: Response) => {
  const { id } = req.params;
  try {
    const result = await client.execute({
      sql: "SELECT * FROM complaints WHERE id = ?",
      args: [id],
    });
    res.status(200).json(result.rows[0]);
  } catch (error) {
    res.status(500).send("Error retrieving complaint");
  }
});

// Update a complaint
app.put("/complaints/:id", async (req: Request, res: Response) => {
  const { id } = req.params;
  const { email, complaint } = req.body;
  try {
    await client.execute({
      sql: "UPDATE complaints SET email = ?, complaint = ? WHERE id = ?",
      args: [email, complaint, id],
    });
    res.status(200).send("Complaint updated");
  } catch (error) {
    res.status(500).send("Error updating complaint");
  }
});

// Delete a complaint
app.delete("/complaints/:id", async (req: Request, res: Response) => {
  const { id } = req.params;
  try {
    await client.execute({
      sql: "DELETE FROM complaints WHERE id = ?",
      args: [id],
    });
    res.status(200).send("Complaint deleted");
  } catch (error) {
    res.status(500).send("Error deleting complaint");
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
