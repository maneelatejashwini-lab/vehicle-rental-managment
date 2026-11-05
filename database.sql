CREATE DATABASE IF NOT EXISTS vehicle_rental_db;
USE vehicle_rental_db;

CREATE TABLE IF NOT EXISTS vehicles (
    vehicle_id INT AUTO_INCREMENT PRIMARY KEY,
    vehicle_number VARCHAR(20) NOT NULL UNIQUE,
    vehicle_type VARCHAR(50) NOT NULL,
    vehicle_model VARCHAR(100) NOT NULL,
    rent_per_day DECIMAL(10,2) NOT NULL,
    status ENUM('Available', 'Not Available') NOT NULL DEFAULT 'Available'
);

CREATE TABLE IF NOT EXISTS customers (
    customer_id INT AUTO_INCREMENT PRIMARY KEY,
    customer_name VARCHAR(100) NOT NULL,
    phone VARCHAR(15) NOT NULL,
    email VARCHAR(100) NULL,
    license_number VARCHAR(50) NOT NULL UNIQUE
);

CREATE TABLE IF NOT EXISTS rentals (
    rental_id INT AUTO_INCREMENT PRIMARY KEY,
    vehicle_id INT NOT NULL,
    customer_id INT NOT NULL,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    total_amount DECIMAL(10,2) NOT NULL,
    rental_status ENUM('Booked', 'Active', 'Completed', 'Cancelled') NOT NULL DEFAULT 'Booked',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_rentals_vehicle FOREIGN KEY (vehicle_id)
        REFERENCES vehicles(vehicle_id) ON UPDATE CASCADE,
    CONSTRAINT fk_rentals_customer FOREIGN KEY (customer_id)
        REFERENCES customers(customer_id) ON UPDATE CASCADE,
    CONSTRAINT chk_rental_dates CHECK (end_date >= start_date)
);

-- Optional sample vehicles. Delete these INSERT statements if you want an empty table.
INSERT IGNORE INTO vehicles (vehicle_number, vehicle_type, vehicle_model, rent_per_day, status)
VALUES
('AP21AB1234', 'Car', 'Hyundai i20', 1800.00, 'Available'),
('AP21CD5678', 'SUV', 'Kia Seltos', 2800.00, 'Available'),
('AP21EF9012', 'Bike', 'Royal Enfield Classic 350', 900.00, 'Available');
