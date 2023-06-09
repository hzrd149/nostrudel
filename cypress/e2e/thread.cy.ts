describe("Thread", () => {
  it("should handle quote notes with e tags correctly", () => {
    cy.visit(
      "#/n/nevent1qqsx2lnyuke6vmsrz9fdrd6uwjy0g0e9l6menfgdj5truugkh9qmkkgpzpmhxue69uhkummnw3ezuamfdejszrthwden5te0dehhxtnvdakqgc9md6"
    );

    // find first note
    cy.get(".chakra-card")
      .first()
      .within(() => {
        // get quoted note
        cy.get(".chakra-card").within(() => {
          cy.contains(/looking for people to send money/);
        });
      });
  });
});
