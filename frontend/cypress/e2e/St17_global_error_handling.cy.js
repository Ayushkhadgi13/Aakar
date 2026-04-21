
describe('ST-17: Global Error Handling', () => {
  beforeEach(() => {
    cy.viewport(1280, 720);
    cy.visit('http://localhost:5173/login');
    cy.get('input[type="email"]').type('admin@aakar.com');
    cy.get('input[type="password"]').type('admin123');
    cy.get('.btn-submit').click();
    cy.url().should('include', '/dashboard');
  });

  it('Displays a readable alert message when the API returns a 422', () => {
    // 1. Stub the employees endpoint to always return one UNPAID employee
    //    This ensures the Pay button is rendered regardless of real DB state
    cy.intercept('GET', '**/api/finance/employees**', {
      statusCode: 200,
      body: [
        {
          id: 1,
          name: 'Test Employee',
          role: 'Engineer',
          salary_amount: 50000,
          paid_this_month: false,   // <-- forces v-else branch → Pay button renders
        },
      ],
    }).as('getEmployees');

    // 2. Also intercept summary so loadData()'s Promise.all completes
    cy.intercept('GET', '**/api/finance/summary**').as('getSummary');

    // 3. Navigate to Finance
    cy.contains('button.nav-item', 'Finance').click();

    // 4. Wait for both requests so isAdmin resolves and Vue renders the table
    cy.wait('@getSummary');
    cy.wait('@getEmployees');

    // 5. The Pay button must now be visible
    cy.get('.btn-xs.primary-outline', { timeout: 8000 }).should('be.visible');

    // 6. Stub window.confirm to auto-accept the salary confirmation dialog
    cy.window().then((win) => {
      cy.stub(win, 'confirm').returns(true);
    });

    // 7. Stub window.alert to capture the message without blocking the test
    cy.window().then((win) => {
      cy.stub(win, 'alert').as('alertStub');
    });

    // 8. Force a 422 from the pay endpoint
    cy.intercept('POST', '**/api/finance/employees/**/pay', {
      statusCode: 422,
      body: { message: 'Salary already processed for this period.' },
    }).as('paySalary422');

    // 9. Click the Pay button
    cy.get('.btn-xs.primary-outline').first().click();
    cy.wait('@paySalary422');

    // 10. alert() should have been called with the backend error message
    cy.get('@alertStub').should(
      'have.been.calledWith',
      'Salary already processed for this period.'
    );
  });
});