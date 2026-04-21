
describe('ST-18: Mobile Responsiveness', () => {
  beforeEach(() => {
    cy.visit('http://localhost:5173/login');
    cy.get('input[type="email"]').type('admin@aakar.com');
    cy.get('input[type="password"]').type('admin123');
    cy.get('.btn-submit').click();
    cy.url().should('include', '/dashboard');
  });

  it('KPI grid and charts grid collapse to 1 column on mobile viewport', () => {
    // 1. Switch to a mobile viewport (<= 768px)
    cy.viewport(375, 812);

    // 2. Wait for the dashboard KPI grid to be present
    cy.get('.kpi-grid').should('be.visible');

    // 3. KPI grid should be a single CSS grid column
    cy.get('.kpi-grid').then(($el) => {
      const cols = window.getComputedStyle($el[0]).gridTemplateColumns;
      // A single-column grid produces exactly one track value with no spaces
      const trackCount = cols.trim().split(/\s+/).length;
      expect(trackCount).to.eq(1);
    });

    // 4. Charts grid should also collapse to a single column
    cy.get('.charts-grid').then(($el) => {
      const cols = window.getComputedStyle($el[0]).gridTemplateColumns;
      const trackCount = cols.trim().split(/\s+/).length;
      expect(trackCount).to.eq(1);
    });
  });

  it('No UI elements overflow the viewport at mobile width', () => {
    cy.viewport(375, 812);

    // Body scroll width should not exceed the visible client width
    cy.get('body').then(($body) => {
      expect($body[0].scrollWidth).to.be.lte($body[0].clientWidth);
    });
  });
});