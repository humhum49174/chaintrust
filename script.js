const chains = [
  { id: 1, name: "ethereum", icon: "icons/eth.svg" },
  { id: 56, name: "binance", icon: "icons/bnb.svg" },
  { id: 137, name: "polygon", icon: "icons/polygon.svg" },
  { id: 42161, name: "arbitrum", icon: "icons/arbitrum.svg" }
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

  let found = false;

  for (const chain of chains) {
    try {
      const baseURL = `https://api.gopluslabs.io/api/v1`;
      const tokenLC = token.toLowerCase();

      // Alle Sicherheitsendpunkte abfragen
      const [
        tokenSec,
        contractSec,
        approvalSec,
        honeypot,
        phishing
      ] = await Promise.all([
        fetch(`${baseURL}/token_security/${chain.id}?contract_addresses=${token}`).then(r => r.json()),
        fetch(`${baseURL}/contract_security/${chain.id}?contract_addresses=${token}`).then(r => r.json()),
        fetch(`${baseURL}/approval_security/${chain.id}?contract_addresses=${token}`).then(r => r.json()),
        fetch(`${baseURL}/honeypot_detection/${chain.id}?contract_addresses=${token}`).then(r => r.json()),
        fetch(`${baseURL}/phishing_site_checker?url=${token}`).then(r => r.json())
      ]);

      const data = tokenSec.result?.[tokenLC];
      const contractData = contractSec.result?.[tokenLC];
      const approvalData = approvalSec.result?.[tokenLC];
      const honeypotData = honeypot.result?.[tokenLC];
      const phishingData = phishing.result?.[tokenLC];

      if (!data) continue;

      found = true;

      const logoURL = `https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/${chain.name}/assets/${token}/logo.png`;

      box.innerHTML = `
        <div class="result-card evm">
          <div class="result-header">
            <img src="${logoURL}" class="chain-icon" onerror="this.src='${chain.icon}'" />
            <h3>${chain.name.charAt(0).toUpperCase() + chain.name.slice(1)} Token</h3>
          </div>
          <div class="result-body">
            <div class="result-row"><span>Honeypot:</span>${tag(honeypotData?.is_honeypot === "0", "No", "Yes")}</div>
            <div class="result-row"><span>Buy/Sell Tax:</span><span>${data.buy_tax}% / ${data.sell_tax}%</span></div>
            <div class="result-row"><span>Owner:</span><span>${data.owner_address}</span></div>
            <div class="result-row"><span>Can Blacklist:</span>${tag(data.can_blacklist)}</div>
            <div class="result-row"><span>Can Mint:</span>${tag(data.can_mint)}</div>
            <div class="result-row"><span>Open Source:</span>${tag(data.is_open_source)}</div>
            <div class="result-row"><span>Proxy Contract:</span>${tag(contractData?.is_proxy)}</div>
            <div class="result-row"><span>Upgradeable:</span>${tag(contractData?.is_upgradable)}</div>
            <div class="result-row"><span>Hidden Owner:</span>${tag(contractData?.hidden_owner)}</div>
            <div class="result-row"><span>Self Destruct:</span>${tag(contractData?.selfdestruct)}</div>
            <div class="result-row"><span>External Calls:</span>${tag(contractData?.external_call)}</div>
            <div class="result-row"><span>Phishing Detected:</span>${tag(phishingData?.risk, "Yes", "No")}</div>
            <div class="result-row"><span>Token Approval Risk:</span>${tag(approvalData?.is_approval_check_needed)}</div>
          </div>
        </div>
      `;
      break;

    } catch (e) {
      console.warn(`Error on ${chain.name}:`, e);
    }
  }

  if (!found) {
    box.innerHTML = `<div class="result-card"><strong>❌ Token not found or no security data available.</strong></div>`;
  }
}
