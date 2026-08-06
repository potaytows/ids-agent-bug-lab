import { createServer } from "node:http";
import mysql from "mysql2/promise";

const port = Number(process.env.API_PORT ?? 8787);
const pool = mysql.createPool({
  host: process.env.DB_HOST ?? "127.0.0.1",
  port: Number(process.env.DB_PORT ?? 3306),
  database: process.env.DB_NAME ?? "faultymart",
  user: process.env.DB_USER ?? "faultymart_app",
  password: process.env.DB_PASSWORD ?? "faultymart_app_local_only",
  connectionLimit: 5,
  decimalNumbers: true,
});

function sendJson(response, statusCode, body) {
  response.writeHead(statusCode, {
    "Content-Type": "application/json; charset=utf-8",
    "Cache-Control": "no-store",
  });
  response.end(JSON.stringify(body));
}

async function readJson(request) {
  const chunks = [];
  let size = 0;

  for await (const chunk of request) {
    size += chunk.length;
    if (size > 1_000_000) throw new Error("Request body is too large");
    chunks.push(chunk);
  }

  return JSON.parse(Buffer.concat(chunks).toString("utf8") || "{}");
}

async function listProducts(response) {
  const [rows] = await pool.query(`
    SELECT id, name, category, price, color, icon, stock
    FROM products
    ORDER BY id
  `);
  sendJson(response, 200, { products: rows });
}

async function listOrders(response) {
  const [rows] = await pool.query(`
    SELECT public_id AS id, total, status
    FROM orders
    ORDER BY created_at DESC, id DESC
    LIMIT 50
  `);
  sendJson(response, 200, { orders: rows });
}

async function createOrder(request, response) {
  const payload = await readJson(request);
  const customer = payload.customer ?? {};
  const totals = payload.totals ?? {};
  const items = Array.isArray(payload.items) ? payload.items : [];

  if (!customer.name || !items.length || !Number.isFinite(totals.total)) {
    sendJson(response, 400, { error: "Missing order data" });
    return;
  }

  const connection = await pool.getConnection();
  const publicId = `FM-${Date.now().toString(36).toUpperCase()}-${crypto.randomUUID().slice(0, 6).toUpperCase()}`;

  try {
    await connection.beginTransaction();
    const [result] = await connection.execute(
      `
        INSERT INTO orders (
          public_id,
          customer_name,
          email,
          street_address,
          city,
          postal_code,
          subtotal,
          discount,
          shipping,
          total
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `,
      [
        publicId,
        String(customer.name),
        String(customer.email ?? ""),
        String(customer.address ?? ""),
        String(customer.city ?? ""),
        String(customer.postal ?? ""),
        Number(totals.subtotal ?? 0),
        Number(totals.discount ?? 0),
        Number(totals.shipping ?? 0),
        Number(totals.total),
      ],
    );

    for (const item of items) {
      await connection.execute(
        `
          INSERT INTO order_items (
            order_id,
            product_id,
            product_name,
            unit_price,
            quantity
          ) VALUES (?, ?, ?, ?, ?)
        `,
        [
          result.insertId,
          Number(item.id),
          String(item.name),
          Number(item.price),
          Number(item.quantity),
        ],
      );
    }

    await connection.commit();
    sendJson(response, 201, {
      order: { id: publicId, total: Number(totals.total), status: "Processing" },
    });
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
}

const server = createServer(async (request, response) => {
  try {
    const url = new URL(request.url ?? "/", `http://${request.headers.host}`);

    if (request.method === "GET" && url.pathname === "/api/health") {
      await pool.query("SELECT 1");
      sendJson(response, 200, { database: "connected" });
      return;
    }

    if (request.method === "GET" && url.pathname === "/api/products") {
      await listProducts(response);
      return;
    }

    if (request.method === "GET" && url.pathname === "/api/orders") {
      await listOrders(response);
      return;
    }

    if (request.method === "POST" && url.pathname === "/api/orders") {
      await createOrder(request, response);
      return;
    }

    sendJson(response, 404, { error: "Not found" });
  } catch (error) {
    console.error("FaultyMart API error:", error.message);
    sendJson(response, 500, { error: "Database operation failed" });
  }
});

server.listen(port, "127.0.0.1", () => {
  console.log(`FaultyMart API listening on http://127.0.0.1:${port}`);
});
