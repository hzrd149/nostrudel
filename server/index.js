var cors_proxy = require("cors-anywhere");
var { PacProxyAgent } = require("pac-proxy-agent");

const { TOR_PROXY, I2P_PROXY } = process.env;

if (TOR_PROXY) console.log("Tor Proxy:", TOR_PROXY);
if (I2P_PROXY) console.log("I2P Proxy:", I2P_PROXY);

const I2pConfig = I2P_PROXY
  ? `
if (shExpMatch(host, "*.i2p"))
{
  return "PROXY ${I2P_PROXY}";
}`.trim()
  : "";
const TorConfig = TOR_PROXY
  ? `
if (shExpMatch(host, "*.onion"))
{
  return "SOCKS5 ${TOR_PROXY}";
}`.trim()
  : "";

const PACFile = `
// SPDX-License-Identifier: CC0-1.0

function FindProxyForURL(url, host)
{
  ${I2pConfig}
  ${TorConfig}
  return "DIRECT";
}
`.trim();

const PACURI = "pac+data:application/x-ns-proxy-autoconfig;base64," + btoa(PACFile);

var host = "127.0.0.1";
var port = 8080;

cors_proxy
  .createServer({
    requireHeader: [],
    removeHeaders: ["cookie", "cookie2"],
    redirectSameOrigin: true,
    httpProxyOptions: {
      xfwd: false,
      agent: new PacProxyAgent(PACURI),
    },
  })
  .listen(port, host, () => {
    console.log("Running HTTP request proxy on " + host + ":" + port);
  });
