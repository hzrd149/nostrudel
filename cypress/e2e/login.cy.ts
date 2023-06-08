describe("Login view", () => {
  beforeEach(() => {
    cy.visit("#/login");

    cy.window().then(($win) => {
      cy.stub($win, "prompt").returns("pass");
    });
  });

  it("login with nip05", () => {
    cy.intercept("get", "https://hzrd149.com/.well-known/nostr.json?name=_", {
      names: {
        _: "266815e0c9210dfa324c6cba3573b14bee49da4209a9456f9484e5106cd408a5",
      },
      relays: {
        "266815e0c9210dfa324c6cba3573b14bee49da4209a9456f9484e5106cd408a5": ["wss://nostrue.com"],
      },
    });

    cy.findByRole("link", { name: /nip-05/i }).click();

    cy.findByRole("textbox", { name: /nip-05/i }).type("_@hzrd149.com");
    cy.contains(/found 1 relays/i);
    cy.findByRole("button", { name: /login/i }).click();

    cy.findByRole("button", { name: "Home" }).should("be.visible");
  });

  it("login with npub", () => {
    cy.findByRole("link", { name: /npub/i }).click();
    cy.findByRole("textbox", { name: /npub/i }).type("npub1ye5ptcxfyyxl5vjvdjar2ua3f0hynkjzpx552mu5snj3qmx5pzjscpknpr");
    cy.findByRole("combobox", { name: /bootstrap relay/i })
      .clear()
      .type("wss://nostrue.com");
    cy.findByRole("button", { name: /login/i }).click();

    cy.findByRole("button", { name: "Home" }).should("be.visible");
  });

  it("login with new nsec", () => {
    cy.findByRole("link", { name: /nsec/i }).click();
    cy.findByRole("button", { name: /generate/i }).click();
    cy.findByRole("combobox", { name: /bootstrap relay/i })
      .clear()
      .type("wss://nostrue.com");
    cy.findByRole("button", { name: /login/i }).click();

    cy.findByRole("button", { name: "Home" }).should("be.visible");
  });
});
