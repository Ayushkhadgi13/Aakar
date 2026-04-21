describe('System Tests: Dashboard Analytics', () => {

  beforeEach(() => {
    // 1. Set screen size to desktop
    cy.viewport(1280, 720);

    // 2. Intercept the API calls so Cypress knows when the dashboard has finished loading data
    cy.intercept('GET', '**/api/finance/summary*').as('getSummary');
    cy.intercept('GET', '**/api/projects*').as('getProjects');

    // 3. Log in as Admin
    cy.visit('http://localhost:5173/login');
    cy.get('input[type="email"]').type('admin@aakar.com');
    cy.get('input[type="password"]').type('admin123');
    cy.get('button[type="submit"]').click();

    // 4. Ensure we reached the dashboard
    cy.url().should('include', '/dashboard');
    
    // Wait for the API calls to finish before moving on to the assertions
    cy.wait('@getSummary');
    cy.wait('@getProjects');
  });

  it('ST-03: Verify Admin Dashboard KPI stats and ApexCharts load correctly', () => {
    
    // 1. Check if the page header loaded
    cy.get('h1').contains('Overview').should('be.visible');

    // 2. Check the 3 KPI Cards exist and have values
    cy.get('.kpi-card').should('have.length', 3);
    
    // Check specific labels exist inside the cards
    cy.contains('.kpi-label', 'Total Revenue').should('be.visible');
    cy.contains('.kpi-label', 'Total Expenses').should('be.visible');
    cy.contains('.kpi-label', 'Active Projects').should('be.visible');

    // 3. Check if the ApexCharts rendered
    // Vue3-ApexCharts renders a <div> with the class 'vue-apexcharts'
    cy.get('.vue-apexcharts').should('have.length', 2);
    
    // Verify the chart titles
    cy.contains('h3', 'Financial Trend').should('be.visible');
    cy.contains('h3', 'Project Status').should('be.visible');

  });

  it('ST-03-B: Verify Dark Mode toggle updates theme attribute', () => {
    
    // 1. Check initial state (should be light mode, meaning no 'data-theme="dark"' attribute on HTML tag)
    cy.get('html').should('not.have.attr', 'data-theme', 'dark');

    // 2. Click the theme toggle button in the navbar
    cy.get('.theme-btn').click();

    // 3. Verify the HTML tag now has the dark mode attribute
    cy.get('html').should('have.attr', 'data-theme', 'dark');

    // 4. Verify localStorage was updated (so it remembers the choice on reload)
    cy.window().then((win) => {
      expect(win.localStorage.getItem('theme')).to.equal('dark');
    });

    // 5. Click it again to turn it off and verify it removes the attribute
    cy.get('.theme-btn').click();
    cy.get('html').should('not.have.attr', 'data-theme', 'dark');
  });

});