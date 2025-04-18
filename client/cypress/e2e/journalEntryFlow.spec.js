describe('Journal Entry Flow', () => {
  beforeEach(() => {
    // Mock login and user data
    cy.intercept('POST', '/api/auth/login', {
      statusCode: 200,
      body: { token: 'mock-token', user: { id: 'user1', email: 'test@example.com' } },
    }).as('login');

    cy.intercept('GET', '/api/users/me', {
      statusCode: 200,
      body: { id: 'user1', email: 'test@example.com', username: 'testuser' },
    }).as('getUser');

    cy.intercept('GET', '/api/journal', {
      statusCode: 200,
      body: [],
    }).as('fetchJournal');

    // Log in
    cy.visit('/login');
    cy.get('input[id="email"]').type('test@example.com');
    cy.get('input[id="password"]').type('password123');
    cy.get('button[type="submit"]').click();
    cy.wait('@login');
    cy.wait('@getUser');
  });

  it('should allow a user to create, edit, and delete a journal entry', () => {
    // Navigate to journal creation
    cy.intercept('POST', '/api/journal', {
      statusCode: 201,
      body: {
        _id: 'journal1',
        title: 'My Nature Adventure',
        content: 'Saw a beautiful bird today!',
        userId: 'user1',
        createdAt: new Date().toISOString(),
      },
    }).as('createJournal');

    cy.get('button').contains('Create Journal').click(); // Adjust to your journal creation button
    cy.url().should('include', '/journal/create'); // Adjust to your journal creation route

    // Create journal entry
    cy.get('input[placeholder="Enter journal title"]').type('My Nature Adventure');
    cy.get('textarea[placeholder="Write your journal entry"]').type('Saw a beautiful bird today!');
    cy.get('button').contains('Save').click();
    cy.wait('@createJournal');
    cy.url().should('include', '/journal'); // Adjust to your journal list route

    // Verify journal entry
    cy.intercept('GET', '/api/journal', {
      statusCode: 200,
      body: [
        {
          _id: 'journal1',
          title: 'My Nature Adventure',
          content: 'Saw a beautiful bird today!',
          userId: 'user1',
          createdAt: new Date().toISOString(),
        },
      ],
    }).as('fetchUpdatedJournal');

    cy.reload();
    cy.wait('@fetchUpdatedJournal');
    cy.get('.journal-entry').contains('My Nature Adventure').should('exist');

    // Edit journal entry
    cy.intercept('PUT', '/api/journal/journal1', {
      statusCode: 200,
      body: {
        _id: 'journal1',
        title: 'Updated Nature Adventure',
        content: 'Saw a beautiful bird and a deer today!',
        userId: 'user1',
        updatedAt: new Date().toISOString(),
      },
    }).as('updateJournal');

    cy.get('.journal-entry').contains('My Nature Adventure').click();
    cy.url().should('include', '/journal/journal1'); // Adjust to your journal detail route
    cy.get('button').contains('Edit').click();
    cy.get('input[placeholder="Enter journal title"]').clear().type('Updated Nature Adventure');
    cy.get('textarea[placeholder="Write your journal entry"]').clear().type('Saw a beautiful bird and a deer today!');
    cy.get('button').contains('Save').click();
    cy.wait('@updateJournal');
    cy.url().should('include', '/journal');

    // Verify updated journal entry
    cy.intercept('GET', '/api/journal', {
      statusCode: 200,
      body: [
        {
          _id: 'journal1',
          title: 'Updated Nature Adventure',
          content: 'Saw a beautiful bird and a deer today!',
          userId: 'user1',
          updatedAt: new Date().toISOString(),
        },
      ],
    }).as('fetchEditedJournal');

    cy.reload();
    cy.wait('@fetchEditedJournal');
    cy.get('.journal-entry').contains('Updated Nature Adventure').should('exist');

    // Delete journal entry
    cy.intercept('DELETE', '/api/journal/journal1', {
      statusCode: 200,
      body: { message: 'Journal entry deleted' },
    }).as('deleteJournal');

    cy.get('.journal-entry').contains('Updated Nature Adventure').click();
    cy.get('button').contains('Delete').click();
    cy.wait('@deleteJournal');
    cy.url().should('include', '/journal');

    // Verify deletion
    cy.intercept('GET', '/api/journal', {
      statusCode: 200,
      body: [],
    }).as('fetchEmptyJournal');

    cy.reload();
    cy.wait('@fetchEmptyJournal');
    cy.get('.journal-entry').should('not.exist');
  });
});