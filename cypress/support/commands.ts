/// <reference types="cypress" />
import "@testing-library/cypress/add-commands";

// ***********************************************
// This example commands.ts shows you how to
// create various custom commands and overwrite
// existing commands.
//
// For more comprehensive examples of custom
// commands please read more here:
// https://on.cypress.io/custom-commands
// ***********************************************
//
//
// -- This is a parent command --
// Cypress.Commands.add('login', (email, password) => { ... })
//
//
// -- This is a child command --
// Cypress.Commands.add('drag', { prevSubject: 'element'}, (subject, options) => { ... })
//
//
// -- This is a dual command --
// Cypress.Commands.add('dismiss', { prevSubject: 'optional'}, (subject, options) => { ... })
//
//
// -- This will overwrite an existing command --
// Cypress.Commands.overwrite('visit', (originalFn, url, options) => { ... })
//
declare global {
  namespace Cypress {
    interface Chainable {
      loginWithNewUser(): Chainable<void>;
    }
  }
}

Cypress.Commands.add("loginWithNewUser", () => {
  cy.visit("/login");

  cy.window().then(($win) => {
    cy.stub($win, "prompt").returns("pass");
  });

  cy.findByRole("link", { name: /nsec/i }).click();
  cy.findByRole("button", { name: /generate/i }).click();
  cy.findByRole("combobox", { name: /bootstrap relay/i })
    .clear()
    .type("wss://nostrue.com", { delay: 0 });
  cy.findByRole("button", { name: /login/i }).click();

  cy.findByRole("button", { name: "Home" }).should("be.visible");
});
