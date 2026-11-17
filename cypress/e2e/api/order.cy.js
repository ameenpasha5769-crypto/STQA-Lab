describe('Order API Test Suite', () => {
  let testData;

  before(() => {
    cy.fixture('testData').then((data) => {
      testData = data;
    });
  });

  // ==========================================================================
  // FUNCTIONAL & POSITIVE TESTS
  // ==========================================================================

  it('TC-ORDER-001: Place a valid order and verify status', () => {
    const orderUserId = 701;

    // 1. Add item to cart
    cy.addToCart({
      userId: orderUserId,
      restaurantId: 1,
      itemId: 101, // 180
      quantity: 2  // 360
    }).then((cartRes) => {
      expect(cartRes.status).to.eq(201);

      // 2. Place order
      cy.placeOrder({
        userId: orderUserId,
        address: testData.order.validAddress,
        paymentMethod: testData.order.paymentMethods.cod
      }).then((orderRes) => {
        cy.log(`POST /api/orders Response Time: ${orderRes.duration} ms`);
        expect(orderRes.status).to.eq(201);
        expect(orderRes.body.success).to.be.true;
        expect(orderRes.body.message).to.eq('Order placed successfully');
        expect(orderRes.body.data).to.have.property('id');
        expect(orderRes.body.data.status).to.eq('PLACED');
        expect(orderRes.body.data.total).to.be.greaterThan(0);
        expect(orderRes.body.data.items).to.be.an('array');
        expect(orderRes.body.data.items.length).to.be.greaterThan(0);
        expect(orderRes.duration).to.be.lessThan(1000);
      });
    });
  });

  it('TC-ORDER-002: Verify order total calculation matches cart item sums', () => {
    const calcUserId = 702;

    // Add multiple different items to cart
    cy.addToCart({
      userId: calcUserId,
      restaurantId: 1,
      itemId: 101, // Price: 180
      quantity: 2  // Total: 360
    }).then(() => {
      cy.addToCart({
        userId: calcUserId,
        restaurantId: 1,
        itemId: 102, // Price: 60
        quantity: 3  // Total: 180
      }).then(() => {
        const expectedTotal = 180 * 2 + 60 * 3; // 360 + 180 = 540

        cy.placeOrder({
          userId: calcUserId,
          address: testData.order.validAddress,
          paymentMethod: testData.order.paymentMethods.upi
        }).then((res) => {
          expect(res.status).to.eq(201);
          expect(res.body.data.total).to.eq(expectedTotal);
          expect(res.body.data.items.length).to.eq(2);

          // Verify cart was cleared after order placement
          cy.request({
            method: 'GET',
            url: `/api/cart/${calcUserId}`
          }).then((cartRes) => {
            expect(cartRes.status).to.eq(200);
            expect(cartRes.body.items.length).to.eq(0);
            expect(cartRes.body.totalAmount).to.eq(0);
          });
        });
      });
    });
  });

  it('TC-ORDER-003: Get valid order details by ID', () => {
    const singleUserId = 703;

    cy.addToCart({
      userId: singleUserId,
      restaurantId: 2,
      itemId: 201,
      quantity: 1
    }).then(() => {
      cy.placeOrder({
        userId: singleUserId,
        address: testData.order.validAddress,
        paymentMethod: testData.order.paymentMethods.creditCard
      }).then((orderRes) => {
        const createdOrderId = orderRes.body.data.id;

        cy.request({
          method: 'GET',
          url: `/api/orders/${createdOrderId}`
        }).then((fetchRes) => {
          expect(fetchRes.status).to.eq(200);
          expect(fetchRes.body.success).to.be.true;
          expect(fetchRes.body.data.id).to.eq(createdOrderId);
          expect(fetchRes.body.data.status).to.eq('PLACED');
          expect(fetchRes.body.data.userId).to.eq(singleUserId);
        });
      });
    });
  });

  // ==========================================================================
  // NEGATIVE TESTS
  // ==========================================================================

  it('TC-ORDER-004: Get invalid order ID returns 404', () => {
    cy.request({
      method: 'GET',
      url: `/api/orders/${testData.order.invalidOrderId}`,
      failOnStatusCode: false
    }).then((response) => {
      expect(response.status).to.eq(404);
      expect(response.body.success).to.be.false;
      expect(response.body.message).to.eq('Order not found');
    });
  });

  it('TC-ORDER-005: Cancel active order returns 200 and sets status CANCELLED', () => {
    const cancelUserId = 705;

    cy.addToCart({
      userId: cancelUserId,
      restaurantId: 1,
      itemId: 103,
      quantity: 1
    }).then(() => {
      cy.placeOrder({
        userId: cancelUserId,
        address: testData.order.validAddress,
        paymentMethod: testData.order.paymentMethods.cod
      }).then((orderRes) => {
        const orderId = orderRes.body.data.id;

        cy.request({
          method: 'PUT',
          url: `/api/orders/${orderId}/cancel`
        }).then((cancelRes) => {
          expect(cancelRes.status).to.eq(200);
          expect(cancelRes.body.success).to.be.true;
          expect(cancelRes.body.message).to.eq('Order cancelled successfully');
          expect(cancelRes.body.data.status).to.eq('CANCELLED');
          expect(cancelRes.body.data).to.have.property('cancelledAt');
        });
      });
    });
  });

  it('TC-ORDER-006: Cancel an already cancelled order returns 400', () => {
    const doubleCancelUserId = 706;

    cy.addToCart({
      userId: doubleCancelUserId,
      restaurantId: 1,
      itemId: 101,
      quantity: 1
    }).then(() => {
      cy.placeOrder({
        userId: doubleCancelUserId,
        address: testData.order.validAddress,
        paymentMethod: testData.order.paymentMethods.cod
      }).then((orderRes) => {
        const orderId = orderRes.body.data.id;

        // First cancellation
        cy.request({
          method: 'PUT',
          url: `/api/orders/${orderId}/cancel`
        }).then((firstCancel) => {
          expect(firstCancel.status).to.eq(200);

          // Second cancellation attempt
          cy.request({
            method: 'PUT',
            url: `/api/orders/${orderId}/cancel`,
            failOnStatusCode: false
          }).then((secondCancel) => {
            expect(secondCancel.status).to.eq(400);
            expect(secondCancel.body.success).to.be.false;
            expect(secondCancel.body.message).to.include('already cancelled');
          });
        });
      });
    });
  });

  it('TC-ORDER-007: Place order with empty cart returns 400', () => {
    const emptyUserId = 99991;

    cy.placeOrder({
      userId: emptyUserId,
      address: testData.order.validAddress,
      paymentMethod: testData.order.paymentMethods.cod
    }).then((response) => {
      expect(response.status).to.eq(400);
      expect(response.body.success).to.be.false;
      expect(response.body.message).to.include('Cart is empty');
    });
  });

  // ==========================================================================
  // EDGE CASE TESTS
  // ==========================================================================

  it('TC-ORDER-EDGE-001: Missing delivery address returns 400', () => {
    const edgeUserId = 707;

    cy.addToCart({
      userId: edgeUserId,
      restaurantId: 1,
      itemId: 101,
      quantity: 1
    }).then(() => {
      cy.placeOrder({
        userId: edgeUserId,
        address: '   ', // Blank address
        paymentMethod: testData.order.paymentMethods.cod
      }).then((response) => {
        expect(response.status).to.eq(400);
        expect(response.body.success).to.be.false;
      });
    });
  });

  it('TC-ORDER-EDGE-002: Unsupported payment method returns 400', () => {
    const edgeUserId = 708;

    cy.addToCart({
      userId: edgeUserId,
      restaurantId: 1,
      itemId: 101,
      quantity: 1
    }).then(() => {
      cy.placeOrder({
        userId: edgeUserId,
        address: testData.order.validAddress,
        paymentMethod: 'CryptoToken' // Invalid payment method
      }).then((response) => {
        expect(response.status).to.eq(400);
        expect(response.body.success).to.be.false;
        expect(response.body.message).to.include('Invalid payment method');
      });
    });
  });
});
