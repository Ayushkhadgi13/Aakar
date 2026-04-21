describe('template spec', () => {
  it('passes', () => {
    describe('ST-01: Authentication Flow', () => {
      it('should register, login, and redirect to dashboard', () => {
        // 1. Visit Register Page
        cy.visit('http://localhost:5173/register');
    
        // 2. Fill form
        cy.get('input[type="text"]').type('Test User');
        cy.get('input[type="email"]').type('test_e2e@aakar.com');
        cy.get('input[type="password"]').type('password123');
        cy.get('.btn-primary').click();
    
        // 3. Verify Success Modal
        cy.contains('Success!').should('be.visible');
        cy.get('.btn-modal').click();
    
        // 4. Login with newly created user
        cy.url().should('include', '/login');
        cy.get('input[type="email"]').type('test_e2e@aakar.com');
        cy.get('input[type="password"]').type('password123');
        cy.get('.btn-submit').click();
    
        // 5. Verify redirect to Dashboard
        cy.url().should('include', '/dashboard');
        cy.contains('Overview').should('be.visible');
      });
    });
  })
})