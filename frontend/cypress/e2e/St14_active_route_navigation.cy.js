// ============================================================
// ST-14: Active Route Navigation
// Objective: Clicking Navbar links highlights the active route.
// Nav buttons use class="nav-item" with { active: $route.path === '...' }
// Labels in the navbar: 'Overview', 'Projects', 'Tasks' (not 'Dashboard')
// ============================================================
describe('ST-14: Active Route Navigation', () => {
  beforeEach(() => {
    cy.viewport(1280, 720);
    cy.visit('http://localhost:5173/login');
    cy.get('input[type="email"]').type('admin@aakar.com');
    cy.get('input[type="password"]').type('admin123');
    cy.get('.btn-submit').click();
    cy.url().should('include', '/dashboard');
  });

  it('Navbar applies .active class to the button matching the current route', () => {
    // 1. 'Overview' nav button should be active on initial load at /dashboard
    cy.contains('button.nav-item', 'Overview')
      .should('have.class', 'active');

    // 2. Click Projects — its nav button should become active
    cy.contains('button.nav-item', 'Projects').click();
    cy.url().should('include', '/projects');
    cy.contains('button.nav-item', 'Projects')
      .should('have.class', 'active');
    cy.contains('button.nav-item', 'Overview')
      .should('not.have.class', 'active');

    // 3. Click Tasks — its nav button should become active
    cy.contains('button.nav-item', 'Tasks').click();
    cy.url().should('include', '/tasks');
    cy.contains('button.nav-item', 'Tasks')
      .should('have.class', 'active');
    cy.contains('button.nav-item', 'Projects')
      .should('not.have.class', 'active');
  });
});