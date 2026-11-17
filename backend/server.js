const express = require('express');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;
const DB_PATH = path.join(__dirname, 'data', 'db.json');

// Middleware
app.use(express.json());

// Helper functions for JSON database operations
function readDB() {
  try {
    const rawData = fs.readFileSync(DB_PATH, 'utf-8');
    return JSON.parse(rawData);
  } catch (error) {
    console.error('Error reading database:', error);
    return { users: [], restaurants: [], cart: [], orders: [] };
  }
}

function writeDB(data) {
  try {
    fs.writeFileSync(DB_PATH, JSON.stringify(data, null, 2), 'utf-8');
    return true;
  } catch (error) {
    console.error('Error writing database:', error);
    return false;
  }
}

// ============================================================================
// MODULE A: HEALTH CHECK
// ============================================================================
app.get('/api/health', (req, res) => {
  return res.status(200).json({
    success: true,
    message: 'Online Food Ordering REST API is healthy',
    timestamp: new Date().toISOString()
  });
});

// ============================================================================
// MODULE B: AUTHENTICATION
// ============================================================================

// POST /api/auth/register
app.post('/api/auth/register', (req, res) => {
  const { name, email, password } = req.body;

  // Validation: Required fields
  if (!name || !email || !password || typeof name !== 'string' || typeof email !== 'string' || typeof password !== 'string') {
    return res.status(400).json({
      success: false,
      message: 'Name, email, and password are required fields'
    });
  }

  const trimmedName = name.trim();
  const trimmedEmail = email.trim().toLowerCase();

  if (!trimmedName || !trimmedEmail) {
    return res.status(400).json({
      success: false,
      message: 'Name and email cannot be empty'
    });
  }

  // Basic email pattern check
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(trimmedEmail)) {
    return res.status(400).json({
      success: false,
      message: 'Invalid email format'
    });
  }

  // Validation: Password length rule (minimum 6 characters)
  if (password.length < 6) {
    return res.status(400).json({
      success: false,
      message: 'Password must be at least 6 characters long'
    });
  }

  const db = readDB();

  // Validation: Duplicate email rule
  const existingUser = db.users.find(u => u.email.toLowerCase() === trimmedEmail);
  if (existingUser) {
    return res.status(409).json({
      success: false,
      message: 'Email is already registered'
    });
  }

  // Create new user (exclude password from responses)
  const newUser = {
    id: db.users.length > 0 ? Math.max(...db.users.map(u => u.id)) + 1 : 1,
    name: trimmedName,
    email: trimmedEmail,
    password: password // In real world, hash with bcrypt; keep simple for college viva
  };

  db.users.push(newUser);
  writeDB(db);

  return res.status(201).json({
    success: true,
    message: 'User registered successfully',
    data: {
      id: newUser.id,
      name: newUser.name,
      email: newUser.email
    }
  });
});

// POST /api/auth/login
app.post('/api/auth/login', (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({
      success: false,
      message: 'Email and password are required'
    });
  }

  const db = readDB();
  const trimmedEmail = email.trim().toLowerCase();
  const user = db.users.find(u => u.email.toLowerCase() === trimmedEmail);

  if (!user) {
    return res.status(401).json({
      success: false,
      message: 'Invalid email or password'
    });
  }

  if (user.password !== password) {
    return res.status(401).json({
      success: false,
      message: 'Invalid email or password'
    });
  }

  // Generate a mock JWT-style token for API session testing
  const mockToken = `mock-token-${user.id}-${Date.now()}`;

  return res.status(200).json({
    success: true,
    message: 'Login successful',
    token: mockToken,
    user: {
      id: user.id,
      name: user.name,
      email: user.email
    }
  });
});

// ============================================================================
// MODULE C & D: RESTAURANTS AND MENUS
// ============================================================================

// GET /api/restaurants
app.get('/api/restaurants', (req, res) => {
  const db = readDB();
  return res.status(200).json({
    success: true,
    count: db.restaurants.length,
    data: db.restaurants
  });
});

// GET /api/restaurants/:id
app.get('/api/restaurants/:id', (req, res) => {
  const restaurantId = parseInt(req.params.id, 10);
  if (isNaN(restaurantId)) {
    return res.status(404).json({
      success: false,
      message: 'Restaurant not found'
    });
  }

  const db = readDB();
  const restaurant = db.restaurants.find(r => r.id === restaurantId);

  if (!restaurant) {
    return res.status(404).json({
      success: false,
      message: 'Restaurant not found'
    });
  }

  return res.status(200).json({
    success: true,
    data: restaurant
  });
});

