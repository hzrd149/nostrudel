describe("Profile view", () => {
  it("should load user on single relay", () => {
    cy.visit(
      "/u/nprofile1qqsp6hxqjatvxtesgszs8aee0fcjccxa3ef3mzjva4uv2yr5lucp6jcpzemhxue69uhhyumnd3shjtnwdaehgu3wd4hk2s8c5un"
    );

    cy.contains("fjsmu");
    cy.contains("https://rsshub.app/pixiv/user/7569500@rsslay.nostr.moe");
  });
});
