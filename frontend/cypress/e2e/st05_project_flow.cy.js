describe('ST-05: Project Management Flow', () => {

  beforeEach(() => {
    cy.viewport(1280, 720);
    cy.intercept('GET', '**/api/projects*').as('getProjects');
    cy.visit('http://localhost:5173/login');
    cy.get('input[type="email"]').type('admin@aakar.com');
    cy.get('input[type="password"]').type('admin123');
    cy.get('.btn-submit').click();
    cy.url().should('include', '/dashboard');
  });

  it('Admin can create a new project', () => {
    cy.contains('button.nav-item', 'Projects').click();
    cy.wait('@getProjects');
    cy.contains('button.btn.primary', 'New Project').click();

    cy.get('.modal-card input[type="text"]').eq(0).type('Automated Tower');
    cy.get('.modal-card input[type="text"]').eq(1).type('Client X');
    cy.get('.modal-card input[type="text"]').eq(2).type('Kathmandu');
    cy.get('.modal-card input[type="number"]').eq(0).type('5000000');

    // Bug 2 + 3 fixed: force interaction on hidden input, trigger 'input' for Vue v-model
    cy.get('.modal-card input[type="date"]')
      .invoke('val', '2025-12-01')
      .trigger('input', { force: true });

    // Bug 1 fixed: button actually says 'Create Project', not 'Save Project'
    cy.contains('button', 'Create Project').click();

    // Verify
    cy.get('.modal-card').should('not.exist');
    cy.wait('@getProjects');
    cy.contains('h3', 'Automated Tower').should('be.visible');
  });
});