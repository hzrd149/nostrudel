describe("Profile view", () => {
  it("should load a rss feed profile", () => {
    cy.visit(
      "#/u/nprofile1qqsp6hxqjatvxtesgszs8aee0fcjccxa3ef3mzjva4uv2yr5lucp6jcpzemhxue69uhhyumnd3shjtnwdaehgu3wd4hk2s8c5un"
    );

    cy.contains("fjsmu");
    cy.contains("https://rsshub.app/pixiv/user/7569500@rsslay.nostr.moe");
  });

  it("should load a rss feed fiatjef", () => {
    cy.visit("#/u/npub1l2vyh47mk2p0qlsku7hg0vn29faehy9hy34ygaclpn66ukqp3afqutajft");

    cy.contains("npub1l2vyh...3afqutajft");
  });
});
