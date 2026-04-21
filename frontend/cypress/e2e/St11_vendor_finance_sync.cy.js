describe('ST-11: Vendor to Finance UI Sync', () => {

  beforeEach(() => {
    cy.viewport(1280, 720);
    cy.intercept('GET', '**/api/finance/vendors').as('getVendors');
    cy.intercept('GET', '**/api/projects*').as('getProjects');
    cy.intercept('POST', '**/api/finance/vendors').as('createVendor');
    // ✅ Fix: Finance page calls /finance/summary on mount, not /finance
    cy.intercept('GET', '**/api/finance/summary').as('getFinanceSummary');

    cy.visit('http://localhost:5173/login');
    cy.get('input[type="email"]').type('admin@aakar.com');
    cy.get('input[type="password"]').type('admin123');
    cy.get('.btn-submit').click();
    cy.url().should('include', '/dashboard');
  });

  it('New vendor with materials is saved and Finance page re-renders charts on mount', () => {
    // ── PART 1: Create vendor ──────────────────────────────────

    cy.contains('button.nav-item', 'Vendors').click();
    cy.wait('@getVendors');
    cy.wait('@getProjects');

    cy.contains('button.btn.primary', 'New Vendor').click();
    cy.get('.modal-card').should('be.visible');

    const vendorName = `Cypress Vendor ${Date.now()}`;

    cy.get('.modal-card input[type="text"]').eq(0).type(vendorName);

    cy.get('.modal-card select.styled-input')
      .find('option').not('[disabled]').first()
      .then(($opt) => {
        cy.get('.modal-card select.styled-input').select($opt.val());
      });

    cy.get('.material-row').first().within(() => {
      cy.get('input[type="text"]').type('Steel Rebar');
      cy.get('input[type="number"]').eq(0).clear().type('50');
      cy.get('input[type="number"]').eq(1).clear().type('1200');
    });

    cy.get('.modal-card').contains('button[type="submit"]', 'Create Vendor').click();
    cy.wait('@createVendor').its('response.statusCode').should('be.oneOf', [200, 201]);

    cy.get('.modal-card').should('not.exist');
    cy.wait('@getVendors');
    cy.contains('td strong', vendorName).should('be.visible');

    // ── PART 2: Finance page re-renders on mount ───────────────

    cy.contains('button.nav-item', 'Finance').click();
    // ✅ Fix: wait for the actual endpoint Finance.vue calls on mount
    cy.wait('@getFinanceSummary');

    // Charts rendered confirms fetchAnalytics() ran successfully
    cy.get('.apexcharts-canvas').should('exist').and('be.visible');
    cy.get('.apexcharts-series, .apexcharts-pie-series').should('exist');
  });
});