describe("Embeds", () => {
  describe("hashtags", () => {
    it('should handle uppercase hashtags and ","', () => {
      cy.visit(
        "#/n/nevent1qqsrj5ns6wva3fcghlyx0hp7hhajqtqk3kuckp7xhhscrm4jl7futegpz9mhxue69uhkummnw3e82efwvdhk6qgswaehxw309ahx7um5wgh8w6twv5pkpt8l",
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
        "#/n/nevent1qqsfn2mv3pe2v7jak4r5wnyengt36t0rx26w04hgysrmtpml8jnlk5cprdmhxue69uhkvet9v3ejumn0wd68ytnzv9hxgtmdv4kk2qgawaehxw309ahx7um5wgkhqatz9emk2mrvdaexgetj9ehx2aq2wry06",
      );

      cy.get('[href="https://trustless.computer/"]').should("be.visible");
      cy.get(
        '[href="https://mempool.space/tx/461c6f56015c94d74837b68c9d08f4b80e7db7ca1e5ac4c53d9aa8c76b667672"]',
      ).should("be.visible");
    });

    it("embeds links", () => {
      cy.visit(
        "#/n/nevent1qqsvg6kt4hl79qpp5p673g7ref6r0c5jvp4yys7mmvs4m50t30sy9dgpz9mhxue69uhkummnw3e82efwvdhk6qgjwaehxw309aex2mrp0yhxvdm69e5k7r3xlpe",
      );

      cy.get('[href="https://getalby.com/"]').should("exist");
      cy.get('[href="https://lightningaddress.com/"]').should("exist");
      cy.get('[href="https://snort.social/"]').should("exist");
      cy.get('[href="http://damus.io/"]').should("exist");
      cy.get('[href="https://vida.live/"]').should("exist");
    });

    it("embeds simplex.chat links", () => {
      cy.visit(
        "#/n/nevent1qqsymds0vlpp4f5s0dckjf4qz283pdsen0rmx8lu7ct6hpnxag2hpacpremhxue69uhkummnw3ez6un9d3shjtnwda4k7arpwfhjucm0d5q3qamnwvaz7tmwdaehgu3wwa5kueghxyq76",
      );

      cy.get(
        '[href="https://simplex.chat/contact#/?v=1-2&smp=smp%3A%2F%2F0YuTwO05YJWS8rkjn9eLJDjQhFKvIYd8d4xG8X1blIU%3D%40smp8.simplex.im%2FVlHiRmia02CDgga7w-uNb2FQZTZsj3UR%23%2F%3Fv%3D1-2%26dh%3DMCowBQYDK2VuAyEAd2GEWU9Zjrljhw8O4FldcxrqehkDWezXl-cWD-VkeEw%253D%26srv%3Dbeccx4yfxxbvyhqypaavemqurytl6hozr47wfc7uuecacjqdvwpw2xid.onion"]',
      ).should("be.visible");
    });
  });

  describe("Nostr links", () => {
    it("should embed noub1...", () => {
      cy.visit(
        "#/n/nevent1qqsd5yw7sntqfc4e7u4aempvgctry2plz653t9gpf97ctk5vc0ftskgpz3mhxue69uhhyetvv9ujuerpd46hxtnfduq3zamnwvaz7tmwdaehgun4v5hxxmmdfxdj3a",
      );
      cy.contains("Alby team");

      cy.get(".chakra-card")
        .first()
        .within(() => {
          cy.get('[href="#/u/npub13sajvl5ak6cpz4ycesl0e5v869r5sey5pt50l9mcy6uas0fqtpmscth4np"]').should("be.visible");
          cy.get('[href="#/u/npub167n5w6cj2wseqtmk26zllc7n28uv9c4vw28k2kht206vnghe5a7stgzu3r"]').should("be.visible");

          // make sure the leading @ is removed
          cy.get(".chakra-card__body").should("not.contain.text", "@@");
        });
    });
  });

  describe("youtube", () => {
    it("should embed playlists", () => {
      cy.visit(
        "#/n/nevent1qqs8w6e63smpr5ccmz4l0w5pvnkp6r7z2fxaadjwu2g74y95pl9xv0cpzpmhxue69uhkummnw3ezuamfdejszrthwden5te0dehhxtnvdakqqkgf54",
      );

      cy.findByTitle(/youtube video player/i).should("be.visible");
      cy.findByTitle(/youtube video player/i).should("have.attr", "src");
    });
  });

  describe("Music", () => {
    it("should handle wavlake links", () => {
      cy.visit(
        "#/n/nevent1qqsve4ud5v8gjds2f2h7exlmjvhqayu4s520pge7frpwe22wezny0pcpp4mhxue69uhkummn9ekx7mqprdmhxue69uhkvet9v3ejumn0wd68ytnzv9hxgtmdv4kk2mxs3z0",
      );
      cy.findByTitle("Wavlake Embed").should("be.visible");
    });

    it("should handle spotify links", () => {
      cy.visit(
        "#/n/nevent1qqsx0lz7m72qzq499exwhnfszvgwea8tv38x9wkv32yhkmwwmhgs7jgprdmhxue69uhkvet9v3ejumn0wd68ytnzv9hxgtmdv4kk25m3sln",
      );
      cy.findByTitle("Spotify List Embed").should("exist");

      cy.visit(
        "#/n/nevent1qqsqxkmz49hydf8ppa9k6x6zrcq7m4evhhlye0j3lcnz8hrl2q6np4spz3mhxue69uhhyetvv9ujuerpd46hxtnfdult02qz",
      );
      cy.findByTitle("Spotify Embed").should("exist");
    });

    it("should handle apple music links", () => {
      cy.visit(
        "#/n/nevent1qqs9kqt9d7r4zjpawcyl82x5qsn4hals4wn294dv95knrahs4mggwasprdmhxue69uhkvet9v3ejumn0wd68ytnzv9hxgtmdv4kk2whhzvz",
      );
      cy.findByTitle("Apple Music Embed").should("exist");

      cy.visit(
        "#/n/nevent1qqszyrz4uug75j4086kj4f8peg3g0v8g9f04zjxplnpq0uxljtthggqprdmhxue69uhkvet9v3ejumn0wd68ytnzv9hxgtmdv4kk2aeexmq",
      );
      cy.findByTitle("Apple Music List Embed").should("exist");
    });

    it("should handle Tidal playlist links", () => {
      cy.visit("#/n/nevent1qqsg4d6rvg3te0y7sa0xp8r2rgcrnqyp2jmddzm4ufnmqs36aa2247qpp4mhxue69uhkummn9ekx7mqacwd3t");
      cy.findByTitle("Tidal List Embed").should("be.visible");
    });
  });

  describe("Emoji", () => {
    it("should embed emojis", () => {
      cy.visit(
        "#/n/nevent1qqsdj7k47uh4z0ypl2m29lvd4ar9zpf6dcy7ls0q6g6qctnxfj5n3pcpzpmhxue69uhkummnw3ezuamfdejszrthwden5te0dehhxtnvdakqdyqlpq",
      );

      cy.findByRole("img", { name: /pepeD/i }).should("be.visible");
    });
  });
});
