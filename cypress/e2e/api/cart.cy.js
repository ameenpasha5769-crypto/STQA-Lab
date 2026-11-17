describe('Cart API Test Suite (BVA & ECP)', () => {
  let testData;
  const testUserId = 501;

  before(() => {
    cy.fixture('testData').then((data) => {
      testData = data;
    });
  });

  // ==========================================================================
  // FUNCTIONAL & POSITIVE TESTS
  // ==========================================================================

  it('TC-CART-001: Add valid food item with quantity 2 and verify item calculation', () => {
    const payload = {
      userId: testUserId,
      restaurantId: 1,
      itemId: 101,
      quantity: 2
    };

    cy.addToCart(payload).then((response) => {
      cy.log(`POST /api/cart Response Time: ${response.duration} ms`);
      expect(response.status).to.eq(201);
      expect(response.body.success).to.be.true;
      expect(response.body.message).to.eq('Item added to cart successfully');
      expect(response.body.data).to.have.property('id');
      expect(response.body.data.userId).to.eq(testUserId);
      expect(response.body.data.itemId).to.eq(101);
      expect(response.body.data.quantity).to.eq(2);
      expect(response.body.data.price).to.eq(180);
      // Verify business calculation: price * quantity = total
      expect(response.body.data.total).to.eq(180 * 2);
      expect(response.duration).to.be.lessThan(1000);
    });
  });

  // ==========================================================================
  // BOUNDARY VALUE ANALYSIS (BVA) FOR QUANTITY [1 to 10]
  // ==========================================================================

  it('BVA-CART-001 / TC-CART-002: Quantity = 0 (Min - 1, Invalid boundary)', () => {
    cy.addToCart({
      userId: testUserId,
      restaurantId: 1,
      itemId: 101,
      quantity: 0
    }).then((response) => {
      expect(response.status).to.eq(400);
      expect(response.body.success).to.be.false;
      expect(response.body.message).to.include('between 1 and 10');
    });
  });

  it('BVA-CART-002 / TC-CART-003: Quantity = 1 (Min boundary, Valid)', () => {
    cy.addToCart({
      userId: testUserId,
      restaurantId: 1,
      itemId: 102,
      quantity: 1
    }).then((response) => {
      expect(response.status).to.eq(201);
      expect(response.body.success).to.be.true;
      expect(response.body.data.quantity).to.eq(1);
      expect(response.body.data.total).to.eq(60 * 1);
    });
  });

  it('BVA-CART-003 / TC-CART-004: Quantity = 2 (Min + 1 boundary, Valid)', () => {
    cy.addToCart({
      userId: testUserId,
      restaurantId: 1,
      itemId: 102,
      quantity: 2
    }).then((response) => {
      expect(response.status).to.eq(201);
      expect(response.body.success).to.be.true;
      expect(response.body.data.quantity).to.eq(2);
      expect(response.body.data.total).to.eq(60 * 2);
    });
  });

  it('BVA-CART-004 / TC-CART-005: Quantity = 5 (Nominal / Mid-range, Valid)', () => {
    cy.addToCart({
      userId: testUserId,
      restaurantId: 1,
      itemId: 102,
      quantity: 5
    }).then((response) => {
      expect(response.status).to.eq(201);
      expect(response.body.success).to.be.true;
      expect(response.body.data.quantity).to.eq(5);
      expect(response.body.data.total).to.eq(60 * 5);
    });
  });

  it('BVA-CART-005 / TC-CART-006: Quantity = 9 (Max - 1 boundary, Valid)', () => {
    cy.addToCart({
      userId: testUserId,
      restaurantId: 1,
      itemId: 102,
      quantity: 9
    }).then((response) => {
      expect(response.status).to.eq(201);
      expect(response.body.success).to.be.true;
      expect(response.body.data.quantity).to.eq(9);
      expect(response.body.data.total).to.eq(60 * 9);
    });
  });

  it('BVA-CART-006 / TC-CART-007: Quantity = 10 (Max boundary, Valid)', () => {
    cy.addToCart({
      userId: testUserId,
      restaurantId: 1,
      itemId: 102,
      quantity: 10
    }).then((response) => {
      expect(response.status).to.eq(201);
      expect(response.body.success).to.be.true;
      expect(response.body.data.quantity).to.eq(10);
      expect(response.body.data.total).to.eq(60 * 10);
    });
  });

  it('BVA-CART-007 / TC-CART-008: Quantity = 11 (Max + 1 boundary, Invalid)', () => {
    cy.addToCart({
      userId: testUserId,
      restaurantId: 1,
      itemId: 101,
      quantity: 11
    }).then((response) => {
      expect(response.status).to.eq(400);
      expect(response.body.success).to.be.false;
      expect(response.body.message).to.include('between 1 and 10');
    });
  });

  // ==========================================================================
  // NEGATIVE & ERROR TESTS
  // ==========================================================================

  it('TC-CART-009: Invalid food item ID (404)', () => {
    cy.addToCart({
      userId: testUserId,
      restaurantId: 1,
      itemId: 9999,
      quantity: 2
    }).then((response) => {
      expect(response.status).to.eq(404);
      expect(response.body.success).to.be.false;
      expect(response.body.message).to.include('Food item not found');
    });
  });

  it('TC-CART-010: Invalid restaurant ID (404)', () => {
    cy.addToCart({
      userId: testUserId,
      restaurantId: 999,
      itemId: 101,
      quantity: 2
    }).then((response) => {
      expect(response.status).to.eq(404);
      expect(response.body.success).to.be.false;
      expect(response.body.message).to.eq('Restaurant not found');
    });
  });

  it('TC-CART-011: Missing required cart fields (400)', () => {
    cy.addToCart({
      userId: testUserId,
      quantity: 2
      // restaurantId and itemId omitted
    }).then((response) => {
      expect(response.status).to.eq(400);
      expect(response.body.success).to.be.false;
      expect(response.body.message).to.include('Missing required cart fields');
    });
  });

  // ==========================================================================
  // CART RETRIEVAL, UPDATE & REMOVAL
  // ==========================================================================

  it('TC-CART-012: Get user cart', () => {
    cy.request({
      method: 'GET',
      url: `/api/cart/${testUserId}`
    }).then((response) => {
      expect(response.status).to.eq(200);
      expect(response.body.success).to.be.true;
      expect(response.body.userId).to.eq(testUserId);
      expect(response.body.items).to.be.an('array');
      expect(response.body).to.have.property('totalAmount');
    });
  });

  it('TC-CART-013: Update cart item quantity (PUT)', () => {
    const singleUserId = 601;
    // Add item first
    cy.addToCart({
      userId: singleUserId,
      restaurantId: 1,
      itemId: 101,
      quantity: 2
    }).then((addRes) => {
      expect(addRes.status).to.eq(201);

      // Update quantity to 4
      cy.request({
        method: 'PUT',
        url: `/api/cart/${singleUserId}/101`,
        body: { quantity: 4 }
      }).then((putRes) => {
        expect(putRes.status).to.eq(200);
        expect(putRes.body.success).to.be.true;
        expect(putRes.body.data.quantity).to.eq(4);
        expect(putRes.body.data.total).to.eq(180 * 4);
      });
    });
  });

  it('TC-CART-014: Remove item from cart (DELETE)', () => {
    const singleUserId = 602;
    cy.addToCart({
      userId: singleUserId,
      restaurantId: 1,
      itemId: 101,
      quantity: 1
    }).then(() => {
      cy.request({
        method: 'DELETE',
        url: `/api/cart/${singleUserId}/101`
      }).then((delRes) => {
        expect(delRes.status).to.eq(200);
        expect(delRes.body.success).to.be.true;
        expect(delRes.body.message).to.include('removed');
      });
    });
  });

  // ==========================================================================
  // EDGE CASE TESTS
  // ==========================================================================

  it('TC-CART-EDGE-001: Negative quantity rejected (-1)', () => {
    cy.addToCart({
      userId: testUserId,
      restaurantId: 1,
      itemId: 101,
      quantity: -1
    }).then((response) => {
      expect(response.status).to.eq(400);
      expect(response.body.success).to.be.false;
    });
  });

  it('TC-CART-EDGE-002: Decimal / floating point quantity rejected (2.5)', () => {
    cy.addToCart({
      userId: testUserId,
      restaurantId: 1,
      itemId: 101,
      quantity: 2.5
    }).then((response) => {
      expect(response.status).to.eq(400);
      expect(response.body.success).to.be.false;
      expect(response.body.message).to.include('integer');
    });
  });
});
