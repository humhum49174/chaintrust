const chains = [
  { id: 1, name: "ethereum", icon: "icons/eth.svg" },
  { id: 56, name: "binance", icon: "icons/bnb.svg" },
  { id: 137, name: "polygon", icon: "icons/polygon.svg" },
  { id: 42161, name: "arbitrum", icon: "icons/arbitrum.svg" },
  { id: 8453, name: "base", icon: "icons/base.svg" },
  { id: 10, name: "optimism", icon: "icons/optimism.svg" },
  { id: 324, name: "zksync", icon: "icons/zksync.svg" }
];

function tag(value, successLabel = "Yes", failLabel = "No") {
  if (value === "1" || value === true) return `<span class="tag warning">${successLabel}</span>`;
  if (value === "0" || value === false) return `<span class="tag success">${failLabel}</span>`;
  return `<span class="tag na">N/A</span>`;
}

async function scanToken() {
  const token = document.getElementById("contractInput").value.trim();
  const box = document.getElementById("resultBox");
  box.style.display = "block";
  box.innerHTML = "🔄 Scanning...";

  if (!token) {
    box.innerHTML = "❗ Please enter a contract address.";
    return;
  }

  const tokenLC = token.toLowerCase();
  const baseURL = "https://api.gopluslabs.io/api/v1";

  let found = false;

  for (const chain of chains) {
    try {
      const [sec, con, appr, honeypot, phish] = await Promise.all([
        fetch(`${baseURL}/token_security/${chain.id}?contract_addresses=${token}`).then(r => r.json()),
        fetch(`${baseURL}/contract_security/${chain.id}?contract_addresses=${token}`).then(r => r.json()),
        fetch(`${baseURL}/approval_security/${chain.id}?contract_addresses=${token}`).then(r => r.json()),
        fetch(`${baseURL}/honeypot_detection/${chain.id}?contract_addresses=${token}`).then(r => r.json()),
        fetch(`${baseURL}/phishing_site_checker?url=${token}`).then(r => r.json())
      ]);

      const d = sec.result?.[tokenLC];
      if (!d) continue;
      found = true;

      const c = con.result?.[tokenLC];
      const a = appr.result?.[tokenLC];
      const h = honeypot.result?.[tokenLC];
      const p = phish.result?.[tokenLC];
      const logo = `https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/${chain.name}/assets/${token}/logo.png`;

      box.innerHTML = `
        <div class="result-card evm">
          <div class="result-header">
            <img src="${logo}" class="chain-icon" onerror="this.src='${chain.icon}'" />
            <h3>${chain.name.toUpperCase()} Token</h3>
          </div>
          <div class="result-body">
            <div class="result-row"><span>Buy/Sell Tax:</span><span>${d.buy_tax}% / ${d.sell_tax}%</span></div>
            <div class="result-row"><span>Owner Address:</span><span>${d.owner_address}</span></div>
            <div class="result-row"><span>Can Mint:</span>${tag(d.can_mint)}</div>
            <div class="result-row"><span>Can Blacklist:</span>${tag(d.can_blacklist)}</div>
            <div class="result-row"><span>Is Open Source:</span>${tag(d.is_open_source)}</div>
            <div class="result-row"><span>Proxy Contract:</span>${tag(c?.is_proxy)}</div>
            <div class="result-row"><span>Upgradeable:</span>${tag(c?.is_upgradable)}</div>
            <div class="result-row"><span>Self Destruct:</span>${tag(c?.selfdestruct)}</div>
            <div class="result-row"><span>Hidden Owner:</span>${tag(c?.hidden_owner)}</div>
            <div class="result-row"><span>External Calls:</span>${tag(c?.external_call)}</div>
            <div class="result-row"><span>Approval Risk:</span>${tag(a?.is_approval_check_needed)}</div>
            <div class="result-row"><span>Honeypot:</span>${tag(h?.is_honeypot === "0", "No", "Yes")}</div>
            <div class="result-row"><span>Phishing Detected:</span>${tag(p?.risk, "Yes", "No")}</div>
          </div>
        </div>
      `;
      break;
    } catch (err) {
      console.error(`Error on ${chain.name}:`, err);
    }
  }

  if (!found) {
    box.innerHTML = `<div class="result-card"><strong>❌ Token not found or no security data available.</strong></div>`;
  }
}