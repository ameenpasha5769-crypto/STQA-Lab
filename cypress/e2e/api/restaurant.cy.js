describe('Restaurants & Health API Test Suite', () => {
  let testData;

  before(() => {
    cy.fixture('testData').then((data) => {
      testData = data;
    });
  });

  // ==========================================================================
  // MODULE A: HEALTH CHECK
  // ==========================================================================

  it('TC-HEALTH-001: Check API health endpoint', () => {
    cy.request({
      method: 'GET',
      url: '/api/health'
    }).then((response) => {
      cy.log(`GET /api/health Response Time: ${response.duration} ms`);
      expect(response.status).to.eq(200);
      expect(response.body.success).to.be.true;
      expect(response.body.message).to.include('healthy');
      expect(response.body).to.have.property('timestamp');
      expect(response.duration).to.be.lessThan(1000);
    });
  });

  // ==========================================================================
  // MODULE C & D: RESTAURANTS & MENU
  // ==========================================================================

  it('TC-REST-001: Get all restaurants', () => {
    cy.request({
      method: 'GET',
      url: '/api/restaurants'
    }).then((response) => {
      cy.log(`GET /api/restaurants Response Time: ${response.duration} ms`);
      expect(response.status).to.eq(200);
      expect(response.body.success).to.be.true;
      expect(response.body.data).to.be.an('array');
      expect(response.body.data.length).to.be.at.least(2);

      const firstRestaurant = response.body.data[0];
      expect(firstRestaurant).to.have.all.keys('id', 'name', 'cuisine', 'rating', 'menu');
      expect(firstRestaurant.menu).to.be.an('array');
      expect(response.duration).to.be.lessThan(1000);
    });
  });

  it('TC-REST-002: Get restaurant by valid ID (ID: 1)', () => {
    cy.request({
      method: 'GET',
      url: `/api/restaurants/${testData.restaurants.validId}`
    }).then((response) => {
      expect(response.status).to.eq(200);
      expect(response.body.success).to.be.true;
      expect(response.body.data.id).to.eq(testData.restaurants.validId);
      expect(response.body.data.name).to.eq(testData.restaurants.validRestaurantName);
      expect(response.body.data).to.have.property('cuisine');
      expect(response.body.data).to.have.property('rating');
    });
  });

  it('TC-REST-003: Get invalid restaurant ID (ID: 999)', () => {
    cy.request({
      method: 'GET',
      url: `/api/restaurants/${testData.restaurants.invalidId}`,
      failOnStatusCode: false
    }).then((response) => {
      expect(response.status).to.eq(404);
      expect(response.body.success).to.be.false;
      expect(response.body.message).to.eq('Restaurant not found');
    });
  });

  it('TC-REST-004: Get menu for valid restaurant (ID: 1)', () => {
    cy.request({
      method: 'GET',
      url: `/api/restaurants/${testData.restaurants.validId}/menu`
    }).then((response) => {
      cy.log(`GET /api/restaurants/1/menu Response Time: ${response.duration} ms`);
      expect(response.status).to.eq(200);
      expect(response.body.success).to.be.true;
      expect(response.body.restaurantId).to.eq(testData.restaurants.validId);
      expect(response.body.data).to.be.an('array');
      expect(response.body.data.length).to.be.greaterThan(0);

      const item = response.body.data[0];
      expect(item).to.have.all.keys('id', 'name', 'price');
      expect(item.price).to.be.a('number');
      expect(response.duration).to.be.lessThan(1000);
    });
  });

  it('TC-REST-005: Get menu for invalid restaurant (ID: 999)', () => {
    cy.request({
      method: 'GET',
      url: `/api/restaurants/${testData.restaurants.invalidId}/menu`,
      failOnStatusCode: false
    }).then((response) => {
      expect(response.status).to.eq(404);
      expect(response.body.success).to.be.false;
      expect(response.body.message).to.eq('Restaurant not found');
    });
  });

  it('TC-REST-EDGE-001: Get restaurant with non-numeric ID', () => {
    cy.request({
      method: 'GET',
      url: '/api/restaurants/not-a-number',
      failOnStatusCode: false
    }).then((response) => {
      expect(response.status).to.eq(404);
      expect(response.body.success).to.be.false;
    });
  });
});
