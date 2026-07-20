# Aquamom - Water Refilling Station Management System

A full-stack MERN application (MongoDB, Express, React, Node.js) for managing
gallon inventory, QR-based check-in, delivery and payment tracking, and
customer balance monitoring for a water refilling station.

## What this application does

- Assigns a unique QR code to every gallon in circulation.
- Lets staff scan a gallon's QR code when it is physically returned to the
  station for refilling, automatically bringing it into the system.
- Tracks whether each gallon has been delivered or is still undelivered.
- Tracks whether each gallon's refill has been paid or is unpaid.
- Gives staff a live dashboard of gallons currently at the station versus
  out with customers.
- Gives staff a customer list with computed outstanding balances.
- Gives customers a public, self-service page where they can type their name
  and see which of their gallons are still undelivered or unpaid.

## Project structure

```
aquamom/
  backend/     Express + MongoDB API
  frontend/    React (Vite) application
```

## Requirements

- Node.js 18 or later
- A running MongoDB instance (local installation or MongoDB Atlas)
- A device with a camera for QR scanning (a laptop webcam or a phone browser
  both work)

## Backend setup

```bash
cd backend
npm install
cp .env.example .env
```

Edit `.env` and set `MONGO_URI` to your MongoDB connection string. Then:

```bash
npm run dev      # starts the API with auto-reload on http://localhost:5000
```

Optional: load sample data (a few customers and gallons) to try the app
immediately:

```bash
npm run seed
```

The seed script will print the sample QR codes it created to the console;
you can type these into the "manual entry" field on the Scanner page to test
the flow without printing a physical label.

## Frontend setup

In a separate terminal:

```bash
cd frontend
npm install
cp .env.example .env
npm run dev       # starts the app on http://localhost:5173
```

By default the frontend expects the API at `http://localhost:5000/api`.
Change `VITE_API_URL` in `frontend/.env` if your API runs elsewhere.

## Using the application

### Registering a gallon

Go to **Gallons > Register New Gallon**. You can either type in a QR code
value yourself (for example, if you already have pre-printed stickers with
codes) or leave it blank to have the system generate one automatically. Once
a gallon is registered, open its **QR** action to view and print a label.

### Scanning a returned gallon

Go to **Scan Gallon**. Point the camera at the gallon's QR label, or type
the code into the manual entry box if a camera is not available. A
successful scan:

- Marks the gallon as "At Station" (it has physically come back to you)
- Resets its delivery status to "Undelivered" (a new refill cycle begins)
- Logs the event in the activity history

If the scanned code does not exist yet, the app will offer to register it on
the spot.

### Marking delivery and payment status

On the **Gallons** page, click directly on a gallon's Delivery or Payment
badge to toggle it, or use **Edit** for full control, including reassigning
the gallon to a different customer.

### Monitoring unpaid balances

The **Dashboard** shows the total outstanding balance across all customers.
The **Customers** page lists every customer with their gallon counts and
unpaid balance, and includes a filter to show only customers who currently
owe money.

### Customer self-service lookup

Share the **Customer Lookup** page (`/lookup`) with your customers, for
example as a QR code posted at the station or a link sent by text. They can
type their name and see, without needing an account:

- How many gallons they have on file
- Which of those gallons are still undelivered
- Which of those gallons are still unpaid, and the total amount owed

This page intentionally does not expose phone numbers or addresses - only
gallon and balance information tied to the name they searched.

## API reference

Base URL: `http://localhost:5000/api`

| Method | Endpoint                  | Description                                   |
|--------|---------------------------|------------------------------------------------|
| GET    | /health                   | Health check                                  |
| GET    | /dashboard                | Station-wide statistics and recent activity   |
| GET    | /gallons                  | List gallons (supports filters, see below)    |
| POST   | /gallons                  | Register a new gallon                        |
| POST   | /gallons/scan             | Scan a gallon back into the station          |
| GET    | /gallons/:id              | Get one gallon plus its history               |
| GET    | /gallons/:id/qr           | Get a printable QR image for a gallon        |
| PATCH  | /gallons/:id              | Update customer, status, price, notes         |
| DELETE | /gallons/:id              | Remove a gallon record                       |
| GET    | /customers                | List customers with computed balances         |
| POST   | /customers                | Add a new customer                           |
| GET    | /customers/lookup?name=   | Public lookup by name                         |
| GET    | /customers/:id            | Get one customer plus their gallons          |
| PATCH  | /customers/:id            | Update customer contact info                  |
| DELETE | /customers/:id            | Delete a customer (only if no gallons remain) |

`GET /gallons` accepts optional query parameters: `search` (matches QR
code), `locationStatus` (`at_station` or `with_customer`),
`deliveryStatus` (`delivered` or `undelivered`), `paymentStatus` (`paid` or
`unpaid`), and `customer` (a customer ID).

## Deployment notes

This project has no built-in authentication. Before deploying it publicly,
add an authentication layer (for example, a simple staff login) in front of
the Gallons, Scanner, Customers, and Dashboard pages, since those expose
administrative actions. The Customer Lookup page is designed to remain
public and unauthenticated.

A common low-cost deployment path is:

- Frontend: Vercel or Netlify (`npm run build` produces a `dist` folder)
- Backend: Render or Railway
- Database: MongoDB Atlas

Remember to update `CLIENT_URL` in the backend `.env` and `VITE_API_URL` in
the frontend `.env` to match your deployed URLs.
