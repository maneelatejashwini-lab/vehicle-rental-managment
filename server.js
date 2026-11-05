require("dotenv").config();
const express = require("express");
const path = require("path");
const mysql = require("mysql2/promise");

const app = express();
const PORT = Number(process.env.PORT) || 3000;

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, "public")));

const pool = mysql.createPool({
  host: process.env.DB_HOST || "localhost",
  user: process.env.DB_USER || "root",
  password: process.env.DB_PASSWORD || "Teja@123",
  database: process.env.DB_NAME || "vehicle_rental_db",
  waitForConnections: true,
  connectionLimit: 10,
  dateStrings: true
});

app.get("/api/health", async (req, res) => {
  try {
    await pool.query("SELECT 1");
    res.json({ ok: true, message: "Server and database connection are working." });
  } catch (err) {
    res.status(500).json({ ok: false, message: "Database connection failed. Check your .env settings.", detail: err.message });
  }
});

// Dashboard counts
app.get("/api/dashboard", async (req, res) => {
  try {
    const [[vehicleCounts]] = await pool.query(`
      SELECT COUNT(*) AS total,
      SUM(status = 'Available') AS available,
      SUM(status = 'Not Available') AS unavailable
      FROM vehicles
    `);
    const [[rentalCounts]] = await pool.query(`
      SELECT COUNT(*) AS totalRentals,
      SUM(rental_status IN ('Booked','Active')) AS ongoing
      FROM rentals
    `);
    const [recent] = await pool.query(`
      SELECT r.rental_id, c.customer_name, v.vehicle_model, r.start_date, r.end_date,
             r.total_amount, r.rental_status
      FROM rentals r
      JOIN customers c ON c.customer_id = r.customer_id
      JOIN vehicles v ON v.vehicle_id = r.vehicle_id
      ORDER BY r.created_at DESC LIMIT 5
    `);
    res.json({ ...vehicleCounts, ...rentalCounts, recent });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Vehicles: list/search/filter
app.get("/api/vehicles", async (req, res) => {
  try {
    const { search = "", type = "", status = "" } = req.query;
    let sql = `SELECT * FROM vehicles WHERE 1=1`;
    const params = [];
    if (search.trim()) {
      sql += ` AND (CAST(vehicle_id AS CHAR) LIKE ? OR vehicle_number LIKE ? OR vehicle_type LIKE ? OR vehicle_model LIKE ?)`;
      const s = `%${search.trim()}%`;
      params.push(s, s, s, s);
    }
    if (type) { sql += " AND vehicle_type = ?"; params.push(type); }
    if (status) { sql += " AND status = ?"; params.push(status); }
    sql += " ORDER BY vehicle_id DESC";
    const [rows] = await pool.query(sql, params);
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post("/api/vehicles", async (req, res) => {
  try {
    const { vehicle_number, vehicle_type, vehicle_model, rent_per_day, status = "Available" } = req.body;
    if (!vehicle_number || !vehicle_type || !vehicle_model || rent_per_day === undefined || Number(rent_per_day) < 0) {
      return res.status(400).json({ error: "Please fill all required vehicle fields with a valid daily rent." });
    }
    const [result] = await pool.query(
      `INSERT INTO vehicles (vehicle_number, vehicle_type, vehicle_model, rent_per_day, status) VALUES (?, ?, ?, ?, ?)`,
      [vehicle_number.trim(), vehicle_type, vehicle_model.trim(), Number(rent_per_day), status]
    );
    res.status(201).json({ message: "Vehicle added successfully.", vehicle_id: result.insertId });
  } catch (err) {
    res.status(err.code === "ER_DUP_ENTRY" ? 409 : 500).json({ error: err.code === "ER_DUP_ENTRY" ? "That vehicle number already exists." : err.message });
  }
});

app.put("/api/vehicles/:id", async (req, res) => {
  try {
    const id = Number(req.params.id);
    const { vehicle_number, vehicle_type, vehicle_model, rent_per_day, status } = req.body;
    if (!vehicle_number || !vehicle_type || !vehicle_model || rent_per_day === undefined || !["Available", "Not Available"].includes(status)) {
      return res.status(400).json({ error: "Please provide all vehicle fields." });
    }
    const [result] = await pool.query(
      `UPDATE vehicles SET vehicle_number=?, vehicle_type=?, vehicle_model=?, rent_per_day=?, status=? WHERE vehicle_id=?`,
      [vehicle_number.trim(), vehicle_type, vehicle_model.trim(), Number(rent_per_day), status, id]
    );
    if (!result.affectedRows) return res.status(404).json({ error: "Vehicle not found." });
    res.json({ message: "Vehicle updated successfully." });
  } catch (err) {
    res.status(err.code === "ER_DUP_ENTRY" ? 409 : 500).json({ error: err.code === "ER_DUP_ENTRY" ? "That vehicle number already exists." : err.message });
  }
});

app.delete("/api/vehicles/:id", async (req, res) => {
  try {
    const [result] = await pool.query("DELETE FROM vehicles WHERE vehicle_id=?", [Number(req.params.id)]);
    if (!result.affectedRows) return res.status(404).json({ error: "Vehicle not found." });
    res.json({ message: "Vehicle deleted successfully." });
  } catch (err) {
    res.status(err.code === "ER_ROW_IS_REFERENCED_2" ? 409 : 500).json({
      error: err.code === "ER_ROW_IS_REFERENCED_2" ? "This vehicle has rental records. Cancel or retain its records instead of deleting it." : err.message
    });
  }
});

// Customers
app.get("/api/customers", async (req, res) => {
  try {
    const [rows] = await pool.query("SELECT * FROM customers ORDER BY customer_id DESC");
    res.json(rows);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.post("/api/customers", async (req, res) => {
  try {
    const { customer_name, phone, email = "", license_number } = req.body;
    if (!customer_name || !phone || !license_number) return res.status(400).json({ error: "Name, phone and license number are required." });
    const [result] = await pool.query(
      "INSERT INTO customers (customer_name, phone, email, license_number) VALUES (?, ?, ?, ?)",
      [customer_name.trim(), phone.trim(), email.trim() || null, license_number.trim()]
    );
    res.status(201).json({ message: "Customer saved.", customer_id: result.insertId });
  } catch (err) {
    res.status(err.code === "ER_DUP_ENTRY" ? 409 : 500).json({ error: err.code === "ER_DUP_ENTRY" ? "That license number already exists." : err.message });
  }
});

// Rentals / bookings
app.get("/api/rentals", async (req, res) => {
  try {
    const [rows] = await pool.query(`
      SELECT r.*, c.customer_name, c.phone, v.vehicle_number, v.vehicle_type, v.vehicle_model
      FROM rentals r
      JOIN customers c ON c.customer_id = r.customer_id
      JOIN vehicles v ON v.vehicle_id = r.vehicle_id
      ORDER BY r.created_at DESC
    `);
    res.json(rows);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.post("/api/rentals", async (req, res) => {
  const connection = await pool.getConnection();
  try {
    const { vehicle_id, customer_name, phone, email = "", license_number, start_date, end_date } = req.body;
    if (!vehicle_id || !customer_name || !phone || !license_number || !start_date || !end_date) {
      return res.status(400).json({ error: "Please complete all required booking fields." });
    }
    if (end_date < start_date) return res.status(400).json({ error: "Return date must be on or after pickup date." });

    await connection.beginTransaction();
    const [vehicles] = await connection.query("SELECT * FROM vehicles WHERE vehicle_id=? FOR UPDATE", [Number(vehicle_id)]);
    if (!vehicles.length) {
      await connection.rollback();
      return res.status(404).json({ error: "Selected vehicle was not found." });
    }
    const vehicle = vehicles[0];
    if (vehicle.status !== "Available") {
      await connection.rollback();
      return res.status(409).json({ error: "This vehicle is marked unavailable. Choose another vehicle." });
    }

    // Prevent overlapping dates for the same vehicle (inclusive dates).
    const [overlaps] = await connection.query(`
      SELECT rental_id FROM rentals
      WHERE vehicle_id = ? AND rental_status IN ('Booked','Active')
      AND NOT (end_date < ? OR start_date > ?)
      LIMIT 1
    `, [Number(vehicle_id), start_date, end_date]);
    if (overlaps.length) {
      await connection.rollback();
      return res.status(409).json({ error: "This vehicle already has a booking that overlaps those dates." });
    }

    let customerId;
    const [existing] = await connection.query("SELECT customer_id FROM customers WHERE license_number=?", [license_number.trim()]);
    if (existing.length) {
      customerId = existing[0].customer_id;
      await connection.query(
        "UPDATE customers SET customer_name=?, phone=?, email=? WHERE customer_id=?",
        [customer_name.trim(), phone.trim(), email.trim() || null, customerId]
      );
    } else {
      const [customerResult] = await connection.query(
        "INSERT INTO customers (customer_name, phone, email, license_number) VALUES (?, ?, ?, ?)",
        [customer_name.trim(), phone.trim(), email.trim() || null, license_number.trim()]
      );
      customerId = customerResult.insertId;
    }

    const start = new Date(`${start_date}T00:00:00`);
    const end = new Date(`${end_date}T00:00:00`);
    const days = Math.floor((end - start) / 86400000) + 1;
    const total = days * Number(vehicle.rent_per_day);
    const [rentalResult] = await connection.query(`
      INSERT INTO rentals (vehicle_id, customer_id, start_date, end_date, total_amount, rental_status)
      VALUES (?, ?, ?, ?, ?, 'Booked')
    `, [Number(vehicle_id), customerId, start_date, end_date, total.toFixed(2)]);
    await connection.commit();
    res.status(201).json({ message: "Booking created successfully.", rental_id: rentalResult.insertId, days, total_amount: total });
  } catch (err) {
    await connection.rollback();
    res.status(500).json({ error: err.message });
  } finally {
    connection.release();
  }
});

app.patch("/api/rentals/:id/status", async (req, res) => {
  try {
    const { rental_status } = req.body;
    if (!["Booked", "Active", "Completed", "Cancelled"].includes(rental_status)) {
      return res.status(400).json({ error: "Invalid rental status." });
    }
    const [result] = await pool.query("UPDATE rentals SET rental_status=? WHERE rental_id=?", [rental_status, Number(req.params.id)]);
    if (!result.affectedRows) return res.status(404).json({ error: "Booking not found." });
    res.json({ message: "Booking status updated." });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.get("*", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

app.listen(PORT, () => {
  console.log(`Vehicle Rental Management System running at http://localhost:${PORT}`);
});
