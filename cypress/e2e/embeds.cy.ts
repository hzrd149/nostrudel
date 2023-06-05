describe("Embeds", () => {
  describe("hashtags", () => {
    it('should handle uppercase hashtags and ","', () => {
      cy.visit(
        "/n/nevent1qqsrj5ns6wva3fcghlyx0hp7hhajqtqk3kuckp7xhhscrm4jl7futegpz9mhxue69uhkummnw3e82efwvdhk6qgswaehxw309ahx7um5wgh8w6twv5pkpt8l"
      );

      cy.findByRole("link", { name: "#Japan" }).should("be.visible");
      cy.findByRole("link", { name: "#kyudo" }).should("be.visible");
      cy.findByRole("link", { name: "#Shiseikan" }).should("be.visible");
      cy.findByRole("link", { name: "#Nostrasia" }).should("be.visible");
    });
  });

  describe("links", () => {
    it("embed trustless.computer links", () => {
      cy.visit(
        "/n/nevent1qqsfn2mv3pe2v7jak4r5wnyengt36t0rx26w04hgysrmtpml8jnlk5cprdmhxue69uhkvet9v3ejumn0wd68ytnzv9hxgtmdv4kk2qgawaehxw309ahx7um5wgkhqatz9emk2mrvdaexgetj9ehx2aq2wry06"
      );

      cy.get('[href="https://trustless.computer"]').should("be.visible");
      cy.get(
        '[href="https://mempool.space/tx/461c6f56015c94d74837b68c9d08f4b80e7db7ca1e5ac4c53d9aa8c76b667672"]'
      ).should("be.visible");
    });

    it("embeds links", () => {
      cy.visit(
        "/n/nevent1qqsvg6kt4hl79qpp5p673g7ref6r0c5jvp4yys7mmvs4m50t30sy9dgpz9mhxue69uhkummnw3e82efwvdhk6qgjwaehxw309aex2mrp0yhxvdm69e5k7r3xlpe"
      );

      cy.get('[href="https://getalby.com/"]').should("exist");
      cy.get('[href="https://lightningaddress.com/"]').should("exist");
      cy.get('[href="https://snort.social/"]').should("exist");
      cy.get('[href="http://damus.io/"]').should("exist");
      cy.get('[href="https://vida.live/"]').should("exist");
    });

    it("embeds simplex.chat links", () => {
      cy.visit(
        "/n/nevent1qqsymds0vlpp4f5s0dckjf4qz283pdsen0rmx8lu7ct6hpnxag2hpacpremhxue69uhkummnw3ez6un9d3shjtnwda4k7arpwfhjucm0d5q3qamnwvaz7tmwdaehgu3wwa5kueghxyq76"
      );

      cy.get(
        '[href="https://simplex.chat/contact#/?v=1-2&smp=smp%3A%2F%2F0YuTwO05YJWS8rkjn9eLJDjQhFKvIYd8d4xG8X1blIU%3D%40smp8.simplex.im%2FVlHiRmia02CDgga7w-uNb2FQZTZsj3UR%23%2F%3Fv%3D1-2%26dh%3DMCowBQYDK2VuAyEAd2GEWU9Zjrljhw8O4FldcxrqehkDWezXl-cWD-VkeEw%253D%26srv%3Dbeccx4yfxxbvyhqypaavemqurytl6hozr47wfc7uuecacjqdvwpw2xid.onion"]'
      ).should("be.visible");
    });
  });

  describe("Nostr links", () => {
    it("should embed noub1...", () => {
      cy.visit(
        "/n/nevent1qqsd5yw7sntqfc4e7u4aempvgctry2plz653t9gpf97ctk5vc0ftskgpz3mhxue69uhhyetvv9ujuerpd46hxtnfduq3zamnwvaz7tmwdaehgun4v5hxxmmdfxdj3a"
      );
      cy.contains("Alby team");

      cy.get(".chakra-card")
        .first()
        .within(() => {
          cy.get('[href="/u/npub13sajvl5ak6cpz4ycesl0e5v869r5sey5pt50l9mcy6uas0fqtpmscth4np"]').should("be.visible");
          cy.get('[href="/u/npub167n5w6cj2wseqtmk26zllc7n28uv9c4vw28k2kht206vnghe5a7stgzu3r"]').should("be.visible");

          // make sure the leading @ is removed
          cy.get(".chakra-card__body").should("not.contain.text", "@@");
        });
    });
  });
});
