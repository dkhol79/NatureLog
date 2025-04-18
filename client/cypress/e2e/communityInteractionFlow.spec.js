describe('Community Interaction Flow', () => {
  const serverUrl = 'https://stockholm-anne-heard-fed.trycloudflare.com';

  beforeEach(() => {
    // Mock login and user data
    cy.intercept('POST', `${serverUrl}/api/auth/login`, {
      statusCode: 200,
      body: { token: 'mock-token', user: { id: 'user1', email: 'test@example.com' } },
    }).as('login');

    // Mock user data endpoint, if used
    cy.intercept('GET', `${serverUrl}/api/users/me`, {
      statusCode: 200,
      body: { id: 'user1', email: 'test@example.com', username: 'testuser' },
    }).as('getUser');

    cy.intercept('GET', `${serverUrl}/api/communities`, {
      statusCode: 200,
      body: [
        {
          _id: '123',
          name: 'Nature Enthusiasts',
          description: 'A community for nature lovers',
          categories: { Plants: true },
          rules: 'Be respectful',
          communityType: 'public',
          isMature: false,
          members: [],
          adminUsername: 'admin',
          createdAt: new Date().toISOString(),
        },
      ],
    }).as('fetchCommunities');

    // Log in
    cy.visit('/login');
    cy.get('input[id="email"]').type('test@example.com'); // Adjust selector
    cy.get('input[id="password"]').type('password123'); // Adjust selector
    cy.get('button[type="submit"]').click(); // Adjust selector
    cy.wait('@login');
    // Verify login via UI (adjust selector for user indicator)
    cy.get('nav').contains('testuser').should('exist'); // Replace with your user indicator
    cy.url().should('include', '/dashboard'); // Adjust to your post-login route
  });

  it('should allow a user to join a community and post a comment', () => {
    // Navigate to communities list
    cy.get('button').contains('Explore Communities').click(); // Adjust selector
    cy.url().should('include', '/communities'); // Adjust route
    cy.wait('@fetchCommunities');
    cy.get('.community-card').contains('Nature Enthusiasts').should('exist');

    // Join community
    cy.intercept('POST', `${serverUrl}/api/communities/123/members`, {
      statusCode: 200,
      body: { message: 'Joined community successfully' },
    }).as('joinCommunity');

    cy.get('.community-card').contains('Nature Enthusiasts').click();
    cy.url().should('include', '/community-page/123'); // Adjust route
    cy.get('button').contains('Join Community').click(); // Adjust selector
    cy.wait('@joinCommunity');
    cy.get('button').contains('Leave Community').should('exist'); // Adjust selector

    // Post a comment
    cy.intercept('POST', `${serverUrl}/api/communities/123/comments`, {
      statusCode: 201,
      body: {
        _id: 'comment1',
        content: 'Love this community!',
        userId: 'user1',
        username: 'testuser',
        createdAt: new Date().toISOString(),
      },
    }).as('postComment');

    cy.get('textarea[placeholder="Add a comment"]').type('Love this community!'); // Adjust selector
    cy.get('button').contains('Post Comment').click(); // Adjust selector
    cy.wait('@postComment');

    // Verify comment
    cy.intercept('GET', `${serverUrl}/api/communities/123/comments`, {
      statusCode: 200,
      body: [
        {
          _id: 'comment1',
          content: 'Love this community!',
          userId: 'user1',
          username: 'testuser',
          createdAt: new Date().toISOString(),
        },
      ],
    }).as('fetchComments');

    cy.reload();
    cy.wait('@fetchComments');
    cy.get('.comment').contains('Love this community!').should('exist');
  });
});