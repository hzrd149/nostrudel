export function handleMintInfoContactFieldDeprecated(data) {
    // Monkey patch old contact field ["email", "me@mail.com"] Array<[string, string]>; to new contact field [{method: "email", info: "me@mail.com"}] Array<MintContactInfo>
    // This is to maintain backwards compatibility with older versions of the mint
    if (Array.isArray(data === null || data === void 0 ? void 0 : data.contact) && (data === null || data === void 0 ? void 0 : data.contact.length) > 0) {
        data.contact = data.contact.map(function (contact) {
            if (Array.isArray(contact) &&
                contact.length === 2 &&
                typeof contact[0] === 'string' &&
                typeof contact[1] === 'string') {
                return { method: contact[0], info: contact[1] };
            }
            console.warn("Mint returned deprecated 'contact' field. Update NUT-06: https://github.com/cashubtc/nuts/pull/117");
            return contact;
        });
    }
    return data;
}
//# sourceMappingURL=nut-06.js.map