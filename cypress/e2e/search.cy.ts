describe("Search", () => {
  describe("Events", () => {
    const links: [string, RegExp][] = [
      [
        "nostr:nevent1qqsvg6kt4hl79qpp5p673g7ref6r0c5jvp4yys7mmvs4m50t30sy9dgpp4mhxue69uhkummn9ekx7mqpr4mhxue69uhkummnw3ez6ur4vgh8wetvd3hhyer9wghxuet59dl66z",
        /Nostr zaps - a guide/i,
      ],
      ["nostr:note10twumllpulza2gn45ppqydyqns7dpn7jvxy8482qr27cym8sy86sgxe3c8", /someone had taken/i],
    ];

    for (const [link, regexp] of links) {
      it(`should handle ${link}`, () => {
        cy.visit("/search");
        cy.findByRole("searchbox").type(link, { delay: 0 }).type("{enter}");

        cy.contains(regexp).should("be.visible");
      });
    }

    for (const [link, regexp] of links) {
      const withoutPrefix = link.replace("nostr:", "");
      it(`should handle ${withoutPrefix}`, () => {
        cy.visit("/search");
        cy.findByRole("searchbox").type(link, { delay: 0 }).type("{enter}");

        cy.contains(regexp).should("be.visible");
      });
    }
  });

  describe("Profiles", () => {
    const profiles: [string, RegExp][] = [
      [
        "nostr:nprofile1qqsp2alytxwazryxxjv0u0pqhkp247hc9xjetn5rch8c4s6xx5cmpxcpzpmhxue69uhkummnw3ezuamfdejsz9nhwden5te0v96xcctn9ehx7um5wghxcctwvs6ymk33",
        /npub1z4m7g\.\.\.kzdsxana6p/i,
      ],
      ["nostr:npub180cvv07tjdrrgpa0j7j7tmnyl2yr6yr7l8j4s3evf6u64th6gkwsyjh6w6", /npub180cvv\.\.\.gkwsyjh6w6/i],
    ];

    for (const [search, regexp] of profiles) {
      it(`should handle ${search}`, () => {
        cy.visit("/search");
        cy.findByRole("searchbox").type(search, { delay: 0 }).type("{enter}");

        cy.contains(regexp).should("be.visible");
      });
    }

    for (const [search, regexp] of profiles) {
      const withoutPrefix = search.replace("nostr:", "");
      it(`should handle ${withoutPrefix}`, () => {
        cy.visit("/search");
        cy.findByRole("searchbox").type(search, { delay: 0 }).type("{enter}");

        cy.contains(regexp).should("be.visible");
      });
    }
  });
});
