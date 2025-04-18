describe('Community Creation and Management Flow', () => {
  beforeEach(() => {
    // Mock API responses for login and community endpoints
    cy.intercept('POST', '/api/auth/login', {
      statusCode: 200,
      body: { token: 'mock-token' },
    }).as('login');

    cy.intercept('GET', '/api/journal', {
      statusCode: 200,
      body: [],
    }).as('fetchJournal');

    // Visit login page
    cy.visit('/login');
  });

  it('should allow a user to create a community, update it, manage members, and see it in My Communities', () => {
    // Login
    cy.get('input[id="email"]').type('test@example.com');
    cy.get('input[id="password"]').type('password123');
    cy.get('button[type="submit"]').click();
    cy.wait('@login');

    // Navigate to create community
    cy.intercept('POST', '/api/communities', {
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

    cy.get('button').contains('Create New Community').click();
    cy.url().should('include', '/community-create');

    // Fill out and submit community creation form
    cy.get('input[placeholder="Enter community name"]').type('Test Community');
    cy.get('textarea[placeholder="Describe your community"]').type('A test community');
    cy.get('input[type="checkbox"]').first().check();
    cy.get('textarea[placeholder="List community rules"]').type('No spam');
    cy.get('select').select('public');
    cy.get('button').contains('Create Community').click();

    cy.wait('@createCommunity');
    cy.url().should('include', '/my-communities');

    // Verify community in My Communities
    cy.intercept('GET', '/api/communities', {
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
    cy.intercept('GET', '/api/communities/123', {
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
    cy.url().should('include', '/community-page/123');
    cy.get('button').contains('View Community Details').click();
    cy.url().should('include', '/community/123');
    cy.get('button').contains('Manage').click();
    cy.url().should('include', '/community-manage/123');

    // Update community details
    cy.intercept('PUT', '/api/communities/123', {
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

    cy.get('input[placeholder="Enter community name"]').clear().type('Updated Community');
    cy.get('textarea[placeholder="Describe your community"]').clear().type('Updated description');
    cy.get('button').contains('Update Community').click();

    cy.wait('@updateCommunity');
    cy.url().should('include', '/community/123');

    // Manage members
    cy.intercept('GET', '/api/users/search?query=user2', {
      statusCode: 200,
      body: [{ _id: 'user2', username: 'user2', email: 'user2@example.com' }],
    }).as('searchUsers');

    cy.intercept('POST', '/api/communities/123/members', {
      statusCode: 200,
      body: {},
    }).as('addMember');

    cy.get('button').contains('Manage').click();
    cy.get('input[placeholder="Search for users to add..."]').type('user2');
    cy.get('button').contains('Search').click();
    cy.wait('@searchUsers');
    cy.get('button').contains('Add').click();
    cy.wait('@addMember');

    // Toggle admin status
    cy.intercept('PUT', '/api/communities/123/admin', {
      statusCode: 200,
      body: {},
    }).as('toggleAdmin');

    cy.get('button').contains('Make Admin').click();
    cy.wait('@toggleAdmin');

    // Verify updated community in My Communities
    cy.intercept('GET', '/api/communities', {
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

    cy.visit('/my-communities');
    cy.wait('@fetchUpdatedCommunities');
    cy.get('.community-card').contains('Updated Community').should('exist');
  });
});