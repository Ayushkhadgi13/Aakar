describe('ST-09: Task Completion Flow', () => {

  beforeEach(() => {
    cy.viewport(1280, 720);
    cy.intercept('GET', '**/api/tasks*').as('getTasks');
    cy.intercept('GET', '**/api/projects*').as('getProjects');
    cy.intercept('GET', '**/api/projects/*/members').as('getMembers');
    cy.intercept('POST', '**/api/tasks').as('createTask');
    cy.intercept('PUT', '**/api/tasks/*').as('updateTask');

    cy.visit('http://localhost:5173/login');
    cy.get('input[type="email"]').type('admin@aakar.com');
    cy.get('input[type="password"]').type('admin123');
    cy.get('.btn-submit').click();
    cy.url().should('include', '/dashboard');
  });

  it('Changing task status dropdown fires PUT request and updates the status badge', () => {
    // ── PART 1: Create a task assigned to the admin ───────────

    cy.contains('button.nav-item', 'Tasks').click();
    cy.wait('@getTasks');

    // Open the Assign Task modal
    cy.contains('button.btn.primary', 'Assign Task').click();
    cy.get('.modal-card').should('be.visible');

    // Fill title and description
    cy.get('.modal-card input[type="text"]').type('Cypress Status Test Task');
    cy.get('.modal-card textarea').type('Auto-created by Cypress for ST-09');

    // Select first available project
    cy.get('.modal-card select').eq(0).find('option').not('[disabled]').first().then(($opt) => {
      cy.get('.modal-card select').eq(0).select($opt.val());
    });

    // Wait for project members to load, then assign to the first member
    cy.wait('@getMembers');
    cy.get('.modal-card select').eq(1).find('option').not('[disabled]').first().then(($opt) => {
      cy.get('.modal-card select').eq(1).select($opt.val());
    });

    // Set due date on the hidden date input
    cy.get('.modal-card input[type="date"]')
      .invoke('val', '2026-12-31')
      .trigger('input', { force: true });

    // ✅ Bug fix: scope submit click to INSIDE .modal-card
    //    cy.contains('button', 'Assign Task') was matching the HEADER button
    //    sitting behind the modal-backdrop, causing the "covered by" error
    cy.get('.modal-card').contains('button[type="submit"]', 'Assign Task').click();

    cy.wait('@createTask').its('response.statusCode').should('be.oneOf', [200, 201]);

    // Modal closes and task list reloads
    cy.get('.modal-card').should('not.exist');
    cy.wait('@getTasks');

    // ── PART 2: Change the new task's status ─────────────────

    cy.contains('.task-card', 'Cypress Status Test Task').as('targetCard');
    cy.get('@targetCard').should('be.visible');

    // Confirm current status is Pending (freshly created)
    cy.get('@targetCard').find('select.styled-input.small').should('have.value', 'Pending');

    // Change to 'In Progress'
    cy.get('@targetCard').within(() => {
      cy.get('select.styled-input.small').select('In Progress');
    });

    cy.wait('@updateTask').then((interception) => {
      expect(interception.request.body).to.have.property('status', 'In Progress');
      expect(interception.response.statusCode).to.be.oneOf([200, 201]);
    });

    cy.get('@targetCard')
      .find('.status-badge')
      .should('have.class', 'in-progress')
      .and('contain.text', 'In Progress');

    // Change to 'Completed'
    cy.get('@targetCard').within(() => {
      cy.get('select.styled-input.small').select('Completed');
    });

    cy.wait('@updateTask').then((interception) => {
      expect(interception.request.body).to.have.property('status', 'Completed');
    });

    cy.get('@targetCard')
      .find('.status-badge')
      .should('have.class', 'completed')
      .and('contain.text', 'Completed');
  });
});