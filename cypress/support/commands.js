// ***********************************************
// Custom Cypress Commands for REST API Testing
// ***********************************************

/**
 * Custom command: Register a new user
 * @param {Object} userData - { name, email, password }
 */
Cypress.Commands.add('registerUser', (userData) => {
  return cy.request({
    method: 'POST',
    url: '/api/auth/register',
    body: userData,
    failOnStatusCode: false
  });
});

/**
 * Custom command: Login user
 * @param {Object} credentials - { email, password }
 */
Cypress.Commands.add('loginUser', (credentials) => {
  return cy.request({
    method: 'POST',
    url: '/api/auth/login',
    body: credentials,
    failOnStatusCode: false
  });
});

/**
 * Custom command: Add an item to cart
 * @param {Object} cartData - { userId, restaurantId, itemId, quantity }
 */
Cypress.Commands.add('addToCart', (cartData) => {
  return cy.request({
    method: 'POST',
    url: '/api/cart',
    body: cartData,
    failOnStatusCode: false
  });
});

/**
 * Custom command: Place an order
 * @param {Object} orderData - { userId, address, paymentMethod }
 */
Cypress.Commands.add('placeOrder', (orderData) => {
  return cy.request({
    method: 'POST',
    url: '/api/orders',
    body: orderData,
    failOnStatusCode: false
  });
});
