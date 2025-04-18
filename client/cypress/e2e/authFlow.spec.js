describe('User Authentication Flow', () => {
  const serverUrl = 'https://stockholm-anne-heard-fed.trycloudflare.com';

  beforeEach(() => {
    // Mock API responses
    cy.intercept('POST', `${serverUrl}/api/auth/register`, {
      statusCode: 201,
      body: { message: 'User registered successfully' },
    }).as('register');

    cy.intercept('POST', `${serverUrl}/api/auth/login`, {
      statusCode: 200,
      body: { token: 'mock-token', user: { id: 'user1', email: 'test@example.com' } },
    }).as('login');

    cy.intercept('GET', `${serverUrl}/api/users/me`, {
      statusCode: 200,
      body: { id: 'user1', email: 'test@example.com', username: 'testuser' },
    }).as('getUser');

    // Visit the register page
    cy.visit('/register');
  });

  it('should allow a user to register, log in, and log out', () => {
    // Register
    cy.get('input[id="email"]').type('test@example.com'); // Adjust selector
    cy.get('input[id="username"]').type('testuser'); // Adjust selector
    cy.get('input[id="password"]').type('password123'); // Adjust selector
    cy.get('button[type="submit"]').click(); // Adjust selector
    cy.wait('@register');
    cy.url().should('include', '/login');

    // Log in
    cy.get('input[id="email"]').type('test@example.com'); // Adjust selector
    cy.get('input[id="password"]').type('password123'); // Adjust selector
    cy.get('button[type="submit"]').click(); // Adjust selector
    cy.wait('@login');
    cy.get('nav').contains('testuser').should('exist'); // Adjust selector
    cy.url().should('include', '/dashboard'); // Adjust route

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