describe('User Authentication Flow', () => {
  const serverUrl = 'https://stockholm-anne-heard-fed.trycloudflare.com';

  beforeEach(() => {
    // Mock register and login
    cy.intercept('POST', `${serverUrl}/api/auth/register`, {
      statusCode: 201,
      body: { message: 'User registered successfully' },
    }).as('register');

    cy.intercept('POST', `${serverUrl}/api/auth/login`, {
      statusCode: 200,
      body: { token: 'mock-token', user: { id: 'user1', email: 'test@example.com' } },
    }).as('login');

    // Visit the register page
    cy.visit('/register');
  });

  it('should allow a user to register, log in, and log out', () => {
    // Register
    cy.get('input[id="email"]').type('test@example.com');
    cy.get('input[id="username"]').type('testuser');
    cy.get('input[id="password"]').type('password123');
    cy.get('button[type="submit"]').contains('Register').click();
    cy.wait('@register');
    cy.url().should('include', '/journal'); // Register redirects to /journal

    // Switch to log in
    cy.visit('/login');

    // Log in
    cy.get('input[id="email"]').type('test@example.com');
    cy.get('input[id="password"]').type('password123');
    cy.get('button[type="submit"]').contains('Login').click();
    cy.wait('@login');
    cy.url().should('include', '/journal');
    // Adjust selector for user indicator
    cy.get('nav').contains('testuser').should('exist');

    // Log out
    cy.intercept('POST', `${serverUrl}/api/auth/logout`, {
      statusCode: 200,
      body: { message: 'Logged out successfully' },
    }).as('logout');

    cy.get('button').contains('Logout').click(); // Adjust selector
    cy.wait('@logout');
    cy.url().should('include', '/login');
    cy.get('nav').contains('testuser').should('not.exist');
  });
});