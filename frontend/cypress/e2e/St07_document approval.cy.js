// ============================================================
// ST-07: Document Approval Flow
// Objective: BOQ Upload -> Appears in list -> Admin Approves -> Status updates
// ============================================================

describe('ST-07: Document Approval Flow', () => {

  beforeEach(() => {
    cy.viewport(1280, 720);
    cy.intercept('GET', '**/api/projects*').as('getProjects');
    cy.intercept('GET', '**/api/projects/*').as('getProjectDetail');
    cy.intercept('POST', '**/api/projects/*/documents').as('uploadDoc');
    cy.intercept('PATCH', '**/api/documents/*/approve').as('approveDoc');

    cy.visit('http://localhost:5173/login');
    cy.get('input[type="email"]').type('admin@aakar.com');
    cy.get('input[type="password"]').type('admin123');
    cy.get('.btn-submit').click();
    cy.url().should('include', '/dashboard');
  });

  it('Admin can upload a BOQ and approve it without a full page reload', () => {
    // 1. Navigate to Projects
    cy.contains('button.nav-item', 'Projects').click();
    cy.wait('@getProjects');

    // 2. Open the first project
    cy.get('.project-card').first().click();
    cy.wait('@getProjectDetail');

    // 3. Switch to Documents tab
    cy.contains('button.tab-btn', 'Documents').click();

    // 4. Open the upload modal
    cy.contains('button', 'Upload Document').click();

    // 5. Select BOQ as the document type (it is the default, but select explicitly)
    cy.get('.modal-card select').select('BOQ');

    // 6. Attach a dummy PDF file
    cy.get('.modal-card input[type="file"]').selectFile(
      { contents: Cypress.Buffer.from('dummy pdf content'), fileName: 'test_boq.pdf', mimeType: 'application/pdf' },
      { force: true }
    );

    // 7. Submit upload
    cy.contains('button[type="submit"]', 'Upload').click();
    cy.wait('@uploadDoc');

    // 8. The modal should close after upload
    cy.get('.modal-card').should('not.exist');

    // 9. The new BOQ item should appear in the doc list with an Approve button
    cy.get('.doc-list .doc-item').should('exist');
    cy.contains('button.btn.primary', 'Approve').should('be.visible');

    // 10. Click Approve — verify PATCH request fires (no full page reload)
    cy.contains('button.btn.primary', 'Approve').click();
    cy.wait('@approveDoc').its('response.statusCode').should('eq', 200);

    // 11. Approve button should be gone (status changed to approved, v-if removes it)
    cy.contains('button.btn.primary', 'Approve').should('not.exist');
  });
});