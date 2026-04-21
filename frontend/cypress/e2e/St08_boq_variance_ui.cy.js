
describe('ST-08: BOQ Variance UI Highlighting', () => {

  beforeEach(() => {
    cy.viewport(1280, 720);
    cy.intercept('GET', '**/api/projects*').as('getProjects');
    cy.intercept('GET', '**/api/projects/*').as('getProjectDetail');

    // ✅ KEY FIX: Stub the comparison endpoint with guaranteed overused data
    // This removes the dependency on real DB state entirely.
    cy.intercept('GET', '**/api/projects/*/materials/comparison', {
      statusCode: 200,
      body: {
        summary: {
          estimated_quantity: 100,
          actual_quantity:    150,
          variance_quantity:   50,   // positive → .danger on summary card
        },
        materials: [
          {
            material_name:      'Steel Rebar',
            estimated_quantity: 100,
            actual_quantity:    150,
            quantity_variance:   50,  // positive → td.danger + status-pill.danger
            status:             'Overused',
          },
          {
            material_name:      'Cement Bags',
            estimated_quantity: 200,
            actual_quantity:    180,
            quantity_variance:  -20,  // negative → no .danger class
            status:             'Under Budget',
          },
        ],
      },
    }).as('getComparison');

    cy.visit('http://localhost:5173/login');
    cy.get('input[type="email"]').type('admin@aakar.com');
    cy.get('input[type="password"]').type('admin123');
    cy.get('.btn-submit').click();
    cy.url().should('include', '/dashboard');
  });

  it('Over-budget materials show .danger class and Overused pill', () => {
    // 1. Navigate to Projects
    cy.contains('button.nav-item', 'Projects').click();
    cy.wait('@getProjects');

    // 2. Open the first project
    cy.get('.project-card').first().click();
    cy.wait('@getProjectDetail');

    // 3. Switch to Materials tab
    cy.contains('button.tab-btn', 'Materials').click();
    cy.wait('@getComparison');

    // 4. The stubbed data has variance_quantity: 50 — td must have .danger
    cy.get('td.danger').should('exist');

    // 5. Status pill for 'Overused' row must carry .danger class
    cy.get('.status-pill.danger')
      .should('exist')
      .and('contain.text', 'Overused');

    // 6. The summary card Variance strong also gets .danger (variance_quantity > 0)
    cy.get('.summary-card strong.danger').should('exist');

    // 7. Negative-variance row ('Cement Bags') must NOT have .danger on its td
    cy.contains('td', 'Cement Bags')
      .siblings('td.danger')
      .should('not.exist');
  });
});