// ============================================================
// ST-15: Notification Dropdown UI
// Objective: Bell icon opens dropdown; 'Mark all read' clears badge and list.
// Bell button: class="icon-btn"  inside div.notif-wrapper
// Badge: class="notif-badge"
// Dropdown: class="notif-dropdown"
// Mark all read: <button class="text-xs">Mark all read</button>
// Items: class="notif-item"
// ============================================================
describe('ST-15: Notification Dropdown UI', () => {
  beforeEach(() => {
    cy.viewport(1280, 720);
    cy.visit('http://localhost:5173/login');
    cy.get('input[type="email"]').type('admin@aakar.com');
    cy.get('input[type="password"]').type('admin123');
    cy.get('.btn-submit').click();
    cy.url().should('include', '/dashboard');
  });

  it('Bell icon toggles dropdown and Mark all read clears the badge', () => {
    // 1. Intercept notifications load
    cy.intercept('GET', '**/api/notifications**').as('getNotifications');
    cy.wait('@getNotifications');

    // 2. The notification dropdown is hidden initially (v-if="showNotifMenu")
    cy.get('.notif-dropdown').should('not.exist');

    // 3. Click the bell icon-btn inside notif-wrapper to open the dropdown
    cy.get('.notif-wrapper .icon-btn').click();
    cy.get('.notif-dropdown').should('be.visible');

    // 4. Intercept the mark-all-read PATCH request
    cy.intercept('PATCH', '**/api/notifications/read-all').as('markAllRead');

    // 5. Click 'Mark all read' button (only rendered when notifications.length > 0)
    cy.get('.notif-dropdown').contains('button', 'Mark all read').click();
    cy.wait('@markAllRead').its('response.statusCode').should('eq', 200);

    // 6. The red notification counter badge should disappear
    cy.get('.notif-badge').should('not.exist');

    // 7. The notification list should be replaced by the empty state message
    cy.get('.notif-dropdown .notif-item').should('have.length', 0);
    cy.get('.notif-dropdown .notif-empty').should('contain.text', 'No new notifications');
  });
});