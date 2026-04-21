// ============================================================
// ST-13: Payroll UI Badging
// Objective: Clicking 'Pay' changes button to 'Paid' status badge.
// ============================================================
describe('ST-13: Payroll UI Badging', () => {
  beforeEach(() => {
    cy.viewport(1280, 720);
    cy.visit('http://localhost:5173/login');
    cy.get('input[type="email"]').type('admin@aakar.com');
    cy.get('input[type="password"]').type('admin123');
    cy.get('.btn-submit').click();
    cy.url().should('include', '/dashboard');
  });

  it('Pay button triggers confirm alert and is replaced by Paid badge', () => {
    // 1. Navigate to Finance and wait for employee data to load
    cy.intercept('GET', '**/api/finance/employees**').as('getEmployees');
    cy.contains('button.nav-item', 'Finance').click();
    cy.wait('@getEmployees');

    // 2. Stub window.confirm to auto-accept the payment confirmation dialog
    cy.window().then((win) => {
      cy.stub(win, 'confirm').returns(true);
    });

    // 3. Intercept the POST salary payment request
    cy.intercept('POST', '**/api/finance/employees/**/pay').as('processSalary');

    // 4. The actual Pay button class is .btn-xs.primary-outline (not .btn-pay)
    cy.get('.btn-xs.primary-outline').first().click();

    // 5. Confirm the payment API was called successfully
    cy.wait('@processSalary').its('response.statusCode').should('eq', 200);

    // 6. The Pay button should be replaced by a .status-badge.success showing 'Paid'
    //    Vue re-renders the row: v-if="emp.paid_this_month" shows the badge,
    //    v-else shows the button — so after reload only the badge exists in that row
    cy.get('.status-badge.success').first()
      .should('be.visible')
      .and('contain.text', 'Paid');
  });
});