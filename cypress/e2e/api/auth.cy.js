describe('Authentication API Test Suite', () => {
  let testData;

  before(() => {
    cy.fixture('testData').then((data) => {
      testData = data;
    });
  });

  // ==========================================================================
  // FUNCTIONAL & POSITIVE TESTS
  // ==========================================================================

  it('TC-AUTH-001: Register a valid user', () => {
    const uniqueEmail = `user_${Date.now()}@example.com`;
    const payload = {
      name: 'Test Student',
      email: uniqueEmail,
      password: 'SecurePassword123'
    };

    cy.request({
      method: 'POST',
      url: '/api/auth/register',
      body: payload
    }).then((response) => {
      cy.log(`Response Time: ${response.duration} ms`);
      expect(response.status).to.eq(201);
      expect(response.body.success).to.be.true;
      expect(response.body.message).to.eq('User registered successfully');
      expect(response.body.data).to.have.property('id');
      expect(response.body.data.name).to.eq(payload.name);
      expect(response.body.data.email).to.eq(uniqueEmail);
      expect(response.body.data).to.not.have.property('password');
      expect(response.duration).to.be.lessThan(2000);
    });
  });

  it('TC-AUTH-002: Login with valid credentials', () => {
    // First register a unique user, then log in
    const uniqueEmail = `login_${Date.now()}@example.com`;
    const password = 'ValidPassword123';

    cy.registerUser({
      name: 'Login User',
      email: uniqueEmail,
      password: password
    }).then((regRes) => {
      expect(regRes.status).to.eq(201);

      cy.loginUser({
        email: uniqueEmail,
        password: password
      }).then((response) => {
        cy.log(`POST /api/auth/login Response Time: ${response.duration} ms`);
        expect(response.status).to.eq(200);
        expect(response.body.success).to.be.true;
        expect(response.body.message).to.eq('Login successful');
        expect(response.body).to.have.property('token');
        expect(response.body.token).to.be.a('string');
        expect(response.body.user).to.have.property('id');
        expect(response.body.user.email).to.eq(uniqueEmail);
        expect(response.body.user).to.not.have.property('password');
        expect(response.duration).to.be.lessThan(2000);
      });
    });
  });

  // ==========================================================================
  // NEGATIVE TESTS
  // ==========================================================================

  it('TC-AUTH-003: Login with invalid password', () => {
    const uniqueEmail = `wrongpass_${Date.now()}@example.com`;

    cy.registerUser({
      name: 'Wrong Pass User',
      email: uniqueEmail,
      password: 'CorrectPassword123'
    }).then(() => {
      cy.loginUser({
        email: uniqueEmail,
        password: 'IncorrectPassword'
      }).then((response) => {
        expect(response.status).to.eq(401);
        expect(response.body.success).to.be.false;
        expect(response.body.message).to.eq('Invalid email or password');
      });
    });
  });

  it('TC-AUTH-004: Register with missing required field', () => {
    const payload = {
      email: `missing_${Date.now()}@example.com`,
      password: 'Password123'
      // name is intentionally omitted
    };

    cy.request({
      method: 'POST',
      url: '/api/auth/register',
      body: payload,
      failOnStatusCode: false
    }).then((response) => {
      expect(response.status).to.eq(400);
      expect(response.body.success).to.be.false;
      expect(response.body.message).to.include('required');
    });
  });

  it('TC-AUTH-005: Register with password length 5 (< 6 characters)', () => {
    const payload = {
      name: 'Short Password User',
      email: `shortpass_${Date.now()}@example.com`,
      password: '12345'
    };

    cy.request({
      method: 'POST',
      url: '/api/auth/register',
      body: payload,
      failOnStatusCode: false
    }).then((response) => {
      expect(response.status).to.eq(400);
      expect(response.body.success).to.be.false;
      expect(response.body.message).to.include('at least 6 characters');
    });
  });

  it('TC-AUTH-006: Register duplicate email', () => {
    const email = `duplicate_${Date.now()}@example.com`;
    const payload = {
      name: 'Initial User',
      email: email,
      password: 'Password123'
    };

    // First registration
    cy.request({
      method: 'POST',
      url: '/api/auth/register',
      body: payload
    }).then((firstRes) => {
      expect(firstRes.status).to.eq(201);

      // Attempt second registration with identical email
      cy.request({
        method: 'POST',
        url: '/api/auth/register',
        body: payload,
        failOnStatusCode: false
      }).then((secondRes) => {
        expect(secondRes.status).to.eq(409);
        expect(secondRes.body.success).to.be.false;
        expect(secondRes.body.message).to.include('already registered');
      });
    });
  });

  it('TC-AUTH-007: Login with unknown email', () => {
    cy.loginUser({
      email: 'nonexistent_account_9999@example.com',
      password: 'Password123'
    }).then((response) => {
      expect(response.status).to.eq(401);
      expect(response.body.success).to.be.false;
      expect(response.body.message).to.eq('Invalid email or password');
    });
  });

  // ==========================================================================
  // BOUNDARY VALUE ANALYSIS (BVA) & EQUIVALENCE CLASS PARTITIONING (ECP)
  // ==========================================================================

  it('BVA-AUTH-001: Password boundary test - Length 5 (Min - 1, Invalid partition)', () => {
    cy.request({
      method: 'POST',
      url: '/api/auth/register',
      body: {
        name: 'BVA User 5',
        email: `bva5_${Date.now()}@example.com`,
        password: 'abcde'
      },
      failOnStatusCode: false
    }).then((response) => {
      expect(response.status).to.eq(400);
      expect(response.body.success).to.be.false;
      expect(response.body.message).to.include('at least 6 characters');
    });
  });

  it('BVA-AUTH-002: Password boundary test - Length 6 (Min boundary, Valid partition)', () => {
    cy.request({
      method: 'POST',
      url: '/api/auth/register',
      body: {
        name: 'BVA User 6',
        email: `bva6_${Date.now()}@example.com`,
        password: 'abcdef'
      }
    }).then((response) => {
      expect(response.status).to.eq(201);
      expect(response.body.success).to.be.true;
    });
  });

  it('BVA-AUTH-003: Password boundary test - Length 7 (Min + 1, Valid partition)', () => {
    cy.request({
      method: 'POST',
      url: '/api/auth/register',
      body: {
        name: 'BVA User 7',
        email: `bva7_${Date.now()}@example.com`,
        password: 'abcdefg'
      }
    }).then((response) => {
      expect(response.status).to.eq(201);
      expect(response.body.success).to.be.true;
    });
  });

  // ==========================================================================
  // EDGE CASE TESTING
  // ==========================================================================

  it('TC-AUTH-EDGE-001: Register with empty string fields', () => {
    cy.request({
      method: 'POST',
      url: '/api/auth/register',
      body: {
        name: '   ',
        email: '   ',
        password: '      '
      },
      failOnStatusCode: false
    }).then((response) => {
      expect(response.status).to.eq(400);
      expect(response.body.success).to.be.false;
    });
  });

  it('TC-AUTH-EDGE-002: Register with invalid email syntax', () => {
    cy.request({
      method: 'POST',
      url: '/api/auth/register',
      body: {
        name: 'Invalid Email User',
        email: 'not-an-email-address',
        password: 'Password123'
      },
      failOnStatusCode: false
    }).then((response) => {
      expect(response.status).to.eq(400);
      expect(response.body.success).to.be.false;
      expect(response.body.message).to.include('email format');
    });
  });
});
