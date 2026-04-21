// ============================================================
// ST-16: Form Validation Logic
// Objective: HTML5 validations block bad submissions on New Project modal.
// Modal backdrop: class="modal-backdrop"
// Modal card: class="modal-card"
// Submit button: type="submit" class="btn primary full-width"
// Name input: type="text" v-model="form.name" required placeholder="e.g. Skyline Residency"
// Budget input: type="number" v-model="form.budget" required min="1"
// ============================================================
describe('ST-16: Form Validation Logic', () => {
  beforeEach(() => {
    cy.viewport(1280, 720);
    cy.visit('http://localhost:5173/login');
    cy.get('input[type="email"]').type('admin@aakar.com');
    cy.get('input[type="password"]').type('admin123');
    cy.get('.btn-submit').click();
    cy.url().should('include', '/dashboard');
  });

  it('Blocks submission when required fields are blank', () => {
    // 1. Navigate to Projects and open the New Project modal
    cy.contains('button.nav-item', 'Projects').click();
    cy.contains('button.btn.primary', 'New Project').click();
    cy.get('.modal-card').should('be.visible');

    // 2. Attempt to submit without filling any fields
    cy.get('.modal-card button[type="submit"]').click();

    // 3. Modal should still be open — HTML5 validation blocked the submit
    cy.get('.modal-card').should('be.visible');

    // 4. The project name input is marked invalid by the browser
    cy.get('.modal-card input[placeholder="e.g. Skyline Residency"]')
      .then(($el) => {
        expect($el[0].validity.valid).to.be.false;
      });
  });

  it('Blocks submission when a string is entered in the budget number field', () => {
    // 1. Open New Project modal
    cy.contains('button.nav-item', 'Projects').click();
    cy.contains('button.btn.primary', 'New Project').click();
    cy.get('.modal-card').should('be.visible');

    // 2. Fill the required name and client fields
    cy.get('.modal-card input[placeholder="e.g. Skyline Residency"]')
      .type('Test Project');
    cy.get('.modal-card input[placeholder="Full name or company"]')
      .type('Test Client');

    // 3. Type a non-numeric string into the budget number field
    cy.get('.modal-card input[type="number"]').type('not-a-number');

    // 4. Attempt submit — browser should block it
    cy.get('.modal-card button[type="submit"]').click();

    // 5. Modal remains open
    cy.get('.modal-card').should('be.visible');

    // 6. Budget field should be marked invalid
    cy.get('.modal-card input[type="number"]').then(($el) => {
      expect($el[0].validity.valid).to.be.false;
    });
  });
});