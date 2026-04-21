describe('ST-04: Employee Dashboard Layout', () => {

  beforeEach(() => {
    // 1. Set screen size to desktop
    cy.viewport(1280, 720);

    // 2. Intercept the employee stats API call
    cy.intercept('GET', '**/api/tasks/stats*').as('getEmployeeStats');

    // 3. Log in as a STANDARD USER (not an admin)
    cy.visit('http://localhost:5173/login');
    cy.get('input[type="email"]').type('test@example.com');
    cy.get('input[type="password"]').type('password');
    cy.get('button[type="submit"]').click();

    // 4. Ensure we reached the dashboard
    cy.url().should('include', '/dashboard');
    cy.wait('@getEmployeeStats');
  });

  it('Verify Employee sees task queue instead of financial charts', () => {
    
    // 1. Check for the Employee-specific greeting
    cy.get('h1').contains('Welcome').should('be.visible');

    // 2. Verify sensitive Admin Financial Charts are completely hidden
    cy.get('.vue-apexcharts').should('not.exist');
    cy.contains('Total Revenue').should('not.exist');

    // 3. Verify Employee KPI cards are visible
    cy.contains('.kpi-label', 'Pending Tasks').should('be.visible');
    cy.contains('.kpi-label', 'In Progress').should('be.visible');

    // 4. Verify the "Upcoming Deadlines" section exists
    cy.contains('h3', 'Upcoming Deadlines').should('be.visible');
  });

});