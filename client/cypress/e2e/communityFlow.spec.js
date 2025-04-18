describe('Community Creation and Management Flow', () => {
  const serverUrl = 'https://stockholm-anne-heard-fed.trycloudflare.com';

  beforeEach(() => {
    // Mock login
    cy.intercept('POST', `${serverUrl}/api/auth/login`, {
      statusCode: 200,
      body: { token: 'mock-token' },
    }).as('login');

    // Log in
    cy.visit('/login');
    cy.get('input[id="email"]').type('test@example.com');
    cy.get('input[id="password"]').type('password123');
    cy.get('button[type="submit"]').contains('Login').click();
    cy.wait('@login');
    cy.url().should('include', '/journal');
    // Adjust selector for user indicator
    cy.get('nav').contains('testuser').should('exist');
  });

  it('should allow a user to create a community, update it, manage members, and see it in My Communities', () => {
    // Navigate to create community
    cy.intercept('POST', `${serverUrl}/api/communities`, {
      statusCode: 201,
      body: {
        _id: '123',
        name: 'Test Community',
        description: 'A test community',
        categories: { Plants: true },
        rules: 'No spam',
        communityType: 'public',
        isMature: false,
      },
    }).as('createCommunity');

    cy.get('button').contains('Create New Community').click(); // Adjust selector
    cy.url().should('include', '/community-create'); // Adjust route

    // Fill out and submit community creation form
    cy.get('input[placeholder="Enter community name"]').type('Test Community'); // Adjust selector
    cy.get('textarea[placeholder="Describe your community"]').type('A test community'); // Adjust selector
    cy.get('input[type="checkbox"]').first().check(); // Adjust selector
    cy.get('textarea[placeholder="List community rules"]').type('No spam'); // Adjust selector
    cy.get('select').select('public'); // Adjust selector
    cy.get('button').contains('Create Community').click(); // Adjust selector

    cy.wait('@createCommunity');
    cy.url().should('include', '/my-communities'); // Adjust route

    // Verify community in My Communities
    cy.intercept('GET', `${serverUrl}/api/communities`, {
      statusCode: 200,
      body: [
        {
          _id: '123',
          name: 'Test Community',
          description: 'A test community',
          categories: { Plants: true },
          rules: 'No spam',
          communityType: 'public',
          isMature: false,
          members: ['user1'],
          adminUsername: 'testuser',
          createdAt: new Date().toISOString(),
        },
      ],
    }).as('fetchCommunities');

    cy.reload();
    cy.wait('@fetchCommunities');
    cy.get('.community-card').contains('Test Community').should('exist');

    // Navigate to manage community
    cy.intercept('GET', `${serverUrl}/api/communities/123`, {
      statusCode: 200,
      body: {
        _id: '123',
        name: 'Test Community',
        description: 'A test community',
        categories: { Plants: true },
        rules: 'No spam',
        communityType: 'public',
        isMature: false,
        membersDetails: [
          { _id: 'user1', username: 'user1', email: 'user1@example.com', isAdmin: false },
        ],
      },
    }).as('fetchCommunity');

    cy.get('.community-card').click();
    cy.url().should('include', '/community-page/123'); // Adjust route
    cy.get('button').contains('View Community Details').click(); // Adjust selector
    cy.url().should('include', '/community/123'); // Adjust route
    cy.get('button').contains('Manage').click(); // Adjust selector
    cy.url().should('include', '/community-manage/123'); // Adjust route

    // Update community details
    cy.intercept('PUT', `${serverUrl}/api/communities/123`, {
      statusCode: 200,
      body: {
        _id: '123',
        name: 'Updated Community',
        description: 'Updated description',
        categories: { Plants: true },
        rules: 'No spam',
        communityType: 'public',
        isMature: false,
      },
    }).as('updateCommunity');

    cy.get('input[placeholder="Enter community name"]').clear().type('Updated Community'); // Adjust selector
    cy.get('textarea[placeholder="Describe your community"]').clear().type('Updated description'); // Adjust selector
    cy.get('button').contains('Update Community').click(); // Adjust selector

    cy.wait('@updateCommunity');
    cy.url().should('include', '/community/123'); // Adjust route

    // Manage members
    cy.intercept('GET', `${serverUrl}/api/users/search?query=user2`, {
      statusCode: 200,
      body: [{ _id: 'user2', username: 'user2', email: 'user2@example.com' }],
    }).as('searchUsers');

    cy.intercept('POST', `${serverUrl}/api/communities/123/members`, {
      statusCode: 200,
      body: {},
    }).as('addMember');

    cy.get('button').contains('Manage').click(); // Adjust selector
    cy.get('input[placeholder="Search for users to add..."]').type('user2'); // Adjust selector
    cy.get('button').contains('Search').click(); // Adjust selector
    cy.wait('@searchUsers');
    cy.get('button').contains('Add').click(); // Adjust selector
    cy.wait('@addMember');

    // Toggle admin status
    cy.intercept('PUT', `${serverUrl}/api/communities/123/admin`, {
      statusCode: 200,
      body: {},
    }).as('toggleAdmin');

    cy.get('button').contains('Make Admin').click(); // Adjust selector
    cy.wait('@toggleAdmin');

    // Verify updated community in My Communities
    cy.intercept('GET', `${serverUrl}/api/communities`, {
      statusCode: 200,
      body: [
        {
          _id: '123',
          name: 'Updated Community',
          description: 'Updated description',
          categories: { Plants: true },
          rules: 'No spam',
          communityType: 'public',
          isMature: false,
          members: ['user1', 'user2'],
          adminUsername: 'testuser',
          createdAt: new Date().toISOString(),
        },
      ],
    }).as('fetchUpdatedCommunities');

    cy.visit('/my-communities'); // Adjust route
    cy.wait('@fetchUpdatedCommunities');
    cy.get('.community-card').contains('Updated Community').should('exist');
  });
});