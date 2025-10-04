-- Insert sample restaurants
INSERT INTO restaurants (name, description, address, phone, email, cuisine, price_range, image_url)
VALUES 
  ('The Italian Corner', 'Authentic Italian cuisine in a cozy atmosphere', '123 Main St, San Francisco, CA 94102', '(415) 555-0101', 'info@italiancorner.com', 'Italian', '$$$', null),
  ('Sushi Paradise', 'Fresh sushi and Japanese delicacies', '456 Market St, San Francisco, CA 94103', '(415) 555-0102', 'hello@sushiparadise.com', 'Japanese', '$$$$', null),
  ('The Burger Joint', 'Gourmet burgers and craft beers', '789 Mission St, San Francisco, CA 94104', '(415) 555-0103', 'contact@burgerjoint.com', 'American', '$$', null);

-- Insert opening hours for The Italian Corner (Restaurant ID 1)
INSERT INTO opening_hours (restaurant_id, day_of_week, open_time, close_time, is_closed)
VALUES
  (1, 0, '11:00', '22:00', 0), -- Sunday
  (1, 1, '11:00', '22:00', 0), -- Monday
  (1, 2, '11:00', '22:00', 0), -- Tuesday
  (1, 3, '11:00', '22:00', 0), -- Wednesday
  (1, 4, '11:00', '23:00', 0), -- Thursday
  (1, 5, '11:00', '23:00', 0), -- Friday
  (1, 6, '11:00', '23:00', 0); -- Saturday

-- Insert opening hours for Sushi Paradise (Restaurant ID 2)
INSERT INTO opening_hours (restaurant_id, day_of_week, open_time, close_time, is_closed)
VALUES
  (2, 0, '12:00', '21:00', 0),
  (2, 1, '00:00', '00:00', 1), -- Closed Monday
  (2, 2, '12:00', '22:00', 0),
  (2, 3, '12:00', '22:00', 0),
  (2, 4, '12:00', '22:00', 0),
  (2, 5, '12:00', '23:00', 0),
  (2, 6, '12:00', '23:00', 0);

-- Insert opening hours for The Burger Joint (Restaurant ID 3)
INSERT INTO opening_hours (restaurant_id, day_of_week, open_time, close_time, is_closed)
VALUES
  (3, 0, '10:00', '22:00', 0),
  (3, 1, '10:00', '22:00', 0),
  (3, 2, '10:00', '22:00', 0),
  (3, 3, '10:00', '22:00', 0),
  (3, 4, '10:00', '23:00', 0),
  (3, 5, '10:00', '00:00', 0),
  (3, 6, '10:00', '00:00', 0);

-- Insert tables for The Italian Corner
INSERT INTO tables (restaurant_id, table_number, capacity, is_active)
VALUES
  (1, 'T1', 2, 1),
  (1, 'T2', 2, 1),
  (1, 'T3', 4, 1),
  (1, 'T4', 4, 1),
  (1, 'T5', 6, 1),
  (1, 'T6', 8, 1);

-- Insert tables for Sushi Paradise
INSERT INTO tables (restaurant_id, table_number, capacity, is_active)
VALUES
  (2, 'S1', 2, 1),
  (2, 'S2', 2, 1),
  (2, 'S3', 4, 1),
  (2, 'S4', 4, 1),
  (2, 'S5', 6, 1);

-- Insert tables for The Burger Joint
INSERT INTO tables (restaurant_id, table_number, capacity, is_active)
VALUES
  (3, 'B1', 2, 1),
  (3, 'B2', 4, 1),
  (3, 'B3', 4, 1),
  (3, 'B4', 6, 1),
  (3, 'B5', 8, 1);

-- Insert sample customers
INSERT INTO customers (name, email, phone)
VALUES
  ('John Doe', 'john@example.com', '(555) 123-4567'),
  ('Jane Smith', 'jane@example.com', '(555) 234-5678'),
  ('Bob Johnson', 'bob@example.com', '(555) 345-6789');

-- Insert sample bookings
INSERT INTO bookings (restaurant_id, table_id, customer_id, booking_date, booking_time, party_size, status, special_requests)
VALUES
  (1, 3, 1, '2025-10-10', '19:00', 4, 'confirmed', 'Window seat please'),
  (2, 8, 2, '2025-10-11', '18:30', 2, 'confirmed', 'Anniversary celebration'),
  (3, 14, 3, '2025-10-12', '20:00', 6, 'confirmed', 'Kids menu needed');