// GET /api/restaurants/:id/menu
app.get('/api/restaurants/:id/menu', (req, res) => {
  const restaurantId = parseInt(req.params.id, 10);
  if (isNaN(restaurantId)) {
    return res.status(404).json({
      success: false,
      message: 'Restaurant not found'
    });
  }

  const db = readDB();
  const restaurant = db.restaurants.find(r => r.id === restaurantId);

  if (!restaurant) {
    return res.status(404).json({
      success: false,
      message: 'Restaurant not found'
    });
  }

  return res.status(200).json({
    success: true,
    restaurantId: restaurant.id,
    restaurantName: restaurant.name,
    data: restaurant.menu
  });
});

// ============================================================================
// MODULE E: CART
// ============================================================================

// POST /api/cart
app.post('/api/cart', (req, res) => {
  const { userId, restaurantId, itemId, quantity } = req.body;

  // Check presence of all required fields
  if (
    userId === undefined || userId === null ||
    restaurantId === undefined || restaurantId === null ||
    itemId === undefined || itemId === null ||
    quantity === undefined || quantity === null
  ) {
    return res.status(400).json({
      success: false,
      message: 'Missing required cart fields: userId, restaurantId, itemId, and quantity are required'
    });
  }

  // Validate quantity: integer between 1 and 10
  if (typeof quantity !== 'number' || !Number.isInteger(quantity) || quantity < 1 || quantity > 10) {
    return res.status(400).json({
      success: false,
      message: 'Quantity must be an integer between 1 and 10'
    });
  }

  const db = readDB();

  // Validate restaurant existence
  const parsedRestaurantId = parseInt(restaurantId, 10);
  const restaurant = db.restaurants.find(r => r.id === parsedRestaurantId);
  if (!restaurant) {
    return res.status(404).json({
      success: false,
      message: 'Restaurant not found'
    });
  }

  // Validate food item existence in restaurant's menu
  const parsedItemId = parseInt(itemId, 10);
  const menuItem = restaurant.menu.find(m => m.id === parsedItemId);
  if (!menuItem) {
    return res.status(404).json({
      success: false,
      message: 'Food item not found in restaurant menu'
    });
  }

  const itemTotal = menuItem.price * quantity;

  const newCartItem = {
    id: db.cart.length > 0 ? Math.max(...db.cart.map(c => c.id)) + 1 : 1,
    userId: parseInt(userId, 10),
    restaurantId: restaurant.id,
    itemId: menuItem.id,
    itemName: menuItem.name,
    price: menuItem.price,
    quantity: quantity,
    total: itemTotal
  };

  db.cart.push(newCartItem);
  writeDB(db);

  return res.status(201).json({
    success: true,
    message: 'Item added to cart successfully',
    data: newCartItem
  });
});

// GET /api/cart/:userId
app.get('/api/cart/:userId', (req, res) => {
  const userId = parseInt(req.params.userId, 10);
  if (isNaN(userId)) {
    return res.status(400).json({
      success: false,
      message: 'Invalid userId parameter'
    });
  }

  const db = readDB();
  const userItems = db.cart.filter(item => item.userId === userId);
  const totalAmount = userItems.reduce((acc, curr) => acc + curr.total, 0);

  return res.status(200).json({
    success: true,
    userId: userId,
    items: userItems,
    itemCount: userItems.length,
    totalAmount: totalAmount
  });
});

// PUT /api/cart/:userId/:itemId
app.put('/api/cart/:userId/:itemId', (req, res) => {
  const userId = parseInt(req.params.userId, 10);
  const itemId = parseInt(req.params.itemId, 10);
  const { quantity } = req.body;

  if (quantity === undefined || typeof quantity !== 'number' || !Number.isInteger(quantity) || quantity < 1 || quantity > 10) {
    return res.status(400).json({
      success: false,
      message: 'Quantity must be an integer between 1 and 10'
    });
  }

  const db = readDB();
  const cartItemIndex = db.cart.findIndex(c => c.userId === userId && c.itemId === itemId);

  if (cartItemIndex === -1) {
    return res.status(404).json({
      success: false,
      message: 'Item not found in user cart'
    });
  }

  const cartItem = db.cart[cartItemIndex];
  cartItem.quantity = quantity;
  cartItem.total = cartItem.price * quantity;

  db.cart[cartItemIndex] = cartItem;
  writeDB(db);

  return res.status(200).json({
    success: true,
    message: 'Cart item updated successfully',
    data: cartItem
  });
});

