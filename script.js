const chains = [
  { id: 1, name: "ethereum", icon: "icons/eth.svg" },
  { id: 56, name: "binance", icon: "icons/bnb.svg" },
  { id: 137, name: "polygon", icon: "icons/polygon.svg" },
  { id: 42161, name: "arbitrum", icon: "icons/arbitrum.svg" },
  { id: 10, name: "optimism", icon: "icons/optimism.svg" },
  { id: 8453, name: "base", icon: "icons/base.svg" },
  { id: "solana", name: "solana", icon: "icons/solana.svg" }
];

function tag(value, successLabel = "Yes", failLabel = "No") {
  if (value === "1" || value === true) return `<span class="tag success">${successLabel}</span>`;
  if (value === "0" || value === false) return `<span class="tag warning">${failLabel}</span>`;
  return `<span class="tag na">N/A</span>`;
}

function clearInput() {
  const input = document.getElementById("contractInput");
  const resultBox = document.getElementById("resultBox");
  const clearBtn = document.getElementById("clearBtn");
  input.value = "";
  resultBox.innerHTML = "";
  resultBox.style.display = "none";
  clearBtn.style.display = "none";
}

function toggleClearButton() {
  const input = document.getElementById("contractInput");
  const clearBtn = document.getElementById("clearBtn");
  clearBtn.style.display = input.value.trim() ? "inline-block" : "none";
}

async function scanToken() {
  const token = document.getElementById("contractInput").value.trim();
  const box = document.getElementById("resultBox");
  box.style.display = "block";
  box.innerHTML = "🔍 Scanning token across supported chains...";

  if (!token) {
    box.innerHTML = `<p style="color: #ff4d4d; margin-top: 20px;">❗ Please enter a contract address.</p>`;
    return;
  }

  const isSolana = token.length === 44 || token.endsWith(".sol");
  if (isSolana) {
    return scanSolanaToken(token, box);
  }

  let found = false;

  for (const chain of chains.filter(c => typeof c.id === "number")) {
    try {
      const baseURL = `https://api.gopluslabs.io/api/v1`;
      const tokenLC = token.toLowerCase();

      const [
        tokenSec,
        contractSec,
        approvalSec,
        honeypot,
        phishing,
        dexData
      ] = await Promise.all([
        fetch(`${baseURL}/token_security/${chain.id}?contract_addresses=${token}`).then(r => r.json()),
        fetch(`${baseURL}/contract_security/${chain.id}?contract_addresses=${token}`).then(r => r.json()),
        fetch(`${baseURL}/approval_security/${chain.id}?contract_addresses=${token}`).then(r => r.json()),
        fetch(`${baseURL}/honeypot_detection/${chain.id}?contract_addresses=${token}`).then(r => r.json()),
        fetch(`${baseURL}/phishing_site_checker?url=${token}`).then(r => r.json()),
        fetch(`https://api.dexscreener.com/latest/dex/tokens/${token}`).then(r => r.json())
      ]);

      const resultKey = Object.keys(tokenSec.result || {})[0];
      if (!resultKey) continue;

      const data = tokenSec.result[resultKey];
      const contractData = contractSec.result?.[resultKey] || {};
      const approvalData = approvalSec.result?.[resultKey] || {};
      const honeypotData = honeypot.result?.[resultKey] || {};
      const phishingData = phishing.result?.[resultKey] || {};
      const dexInfo = dexData.pairs?.[0];

      if (!data) continue;

      found = true;

      const logoURL = `https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/${chain.name}/assets/${token}/logo.png`;

      const price = dexInfo?.priceUsd ?? data.price ?? "0.000000";
      const liquidity = dexInfo?.liquidity?.usd ?? data.total_liquidity ?? "N/A";
      const volume = dexInfo?.volume?.h24 ?? data.volume_24h ?? "N/A";

      box.innerHTML = `
        <div class="result-card evm">
          <div class="result-header">
            <img src="${logoURL}" class="chain-icon" onerror="this.src='${chain.icon}'" />
            <h3>${data.token_name || chain.name.toUpperCase()} (${data.symbol || ""})</h3>
          </div>
          <div class="result-body">
            <div class="result-row"><span>Buy/Sell Tax:</span><span>${data.buy_tax ?? "N/A"}% / ${data.sell_tax ?? "N/A"}%</span></div>
            <div class="result-row"><span>Owner:</span><span>${data.owner_address ?? "N/A"}</span></div>
            <div class="result-row"><span>Can Mint:</span>${tag(data.can_mint)}</div>
            <div class="result-row"><span>Can Blacklist:</span>${tag(data.can_blacklist)}</div>
            <div class="result-row"><span>Upgradeable:</span>${tag(contractData?.is_upgradable)}</div>
            <div class="result-row"><span>Self Destruct:</span>${tag(contractData?.selfdestruct)}</div>
            <div class="result-row"><span>Open Source:</span>${tag(data.is_open_source === "1" ? false : true, "No", "Yes")}</div>
            <div class="result-row"><span>Honeypot:</span>${tag(honeypotData?.is_honeypot === "0", "No", "Yes")}</div>
            <div class="result-row"><span>Approval Risk:</span>${tag(approvalData?.is_approval_check_needed)}</div>
            <div class="result-row"><span>Phishing:</span>${tag(phishingData?.risk, "Yes", "No")}</div>
            <div class="result-row"><span>Price:</span><span>$${price}</span></div>
            <div class="result-row"><span>Liquidity:</span><span>$${liquidity}</span></div>
            <div class="result-row"><span>24h Volume:</span><span>$${volume}</span></div>
          </div>
          <div class="result-risk">⚠️ Risk Factors: ✅ Checked on ${chain.name}</div>
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
    box.innerHTML = `<div class="result-card"><strong>❌ Token not found or unsupported chain. Coming soon...</strong></div>`;
  }
}
