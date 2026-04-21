describe('System Tests: Authentication & Routing', () => {

  // This forces Cypress to use a desktop-sized window (1280x720) 
  // so your nav bar doesn't disappear during tests!
  beforeEach(() => {
    cy.viewport(1280, 720);
  });

  it('ST-01: Verify Login flow, persistent session, and Logout', () => {
    // 1. Visit Login Page
    cy.visit('http://localhost:5173/login');
    
    // 2. Type in credentials
    cy.get('input[type="email"]').type('admin@aakar.com');
    cy.get('input[type="password"]').type('admin123');
    
    // 3. Click the Sign In button
    cy.get('button[type="submit"]').click();
    
    // 4. Verify successful routing to Dashboard
    cy.url().should('include', '/dashboard');
    
    // Look specifically for the H1 title so it doesn't get confused by the nav bar
    cy.get('h1').contains('Overview').should('be.visible');
    
    // 5. Verify Persistent Session (Reload the page)
    cy.reload();
    cy.url().should('include', '/dashboard'); 
    
    // 6. Perform Logout (clicking the logout icon button)
    cy.get('.logout-btn').click();
    
    // 7. Verify we are safely redirected back to login
    cy.url().should('include', '/login');
  });

  it('ST-02: Verify unauthenticated users are redirected to login', () => {
    cy.viewport(1280, 720);
    
    // 1. Clear any existing local storage tokens to simulate a logged-out user
    cy.clearLocalStorage();
    
    // 2. Attempt to visit a protected route directly
    cy.visit('http://localhost:5173/dashboard');
    
    // 3. Verify Vue Router catches them and kicks them back to /login
    cy.url().should('include', '/login');
    cy.contains('Welcome ').should('be.visible');
  });

});