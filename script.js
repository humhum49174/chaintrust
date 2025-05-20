const chains = [
  { id: 1, name: "ethereum", icon: "icons/eth.svg" },
  { id: 56, name: "binance", icon: "icons/bnb.svg" },
  { id: 137, name: "polygon", icon: "icons/polygon.svg" },
  { id: 42161, name: "arbitrum", icon: "icons/arbitrum.svg" },
  { id: 8453, name: "base", icon: "icons/base.svg" },
  { id: 10, name: "optimism", icon: "icons/optimism.svg" }
];

function tag(value, successLabel = "Yes", failLabel = "No") {
  if (value === "1" || value === true) return `<span class="tag warning">${successLabel}</span>`;
  if (value === "0" || value === false) return `<span class="tag success">${failLabel}</span>`;
  return `<span class="tag na">N/A</span>`;
}

function getRiskRating(data, contractData, honeypotData) {
  const flags = [];

  if (data.can_mint === "1") flags.push("Token can be minted 🔥");
  if (data.can_blacklist === "1") flags.push("Blacklist function enabled 🚫");
  if (contractData?.is_upgradable === "1") flags.push("Upgradeable contract ⚙️");
  if (contractData?.selfdestruct === "1") flags.push("Self-destruct function 💣");
  if (honeypotData?.is_honeypot === "1") flags.push("⚠️ Honeypot detected!");
  if (data.owner_address?.toLowerCase() !== "0x0000000000000000000000000000000000000000")
    flags.push("Ownership not renounced ❗");

  let level = "✅ Low Risk";
  if (flags.length >= 3) level = "⚠️ Medium Risk";
  if (flags.length >= 5) level = "❌ High Risk";

  return { level, flags };
}

function toggleClearButton() {
  const input = document.getElementById("contractInput");
  const clearBtn = document.getElementById("clearButton");
  clearBtn.style.display = input.value ? "inline-block" : "none";
}

function clearInput() {
  const input = document.getElementById("contractInput");
  input.value = "";
  toggleClearButton();
  document.getElementById("resultBox").style.display = "none";
  document.getElementById("resultBox").innerHTML = "";
  input.focus();
}

async function scanToken() {
  const token = document.getElementById("contractInput").value.trim();
  const box = document.getElementById("resultBox");
  box.style.display = "block";
  box.innerHTML = "🔄 Scanning...";

  if (!token) {
    box.innerHTML = `<p style="color: #ff4d4d; margin-top: 20px;">❗ Please enter a contract address.</p>`;
    return;
  }

  let found = false;

  for (const chain of chains) {
    try {
      const baseURL = `https://api.gopluslabs.io/api/v1`;
      const tokenLC = token.toLowerCase();

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
      const { level, flags } = getRiskRating(data, contractData, honeypotData);

      box.innerHTML = `
        <div class="result-card evm">
          <div class="result-header">
            <img src="${logoURL}" class="chain-icon" onerror="this.src='${chain.icon}'" />
            <h3>${chain.name.toUpperCase()} Token</h3>
          </div>
          <div class="result-body">
            <div class="result-row"><span>Buy/Sell Tax:</span><span>${data.buy_tax}% / ${data.sell_tax}%</span></div>
            <div class="result-row"><span>Owner:</span><span>${data.owner_address}</span></div>
            <div class="result-row"><span>Can Mint:</span>${tag(data.can_mint)}</div>
            <div class="result-row"><span>Can Blacklist:</span>${tag(data.can_blacklist)}</div>
            <div class="result-row"><span>Upgradeable:</span>${tag(contractData?.is_upgradable)}</div>
            <div class="result-row"><span>Self Destruct:</span>${tag(contractData?.selfdestruct)}</div>
            <div class="result-row"><span>Open Source:</span>${tag(data.is_open_source)}</div>
            <div class="result-row"><span>Honeypot:</span>${tag(honeypotData?.is_honeypot === "0", "No", "Yes")}</div>
            <div class="result-row"><span>Approval Risk:</span>${tag(approvalData?.is_approval_check_needed)}</div>
            <div class="result-row"><span>Phishing:</span>${tag(phishingData?.risk, "Yes", "No")}</div>
            <div class="result-row"><span>Price:</span><span>$${data.price || "0.000000"}</span></div>
            <div class="result-row"><span>Liquidity:</span><span>$${data.total_liquidity || "N/A"}</span></div>
            <div class="result-row"><span>24h Volume:</span><span>$${data.volume_24h || "N/A"}</span></div>
          </div>
          <div class="result-risk">
            <h4>${level}</h4>
            <ul>${flags.map(f => `<li>🚩 ${f}</li>`).join("")}</ul>
          </div>
        </div>
      `;

      box.scrollIntoView({ behavior: "smooth" });

      const rows = document.querySelectorAll(".result-row");
      rows.forEach((row, i) => {
        row.style.opacity = 0;
        row.style.transform = "translateY(10px)";
        setTimeout(() => {
          row.style.opacity = 1;
          row.style.transform = "translateY(0)";
          row.style.transition = "all 0.5s ease";
        }, 100 * i);
      });

      break;
    } catch (e) {
      console.warn(`Error on ${chain.name}:`, e);
    }
  }

  if (!found) {
    box.innerHTML = `<div class="result-card"><strong>❌ Token not found or no security data available.</strong></div>`;
  }
}
