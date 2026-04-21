describe('System Tests: Authentication & Routing', () => {

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
    cy.get('h1').contains('Overview').should('be.visible');
    
    // 5. Verify Persistent Session (Reload the page)
    cy.reload();
    cy.url().should('include', '/dashboard'); 
    
    // 6. Perform Logout
    cy.get('.logout-btn').click();
    
    // 7. Verify we are safely redirected back to login
    cy.url().should('include', '/login');
  });

  it('ST-02: Verify unauthenticated users are redirected to login', () => {
    cy.viewport(1280, 720);
    
    // 1. Clear any existing local storage tokens
    cy.clearLocalStorage();
    
    // 2. Attempt to visit a protected route directly
    cy.visit('http://localhost:5173/dashboard');
    
    // 3. Verify Vue Router kicks them back to /login
    cy.url().should('include', '/login');
    
    // FIXED: Matched exact casing and punctuation from Login.vue
    cy.contains('Welcome back!').should('be.visible');
  });

});