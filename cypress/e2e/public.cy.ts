describe("No account", () => {
  describe("note view", () => {
    it("should fetch and render note", () => {
      cy.visit(
        "/n/nevent1qqs84hwdlls703w4yf66qsszxjqfc0xselfxrzr6n4qp40vzdnczragpr4mhxue69uhkummnw3ez6ur4vgh8wetvd3hhyer9wghxuet5jcwczn"
      );

      cy.get(".chakra-card")
        .first()
        .within(() => {
          // check for note content
          cy.contains('I didn\'t know someone had taken the "rsslay" idea and made it good');

          // check for author name
          cy.get(".chakra-card__header .chakra-heading .chakra-link").should("not.contain", "npub");
        });

      // check for multiple replies
      cy.get(".chakra-card").should("have.length.above", 2);
    });
  });
});
