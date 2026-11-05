DRIVEEASE - VEHICLE RENTAL MANAGEMENT SYSTEM
============================================

TECHNOLOGY
- HTML, CSS, browser JavaScript
- Node.js + Express
- MySQL + mysql2
- dotenv for local database settings

1) DATABASE SETUP
- Open MySQL Workbench and connect to your local MySQL server.
- Open database.sql from this project, copy its contents into a SQL tab, and click the lightning bolt Execute button.
- It creates database `vehicle_rental_db` and tables `vehicles`, `customers`, and `rentals`.
- It adds 3 sample vehicles. You can remove the sample INSERT section from database.sql if you want to start with an empty fleet.
- Refresh the Schemas panel. Expand vehicle_rental_db > Tables to see the tables.

2) NODE.JS SETUP
- Install Node.js LTS if not already installed.
- Open this project folder in VS Code.
- Open Terminal > New Terminal.
- Run: npm install
- Copy `.env.example` to a new file named `.env`.
- Open `.env` and set DB_USER and DB_PASSWORD to your own local MySQL username and password.
  Example:
    DB_HOST=localhost
    DB_USER=root
    DB_PASSWORD=your_actual_mysql_password
    DB_NAME=vehicle_rental_db
    PORT=3000
- Do not share your .env file or upload it to GitHub.

3) START THE WEBSITE
- In the VS Code terminal, run: npm start
- Open http://localhost:3000 in your browser.
- Test the database connection at http://localhost:3000/api/health

4) PAGES
- / or /index.html : Home
- /vehicles.html : Add, search, filter, edit and delete vehicles
- /bookings.html : Create rentals, calculate total and update booking status
- /customers.html : View customers saved from bookings
- /dashboard.html : Fleet counts and recent bookings

5) IMAGE PLACEHOLDERS
The website intentionally uses styled image placeholders. To add your own photos:
- Put your image files in public/images/
- In index.html, replace each `.slide-photo` placeholder content with an <img> element or set a CSS background-image.
- In vehicles.js, replace the `.vehicle-image` placeholder markup with an image URL/path when you add an image column or map vehicle IDs to image filenames.
- Page hero placeholders are `.page-hero-photo` elements; set their CSS background-image to your preferred image.
Example CSS:
  .slide-photo { background-image: url('/images/hero-car.jpg'); background-size: cover; background-position: center; }
If you use <img>, use object-fit: cover; width: 100%; height: 100%.

IMPORTANT NOTES
- The system uses inclusive rental dates: pickup date and return date both count as rental days. For example, 10 Oct to 11 Oct = 2 days.
- Vehicle `status` is a manual fleet status. The booking endpoint checks overlapping booking dates separately.
- This is a learning/demo project. Before using it with real customers, add authentication, authorization, CSRF protection, stronger validation, backups, and appropriate privacy/security practices.
