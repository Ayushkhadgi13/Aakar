// ============================================================
// ST-12: Finance Date Filtering
// Objective: Custom Start/End date pickers on Finance page
//            filter transactions; charts re-render with scoped
//            data; 'Clear Filters' button appears and resets.
// ============================================================
describe('ST-12: Finance Date Filtering', () => {
  beforeEach(() => {
    cy.viewport(1280, 720);
    // Intercept only /finance/summary to avoid false matches on /projects & /finance/employees
    cy.intercept('GET', '**/api/finance/summary**').as('getFinance');
    cy.visit('http://localhost:5173/login');
    cy.get('input[type="email"]').type('admin@aakar.com');
    cy.get('input[type="password"]').type('admin123');
    cy.get('.btn-submit').click();
    cy.url().should('include', '/dashboard');
  });

  it('Date pickers filter data and Clear Filters resets state', () => {
    // 1. Navigate to Finance
    cy.contains('button.nav-item', 'Finance').click();
    cy.wait('@getFinance'); // consumes the page-load summary call

    // 2. 'Clear Filters' button should be hidden initially (no active filters)
    cy.get('button.btn-ghost').should('not.have.class', 'visible');

    // 3. Open the Start Date custom calendar
    cy.get('.custom-date-box').eq(0).click();

    // 4. Pick the first available day in the current month
    //    Finance.vue uses .calendar-day with .muted for non-current-month days
    cy.get('.calendar-day:not(.muted)').first().click();

    // 5. loadData() fires after start date selected — wait for summary call
    //    Note: no date params yet (Finance.vue only sends params when BOTH dates are set)
    cy.wait('@getFinance');

    // 6. Re-alias BEFORE selecting end date so the next wait captures exactly
    //    the request triggered by the end date pick (with both params present)
    cy.intercept('GET', '**/api/finance/summary**').as('getFinanceWithDates');

    // 7. Open the End Date custom calendar
    cy.get('.custom-date-box').eq(1).click();

    // 8. Pick the last available day in the current month
    cy.get('.calendar-day:not(.muted)').last().click();

    // 9. Both dates now set — loadData sends start_date + end_date as query params
    cy.wait('@getFinanceWithDates').then((interception) => {
      expect(interception.request.url).to.include('start_date');
      expect(interception.request.url).to.include('end_date');
    });

    // 10. The 'Clear Filters' button should now be visible
    cy.get('button.btn-ghost').should('have.class', 'visible').and('be.visible');

    // 11. Charts are still rendered (not broken by the filter)
    cy.get('.apexcharts-canvas, [class*="chart"]').should('exist');

    // 12. Re-alias before Clear Filters click to get a clean intercept for that call
    cy.intercept('GET', '**/api/finance/summary**').as('getFinanceCleared');

    // 13. Click 'Clear Filters' — state resets, another loadData() fires
    cy.get('button.btn-ghost').click();
    cy.wait('@getFinanceCleared');

    // 14. Clear button should hide itself again
    cy.get('button.btn-ghost').should('not.have.class', 'visible');

    // 15. Date boxes should show placeholder text again
    cy.get('.custom-date-box').eq(0).should('contain.text', 'Select Start Date');
    cy.get('.custom-date-box').eq(1).should('contain.text', 'Select End Date');
  });
});