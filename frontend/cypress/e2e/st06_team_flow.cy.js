describe('ST-06: Team Assignment Flow', () => {

  beforeEach(() => {
    cy.viewport(1280, 720);
    cy.intercept('GET', '**/api/projects*').as('getProjects');
    cy.intercept('GET', '**/api/projects/*').as('getProjectDetail'); // page load
    cy.intercept('GET', '**/api/projects/*/members').as('getMembers'); // only fires on modal open
    cy.intercept('GET', '**/api/users-list').as('getUsersList');

    cy.visit('http://localhost:5173/login');
    cy.get('input[type="email"]').type('admin@aakar.com');
    cy.get('input[type="password"]').type('admin123');
    cy.get('.btn-submit').click();
    cy.url().should('include', '/dashboard');
  });

  it('Admin can add a member to a project', () => {
    // 1. Go to Projects
    cy.contains('button.nav-item', 'Projects').click();
    cy.wait('@getProjects');

    // 2. Click the first project card — wait for the detail page to load
    //    NOT @getMembers — that only fires when 'Add Members' is clicked
    cy.get('.project-card').first().click();
    cy.wait('@getProjectDetail');

    // 3. Switch to 'Team' tab
    cy.contains('button.tab-btn', 'Team').click();

    // 4. Click 'Add Members' — this is when /members and /users-list are fetched
    //    Bug 3 fix: don't use .btn.primary selector, the actual class is 'btn primary mini'
    cy.contains('button', 'Add Members').click();
    cy.wait('@getMembers');
    cy.wait('@getUsersList');

    // 5. Select the first user in the checkbox list
    cy.get('.checkbox-row input[type="checkbox"]').first().check();

    // 6. Save team members
    cy.contains('button[type="submit"]', 'Add Selected Members').click();

    // 7. Verify the modal disappears
    cy.get('.modal-card').should('not.exist');

    // 8. Verify the new member row exists in the team list
    cy.get('.member-list .member-row').should('have.length.at.least', 1);
  });
});