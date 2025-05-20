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
  if (value === "1" || value === true) return `<span class="tag warning">${successLabel}</span>`;
  if (value === "0" || value === false) return `<span class="tag success">${failLabel}</span>`;
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
      const tokenLC = token.toLowerCase();
      const baseURL = `https://api.gopluslabs.io/api/v1`;

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

async function scanSolanaToken(address, box) {
  try {
    const response = await fetch(`https://rugcheck-proxy.onrender.com/?address=${address}`);
    const result = await response.json();

    if (!result || result.error) {
      box.innerHTML = `<div class="result-card"><strong>❌ Solana token not found or invalid address.</strong></div>`;
      return;
    }

    box.innerHTML = `
      <div class="result-card solana">
        <div class="result-header">
          <img src="icons/solana.svg" class="chain-icon" />
          <h3>SOLANA Token</h3>
        </div>
        <div class="result-body">
          <div class="result-row"><span>Renounced:</span>${tag(result.renounced)}</div>
          <div class="result-row"><span>LP Locked:</span>${tag(result.lp_locked)}</div>
          <div class="result-row"><span>Can Mint:</span>${tag(result.can_mint)}</div>
          <div class="result-row"><span>Owner:</span><span>${result.owner || "N/A"}</span></div>
        </div>
        <div class="result-risk">⚠️ Solana Token Risk: ✅ Scanned via RugCheck</div>
      </div>
    `;
  } catch (e) {
    box.innerHTML = `<div class="result-card"><strong>❌ Error scanning Solana token.</strong></div>`;
    console.error(e);
  }
}