// DELETE /api/cart/:userId/:itemId
app.delete('/api/cart/:userId/:itemId', (req, res) => {
  const userId = parseInt(req.params.userId, 10);
  const itemId = parseInt(req.params.itemId, 10);

  const db = readDB();
  const itemIndex = db.cart.findIndex(c => c.userId === userId && c.itemId === itemId);

  if (itemIndex === -1) {
    return res.status(404).json({
      success: false,
      message: 'Item not found in user cart'
    });
  }

  db.cart.splice(itemIndex, 1);
  writeDB(db);

  return res.status(200).json({
    success: true,
    message: 'Item removed from cart successfully'
  });
});

// ============================================================================
// MODULE F: ORDERS
// ============================================================================

// POST /api/orders
app.post('/api/orders', (req, res) => {
  const { userId, address, paymentMethod } = req.body;

  // Validation: required fields
  if (
    userId === undefined || userId === null ||
    !address || typeof address !== 'string' || !address.trim() ||
    !paymentMethod || typeof paymentMethod !== 'string' || !paymentMethod.trim()
  ) {
    return res.status(400).json({
      success: false,
      message: 'Missing required order fields: userId, address, and paymentMethod are required'
    });
  }

  const validPaymentMethods = ['Cash on Delivery', 'Credit Card', 'Debit Card', 'UPI'];
  if (!validPaymentMethods.includes(paymentMethod.trim())) {
    return res.status(400).json({
      success: false,
      message: `Invalid payment method. Allowed methods: ${validPaymentMethods.join(', ')}`
    });
  }

  const parsedUserId = parseInt(userId, 10);
  const db = readDB();

  // Find user's cart items
  const userCartItems = db.cart.filter(item => item.userId === parsedUserId);

  if (userCartItems.length === 0) {
    return res.status(400).json({
      success: false,
      message: 'Cannot place order: Cart is empty'
    });
  }

  // Calculate order total from cart items
  const orderTotal = userCartItems.reduce((sum, item) => sum + item.total, 0);

  const newOrder = {
    id: db.orders.length > 0 ? Math.max(...db.orders.map(o => o.id)) + 1 : 1001,
    userId: parsedUserId,
    items: [...userCartItems],
    total: orderTotal,
    address: address.trim(),
    paymentMethod: paymentMethod.trim(),
    status: 'PLACED',
    createdAt: new Date().toISOString()
  };

  db.orders.push(newOrder);

  // Clear user's cart items upon successful order placement
  db.cart = db.cart.filter(item => item.userId !== parsedUserId);

  writeDB(db);

  return res.status(201).json({
    success: true,
    message: 'Order placed successfully',
    data: newOrder
  });
});

// GET /api/orders/:id
app.get('/api/orders/:id', (req, res) => {
  const orderId = parseInt(req.params.id, 10);
  if (isNaN(orderId)) {
    return res.status(404).json({
      success: false,
      message: 'Order not found'
    });
  }

  const db = readDB();
  const order = db.orders.find(o => o.id === orderId);

  if (!order) {
    return res.status(404).json({
      success: false,
      message: 'Order not found'
    });
  }

  return res.status(200).json({
    success: true,
    data: order
  });
});

// PUT /api/orders/:id/cancel
app.put('/api/orders/:id/cancel', (req, res) => {
  const orderId = parseInt(req.params.id, 10);
  if (isNaN(orderId)) {
    return res.status(404).json({
      success: false,
      message: 'Order not found'
    });
  }

  const db = readDB();
  const order = db.orders.find(o => o.id === orderId);

  if (!order) {
    return res.status(404).json({
      success: false,
      message: 'Order not found'
    });
  }

  if (order.status === 'CANCELLED') {
    return res.status(400).json({
      success: false,
      message: 'Order is already cancelled'
    });
  }

  order.status = 'CANCELLED';
  order.cancelledAt = new Date().toISOString();

  writeDB(db);

  return res.status(200).json({
    success: true,
    message: 'Order cancelled successfully',
    data: order
  });
});

// Start server
if (process.env.NODE_ENV !== 'test') {
  app.listen(PORT, () => {
    console.log(`Online Food Ordering REST API is running on http://localhost:${PORT}`);
  });
}

module.exports = app;
